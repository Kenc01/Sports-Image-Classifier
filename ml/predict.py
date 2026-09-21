"""Run inference using a trained EfficientNet-B0 sports checkpoint."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
from PIL import Image
from torchvision import models, transforms


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    args = parser.parse_args()

    checkpoint = torch.load(args.checkpoint, map_location="cpu")
    classes = checkpoint["classes"]
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, len(classes))
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    evaluation_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(checkpoint.get("input_size", 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    with Image.open(args.image) as image:
        tensor = evaluation_transform(image.convert("RGB")).unsqueeze(0)

    with torch.no_grad():
        probabilities = torch.softmax(model(tensor), dim=1)[0]
    ranked = sorted(
        (
            {"label": classes[index].capitalize(), "confidence": float(probability)}
            for index, probability in enumerate(probabilities)
        ),
        key=lambda result: result["confidence"],
        reverse=True,
    )
    print(
        json.dumps(
            {
                "label": ranked[0]["label"],
                "confidence": ranked[0]["confidence"],
                "alternatives": ranked[1:],
                "model": "EfficientNet-B0",
            }
        )
    )


if __name__ == "__main__":
    main()