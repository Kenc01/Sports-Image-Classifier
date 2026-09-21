"""Train the sports image classifier with EfficientNet-B0 transfer learning.

Expected dataset layout:
  ml/data/sports/
    baseball/*.jpg
    softball/*.jpg
    cricket/*.jpg

Run:
  python3 ml/train.py --epochs 10
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import torch
from PIL import Image
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms


CLASSES = ["baseball", "softball", "cricket"]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


class SportsDataset(Dataset[tuple[torch.Tensor, int]]):
    def __init__(self, samples: list[tuple[Path, int]], transform: transforms.Compose):
        self.samples = samples
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        image_path, label = self.samples[index]
        with Image.open(image_path) as image:
            tensor = self.transform(image.convert("RGB"))
        return tensor, label


def collect_samples(data_dir: Path) -> list[tuple[Path, int]]:
    samples: list[tuple[Path, int]] = []
    for label, class_name in enumerate(CLASSES):
        class_dir = data_dir / class_name
        if not class_dir.exists():
            raise FileNotFoundError(
                f"Missing class directory: {class_dir}. "
                f"Create one for each of: {', '.join(CLASSES)}."
            )
        files = sorted(
            path
            for path in class_dir.rglob("*")
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        )
        if not files:
            raise ValueError(f"No images found in {class_dir}.")
        samples.extend((path, label) for path in files)
    return samples


def split_samples(
    samples: Iterable[tuple[Path, int]], seed: int
) -> tuple[list[tuple[Path, int]], list[tuple[Path, int]], list[tuple[Path, int]]]:
    rng = random.Random(seed)
    by_class = {index: [] for index in range(len(CLASSES))}
    for sample in samples:
        by_class[sample[1]].append(sample)

    splits = [[], [], []]
    for class_samples in by_class.values():
        rng.shuffle(class_samples)
        total = len(class_samples)
        train_end = max(1, int(total * 0.70))
        validation_end = max(train_end + 1, int(total * 0.85))
        validation_end = min(validation_end, total - 1) if total > 2 else total
        splits[0].extend(class_samples[:train_end])
        splits[1].extend(class_samples[train_end:validation_end])
        splits[2].extend(class_samples[validation_end:])

    for split in splits:
        rng.shuffle(split)
    return splits[0], splits[1], splits[2]


def make_model(device: torch.device) -> nn.Module:
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    for parameter in model.features.parameters():
        parameter.requires_grad = False
    input_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(input_features, len(CLASSES))
    return model.to(device)


@torch.no_grad()
def evaluate(
    model: nn.Module, loader: DataLoader, device: torch.device
) -> tuple[float, float, float, list[list[int]]]:
    model.eval()
    confusion = [[0 for _ in CLASSES] for _ in CLASSES]
    for images, labels in loader:
        predictions = model(images.to(device)).argmax(dim=1).cpu()
        for actual, predicted in zip(labels.tolist(), predictions.tolist()):
            confusion[actual][predicted] += 1

    total = sum(sum(row) for row in confusion)
    correct = sum(confusion[index][index] for index in range(len(CLASSES)))
    accuracy = correct / total if total else 0.0
    precisions = []
    recalls = []
    for index in range(len(CLASSES)):
        true_positive = confusion[index][index]
        predicted_positive = sum(row[index] for row in confusion)
        actual_positive = sum(confusion[index])
        precisions.append(true_positive / predicted_positive if predicted_positive else 0.0)
        recalls.append(true_positive / actual_positive if actual_positive else 0.0)
    return accuracy, sum(precisions) / len(precisions), sum(recalls) / len(recalls), confusion


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=Path("ml/data/sports"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    samples = collect_samples(args.data_dir)
    train_samples, validation_samples, test_samples = split_samples(samples, args.seed)

    train_transform = transforms.Compose(
        [
            transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(12),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )
    evaluation_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )
    train_loader = DataLoader(
        SportsDataset(train_samples, train_transform),
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0,
    )
    validation_loader = DataLoader(
        SportsDataset(validation_samples, evaluation_transform),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0,
    )
    test_loader = DataLoader(
        SportsDataset(test_samples, evaluation_transform),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0,
    )

    model = make_model(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        (parameter for parameter in model.parameters() if parameter.requires_grad),
        lr=args.learning_rate,
    )
    best_accuracy = -1.0
    checkpoint_dir = Path("ml/checkpoints")
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = checkpoint_dir / "efficientnet_b0_sports.pt"

    for epoch in range(args.epochs):
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            optimizer.zero_grad()
            logits = model(images.to(device))
            loss = criterion(logits, labels.to(device))
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * len(labels)

        validation_accuracy, _, _, _ = evaluate(model, validation_loader, device)
        average_loss = running_loss / max(1, len(train_samples))
        print(
            json.dumps(
                {
                    "epoch": epoch + 1,
                    "epochs": args.epochs,
                    "loss": round(average_loss, 5),
                    "validationAccuracy": round(validation_accuracy, 5),
                }
            ),
            flush=True,
        )
        if validation_accuracy > best_accuracy:
            best_accuracy = validation_accuracy
            torch.save(
                {
                    "model_state": model.state_dict(),
                    "classes": CLASSES,
                    "input_size": 224,
                },
                checkpoint_path,
            )

    model.load_state_dict(torch.load(checkpoint_path, map_location=device)["model_state"])
    accuracy, precision, recall, confusion = evaluate(model, test_loader, device)
    metrics = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "epochs": args.epochs,
        "lastRun": datetime.now(timezone.utc).isoformat(),
        "confusionMatrix": confusion,
        "classCounts": {
            class_name: sum(1 for _, label in samples if label == index)
            for index, class_name in enumerate(CLASSES)
        },
        "splitCounts": {
            "train": len(train_samples),
            "validation": len(validation_samples),
            "test": len(test_samples),
        },
        "device": str(device),
    }
    output_dir = Path("ml/outputs")
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics), flush=True)


if __name__ == "__main__":
    main()