# StyleForge AI

A web app for **neural style transfer**. Upload a content photo and a style image, adjust the style strength, and get a newly stylized image.

## Tech stack
- **Frontend:** HTML, CSS, vanilla JavaScript (hosted on Vercel)
- **Backend:** FastAPI + PyTorch (hosted on Hugging Face Spaces, Docker)
- **Model:** AdaIN (Adaptive Instance Normalization) with a VGG-19 encoder and a trained decoder

## How it works
AdaIN matches the channel-wise mean and standard deviation of the content features to those of the style features, then a decoder turns the result back into an image. The **style strength** slider is the AdaIN alpha value, which blends the original and stylized features.

## Run locally
Backend:
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --index-url https://download.pytorch.org/whl/cpu torch==2.7.0+cpu torchvision==0.22.0+cpu
pip install -r requirements.txt
.\download_models.ps1
python -m uvicorn app.main:app --port 8000
```

Frontend (in a second terminal):
```powershell
cd frontend
python -m http.server 5500
```
Open http://localhost:5500

## API
- `GET /` health check
- `POST /stylize` multipart form with `content`, `style` and `strength` (0.0 to 1.0); returns a PNG

## Limitations
- Runs on CPU, so large images are resized to 512 px on the longest side
- Sign In is a client-side demo (accounts are stored in the browser)

## Credits
- Huang and Belongie (2017), *Arbitrary Style Transfer in Real-Time with Adaptive Instance Normalization*: https://arxiv.org/abs/1703.06868
- Pretrained weights and reference implementation: https://github.com/naoto0804/pytorch-AdaIN (MIT license)
