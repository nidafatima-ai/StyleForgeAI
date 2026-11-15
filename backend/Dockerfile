FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN useradd --create-home --shell /bin/bash appuser

COPY requirements.txt .

# Exact CPU-only PyTorch installation.
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.7.0+cpu torchvision==0.22.0+cpu

RUN pip install --no-cache-dir \
    fastapi==0.115.12 \
    uvicorn[standard]==0.34.2 \
    python-multipart==0.0.20 \
    pillow==11.2.1 \
    numpy==2.2.6

COPY app ./app

# Check both official release assets and download during image build.
RUN python -c "import urllib.request; urls=['https://github.com/naoto0804/pytorch-AdaIN/releases/download/v0.0.0/vgg_normalised.pth','https://github.com/naoto0804/pytorch-AdaIN/releases/download/v0.0.0/decoder.pth']; [urllib.request.urlopen(urllib.request.Request(u, method='HEAD'), timeout=30).close() for u in urls]"

RUN mkdir -p /app/models && python -c "import urllib.request,time,pathlib; urls={'vgg_normalised.pth':'https://github.com/naoto0804/pytorch-AdaIN/releases/download/v0.0.0/vgg_normalised.pth','decoder.pth':'https://github.com/naoto0804/pytorch-AdaIN/releases/download/v0.0.0/decoder.pth'}; [(lambda name,url: [(time.sleep(3),None) for _ in []] or urllib.request.urlretrieve(url, '/app/models/'+name))(n,u) for n,u in urls.items()]"

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

