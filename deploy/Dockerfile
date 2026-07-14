FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml .
RUN uv sync --frozen

COPY . .

ENV PYTHONPATH=/app

EXPOSE 8000 9464

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
