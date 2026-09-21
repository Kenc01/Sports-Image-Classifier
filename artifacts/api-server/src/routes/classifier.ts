import { Router, type IRouter } from "express";
import { PredictClassifierBody } from "@workspace/api-zod";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const projectRoot = existsSync(path.join(process.cwd(), "ml"))
  ? process.cwd()
  : path.resolve(process.cwd(), "../..");
const dataRoot = path.join(projectRoot, "ml", "data", "sports");
const metricsPath = path.join(projectRoot, "ml", "outputs", "metrics.json");
const checkpointPath = path.join(
  projectRoot,
  "ml",
  "checkpoints",
  "efficientnet_b0_sports.pt",
);

const classes = [
  {
    slug: "baseball",
    label: "Baseball",
    description:
      "A baseball, typically recognized by its white cover and red stitching.",
    targetCount: 300,
  },
  {
    slug: "softball",
    label: "Softball",
    description:
      "A larger softball with distinctive seam patterns and a larger visual profile.",
    targetCount: 300,
  },
  {
    slug: "cricket",
    label: "Cricket",
    description:
      "A cricket ball with a dense stitched seam and traditionally red or white finish.",
    targetCount: 300,
  },
] as const;

type Metrics = {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  epochs: number | null;
  lastRun: string | null;
};

const emptyMetrics: Metrics = {
  accuracy: null,
  precision: null,
  recall: null,
  epochs: null,
  lastRun: null,
};

function runProcess(command: string, args: string[]) {
  return new Promise<{ stdout: Buffer; stderr: Buffer }>((resolve, reject) => {
    const child = spawn(command, args);
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) {
        resolve({
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr),
        });
      } else {
        reject(
          new Error(
            Buffer.concat(stderr).toString("utf8") ||
              `Process exited with code ${code}`,
          ),
        );
      }
    });
  });
}

async function countImages(directory: string) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter(
      (entry) => entry.isFile() && /\.(jpe?g|png|webp)$/i.test(entry.name),
    ).length;
  } catch {
    return 0;
  }
}

async function loadMetrics(): Promise<Metrics> {
  try {
    const parsed = JSON.parse(
      await readFile(metricsPath, "utf8"),
    ) as Partial<Metrics>;
    return {
      accuracy: typeof parsed.accuracy === "number" ? parsed.accuracy : null,
      precision: typeof parsed.precision === "number" ? parsed.precision : null,
      recall: typeof parsed.recall === "number" ? parsed.recall : null,
      epochs: typeof parsed.epochs === "number" ? parsed.epochs : null,
      lastRun: typeof parsed.lastRun === "string" ? parsed.lastRun : null,
    };
  } catch {
    return emptyMetrics;
  }
}

router.get("/classifier/overview", async (_req, res) => {
  const counts = await Promise.all(
    classes.map((item) => countImages(path.join(dataRoot, item.slug))),
  );
  const totalImages = counts.reduce((sum, count) => sum + count, 0);
  const trainImages = Math.floor(totalImages * 0.7);
  const validationImages = Math.floor(totalImages * 0.15);
  const testImages = totalImages - trainImages - validationImages;
  const datasetReady = counts.every((count) => count >= 300);
  const inferenceReady = existsSync(checkpointPath);
  const metrics = await loadMetrics();

  res.json({
    projectName: "Sports image classifier",
    model: "EfficientNet-B0",
    modelFamily: "Efficient CNN",
    modelRationale:
      "EfficientNet-B0 offers a strong accuracy-to-size trade-off for a small, balanced dataset. It is more expressive than MobileNet for fine visual differences while using less compute than ResNet-50 or a transformer.",
    inputSize: 224,
    dataset: {
      totalImages,
      trainImages,
      validationImages,
      testImages,
      isReady: datasetReady,
      readinessLabel: datasetReady
        ? "Ready for training"
        : "Add 300–500 images per class",
      split: "70% train · 15% validation · 15% test",
    },
    classes,
    metrics,
    inferenceReady,
    inferenceMessage: inferenceReady
      ? "A trained checkpoint is available for inference."
      : "Train the model with ml/train.py before running predictions.",
  });
});

router.post("/classifier/predict", async (req, res) => {
  const parsed = PredictClassifierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Please provide a valid base64 image data URL.",
      code: "INVALID_IMAGE_INPUT",
    });
    return;
  }

  if (!existsSync(checkpointPath)) {
    res.status(503).json({
      error:
        "No trained checkpoint is available yet. Run ml/train.py after adding the dataset.",
      code: "MODEL_NOT_READY",
    });
    return;
  }

  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(
    parsed.data.imageData,
  );
  if (!match || match[2].length > 15_000_000) {
    res.status(400).json({
      error: "Only JPEG, PNG, and WebP images under 10 MB are supported.",
      code: "UNSUPPORTED_IMAGE",
    });
    return;
  }

  const tempDirectory = path.join(projectRoot, "ml", "tmp");
  const tempFile = path.join(
    tempDirectory,
    `${randomUUID()}.${match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase()}`,
  );
  await mkdir(tempDirectory, { recursive: true });

  try {
    await writeFile(tempFile, Buffer.from(match[2], "base64"));
    const python = process.env.PYTHON_BIN || "python3";
    const result = await runProcess(python, [
      path.join(projectRoot, "ml", "predict.py"),
      "--image",
      tempFile,
      "--checkpoint",
      checkpointPath,
    ]);
    const output = result.stdout.toString().trim();
    const prediction = JSON.parse(output);
    res.json(prediction);
  } catch (error) {
    logger.error({ error }, "Classifier inference failed");
    res.status(503).json({
      error:
        "The checkpoint could not run. Check the Python dependencies and model file.",
      code: "INFERENCE_FAILED",
    });
  } finally {
    await rm(tempFile, { force: true });
  }
});

export default router;
