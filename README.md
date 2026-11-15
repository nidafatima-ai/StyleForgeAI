# StyleForge AI | NeuralArt

An AI-powered Neural Style Transfer application using Adaptive
Instance Normalization (AdaIN).

## Architecture

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: FastAPI
- Deep Learning: PyTorch
- Encoder: VGG-19
- Style transfer: AdaIN
- Decoder: Convolutional neural network
- Backend deployment: Hugging Face Docker Spaces
- Frontend deployment: Vercel

## Project structure

```text
StyleForgeAI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── net.py
│   │   └── main.py
│   ├── models/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── README.md
│   └── download_models.ps1
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── vercel.json
│   └── README.md
├── docs/
├── .gitignore
└── README.md
```

## Algorithm

AdaIN aligns the channel-wise mean and standard deviation of content
features with those of style features.

The transformed feature representation is interpolated with the
original content features using alpha, then reconstructed by a decoder.

## Run locally

1. Run 01_setup_structure.ps1.
2. Run 02_create_backend.ps1.
3. Run 03_create_frontend.ps1.
4. Run 04_test_local.ps1.

## Deployment

Run 05_deploy_all.ps1 after authenticating GitHub, Vercel and Hugging Face.

## Research reference

Huang and Belongie (2017).

Arbitrary Style Transfer in Real-Time with Adaptive Instance Normalization.

https://arxiv.org/abs/1703.06868

Original implementation:
https://github.com/naoto0804/pytorch-AdaIN

## Limitations

- CPU inference can be relatively slow.
- Output quality depends on the pretrained encoder and decoder.
- Large photographs are resized to a maximum dimension of 512 pixels.
- The application is designed for image style transfer, not identity replacement.
