import io
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from torchvision.transforms import ToTensor
from starlette.responses import StreamingResponse

from app.net import AdaINNet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neuralart")

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_FILE_SIZE = 8 * 1024 * 1024
MAX_DIMENSION = int(os.environ.get("MAX_DIMENSION", "512"))
DEVICE = torch.device("cpu")

model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model

    vgg_path = MODEL_DIR / "vgg_normalised.pth"
    decoder_path = MODEL_DIR / "decoder.pth"

    if not vgg_path.is_file() or not decoder_path.is_file():
        raise RuntimeError(
            "AdaIN checkpoints missing. Download them before startup."
        )

    logger.info("Loading AdaIN checkpoints on CPU...")
    model = AdaINNet(str(vgg_path), str(decoder_path))
    model.to(DEVICE)
    model.eval()
    logger.info("AdaIN model loaded successfully.")

    yield
    model = None


app = FastAPI(
    title="NeuralArt API",
    description="Neural Style Transfer powered by AdaIN.",
    version="1.0.0",
    lifespan=lifespan,
)

# For production, replace ["*"] with your exact Vercel frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/")
async def health():
    return {
        "status": "healthy",
        "model": "AdaIN",
        "device": str(DEVICE),
        "ready": model is not None,
    }


async def read_image(upload: UploadFile, field_name: str):
    if not upload.filename:
        raise HTTPException(400, f"{field_name}: filename is missing.")

    extension = Path(upload.filename).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(
            415, f"{field_name}: only JPG, JPEG, PNG and WEBP are allowed."
        )

    data = await upload.read(MAX_FILE_SIZE + 1)

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            413, f"{field_name}: maximum file size is 8 MB."
        )

    if not data:
        raise HTTPException(400, f"{field_name}: empty image.")

    try:
        image = Image.open(io.BytesIO(data))
        image.load()

        if image.format not in ALLOWED_FORMATS:
            raise HTTPException(
                415, f"{field_name}: unsupported image format."
            )

        image = image.convert("RGB")
        image.thumbnail(
            (MAX_DIMENSION, MAX_DIMENSION),
            Image.Resampling.LANCZOS,
        )
        return image

    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            400, f"{field_name}: invalid or corrupted image."
        )


@app.post("/stylize")
async def stylize(
    content: UploadFile = File(...),
    style: UploadFile = File(...),
    strength: float = Form(1.0),
):
    if model is None:
        raise HTTPException(503, "The AdaIN model is not ready.")

    if not 0.0 <= strength <= 1.0:
        raise HTTPException(400, "Strength must be between 0 and 1.")

    content_image = await read_image(content, "Content image")
    style_image = await read_image(style, "Style image")

    try:
        content_tensor = ToTensor()(content_image).unsqueeze(0).to(DEVICE)
        style_tensor = ToTensor()(style_image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            output = model.stylize(
                content_tensor,
                style_tensor,
                alpha=float(strength),
            )

        output = output.squeeze(0).cpu().clamp(0.0, 1.0)

        output_image = ToTensor  # Keep conversion explicit below.
        from torchvision.transforms.functional import to_pil_image

        result = to_pil_image(output)

        buffer = io.BytesIO()
        result.save(buffer, format="PNG")
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": 'inline; filename="neuralart.png"',
                "Cache-Control": "no-store",
            },
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("AdaIN inference failed.")
        raise HTTPException(
            500, "Style transfer failed. Check server logs."
        )
