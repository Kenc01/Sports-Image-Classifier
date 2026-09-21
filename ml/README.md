# Sports classifier training

This is the reproducible ML portion of the project brief. The model uses an ImageNet-pretrained EfficientNet-B0 backbone, replaces its classifier with three logits, applies the requested augmentations, and evaluates on a held-out 15% test split.

## 1. Install the Python dependencies

Install the Python dependencies through the Replit package manager, or run:

```bash
python3 -m pip install -r ml/requirements.txt
```

## 2. Add the dataset

Put balanced images into these folders:

```text
ml/data/sports/baseball/
ml/data/sports/softball/
ml/data/sports/cricket/
```

Aim for 300–500 images in each class. Use varied angles, lighting, backgrounds, and distances so the model learns the object rather than a repeated background.

## 3. Train and evaluate

```bash
python3 ml/train.py --epochs 10
```

The script creates:

- `ml/checkpoints/efficientnet_b0_sports.pt`
- `ml/outputs/metrics.json`

The web app reads those outputs automatically. Once the checkpoint exists, the `/predict` page can run real inference through the API.