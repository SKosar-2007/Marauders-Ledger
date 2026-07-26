FROM node:20-slim AS frontend-build

WORKDIR /app
RUN npm i -g pnpm

COPY stitch-frontend/package.json stitch-frontend/pnpm-lock.yaml* ./stitch-frontend/
RUN cd stitch-frontend && pnpm install --frozen-lockfile

COPY stitch-frontend/ ./stitch-frontend/
RUN cd stitch-frontend && pnpm build


FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir 'protobuf>=6.33.5' actian-vectorai-client

COPY backend/ .
COPY --from=frontend-build /app/stitch-frontend/dist /app/static

RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
