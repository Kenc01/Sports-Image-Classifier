# Sports Image Classifier

An EfficientNet-B0 computer-vision workspace for classifying baseball, softball, and cricket images.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `python3 -m pip install -r ml/requirements.txt` — install ML dependencies
- `python3 ml/train.py --epochs 10` — train and evaluate the classifier after adding images

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/sports-classifier/` — React dashboard with overview, prediction, and methodology routes
- `artifacts/api-server/src/routes/classifier.ts` — classifier overview and inference API
- `lib/api-spec/openapi.yaml` — source of truth for classifier API contracts
- `ml/train.py` — dataset split, augmentation, transfer learning, evaluation, and checkpoint export
- `ml/predict.py` — checkpoint-backed single-image inference
- `ml/data/sports/` — expected dataset folders for `baseball`, `softball`, and `cricket`

## Architecture decisions

- EfficientNet-B0 is used as the default ImageNet transfer-learning model because it balances accuracy and compute for a small three-class dataset.
- Inference is checkpoint-gated: the API never invents a label; it returns a clear model-not-ready response until a trained checkpoint exists.
- Dataset counts and evaluation metrics are read from the local ML workspace so the dashboard reflects the actual training state.

## Product

The dashboard tracks dataset readiness, explains the model choice and methodology, shows evaluation metrics after training, and runs confidence-scored predictions against the latest checkpoint.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The API expects the ML checkpoint at `ml/checkpoints/efficientnet_b0_sports.pt`.
- Images must be stored in one class folder each; aim for 300–500 images per class before training.
- The API reads paths relative to the workspace root, so run the API workflow from the project root as configured.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
