FROM python:3.14-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# COPY requirements.in .

RUN pip install --no-cache-dir pip-tools

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000