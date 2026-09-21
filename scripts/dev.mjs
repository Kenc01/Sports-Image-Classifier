import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const requestedPort = Number(process.env.PORT ?? "5173");
const requestedApiPort = Number(process.env.API_PORT ?? "5000");

const findAvailablePort = async (startingPort) => {
  let port = startingPort;

  while (true) {
    const server = net.createServer();

    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "0.0.0.0", resolve);
      });
      await new Promise((resolve) => server.close(resolve));
      return port;
    } catch (error) {
      await new Promise((resolve) => server.close(resolve));

      if (error.code !== "EADDRINUSE") {
        throw error;
      }

      port += 1;
    }
  }
};

const port = await findAvailablePort(requestedPort);
const apiPort = await findAvailablePort(requestedApiPort);
const rootDirectory = fileURLToPath(new URL("..", import.meta.url));
const environment = {
  ...process.env,
  PORT: String(port),
  BASE_PATH: process.env.BASE_PATH ?? "/",
  API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
};

const spawnOptions = {
  cwd: rootDirectory,
  env: environment,
  stdio: "inherit",
  shell: process.platform === "win32",
};

const run = (args, options = spawnOptions) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });

const apiBuild = await run([
  "--filter",
  "@workspace/api-server",
  "run",
  "build",
]);

if (apiBuild.code !== 0) {
  process.exit(apiBuild.code ?? 1);
}

const apiChild = spawn(
  command,
  ["--filter", "@workspace/api-server", "run", "start"],
  { ...spawnOptions, env: { ...environment, PORT: String(apiPort) } },
);

const frontendChild = spawn(
  command,
  ["--filter", "@workspace/sports-classifier", "run", "dev"],
  spawnOptions,
);

const stopChildren = () => {
  apiChild.kill();
  frontendChild.kill();
};

apiChild.once("exit", (code) => {
  if (code !== 0) {
    frontendChild.kill();
    process.exit(code ?? 1);
  }
});

frontendChild.on("exit", (code, signal) => {
  stopChildren();
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
