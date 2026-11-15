FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app
RUN useradd -m -u 1000 appuser

RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.7.0+cpu torchvision==0.22.0+cpu
RUN pip install --no-cache-dir fastapi==0.115.12 "uvicorn[standard]==0.34.2" python-multipart==0.0.20 pillow==11.2.1 numpy==2.2.6

COPY app ./app

RUN mkdir -p /app/models && python -c "import urllib.request as u; b='https://github.com/naoto0804/pytorch-AdaIN/releases/download/v0.0.0/'; [u.urlretrieve(b+n, '/app/models/'+n) for n in ('vgg_normalised.pth','decoder.pth')]"

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 7860
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]