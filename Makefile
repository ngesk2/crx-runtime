.PHONY: help install dev test lint format check clean docker-up docker-down docker-logs

help:
	@echo "Constitutional Runtime - Development Commands"
	@echo ""
	@echo "install:    Install dependencies with uv"
	@echo "dev:        Start development server"
	@echo "test:       Run tests"
	@echo "lint:       Run linter (ruff)"
	@echo "format:     Format code (ruff format)"
	@echo "check:      Run type checking (mypy)"
	@echo "clean:      Clean build artifacts"
	@echo "docker-up:  Start Docker containers"
	@echo "docker-down: Stop Docker containers"
	@echo "docker-logs: Show Docker logs"

install:
	uv sync --dev

dev:
	uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v --cov=. --cov-report=html

lint:
	ruff check .

format:
	ruff format .

check:
	mypy .

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	rm -rf .mypy_cache
	rm -rf htmlcov
	rm -rf .coverage

docker-up:
	docker-compose -f deploy/docker-compose.yml up -d

docker-down:
	docker-compose -f deploy/docker-compose.yml down

docker-logs:
	docker-compose -f deploy/docker-compose.yml logs -f
