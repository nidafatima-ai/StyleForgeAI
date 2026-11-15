---
title: NeuralArt AdaIN API
emoji: 🎨
colorFrom: purple
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# NeuralArt Backend

FastAPI and PyTorch implementation of Adaptive Instance Normalization.

## API

- GET / : Health check
- POST /stylize : Multipart image style transfer

## Checkpoints

The Docker image downloads the original AdaIN checkpoints during build.

Original repository:
https://github.com/naoto0804/pytorch-AdaIN

## CPU installation

```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

python -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.7.0+cpu torchvision==0.22.0+cpu

python -m pip install -r requirements.txt
```

## Docker

The image uses Python 3.11 slim, CPU-only PyTorch and a non-root user.
The service listens on port 7860.
