# Phase A: Build Graph

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Build System Analysis

---

## Build System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Source Code                              │
│              (Python modules, configuration)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Management                     │
│              (uv, pyproject.toml, requirements.txt)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Build Tools                               │
│              (ruff, mypy, pytest, black)                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Linting     │  │  Type Check  │  │   Testing    │
│   (ruff)     │  │   (mypy)     │  │  (pytest)    │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Artifacts                                 │
│              (Python packages, coverage reports)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Build Tools

### 1. Dependency Management
**Tool:** uv
**Configuration:** `pyproject.toml`, `requirements.txt`

**Commands:**
- `uv sync --dev` - Install dependencies with dev tools
- `uv sync` - Install production dependencies

**Dependencies:**
```
Core:
- fastapi>=0.109.0
- uvicorn[standard]>=0.27.0
- pydantic>=2.5.0
- pydantic-settings>=2.1.0
- sqlalchemy>=2.0.25
- alembic>=1.13.0
- asyncpg>=0.29.0
- nats-py>=2.7.0
- opentelemetry-api>=1.22.0
- opentelemetry-sdk>=1.22.0
- opentelemetry-instrumentation-fastapi>=0.43b0
- opentelemetry-instrumentation-sqlalchemy>=0.43b0
- opentelemetry-exporter-prometheus>=1.46.0
- prometheus-client>=0.19.0

Dev:
- pytest>=7.4.4
- pytest-asyncio>=0.23.3
- pytest-cov>=4.1.0
- hypothesis>=6.92.0
- ruff>=0.1.9
- mypy>=1.8.0
- pre-commit>=3.6.0
- black>=23.12.1
- jsonschema>=4.20.0
```

---

### 2. Linting
**Tool:** ruff
**Configuration:** `pyproject.toml` (tool.ruff section)

**Commands:**
- `ruff check .` - Run linter
- `ruff format .` - Format code

**Configuration:**
```toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "B", "C4", "UP", "ARG", "SIM"]
ignore = ["E501"]

[tool.ruff.lint.isort]
known-first-party = ["constitution", "kernel", "runtime", "storage", "transport"]
```

**Lint Rules:**
- E - pycodestyle errors
- F - Pyflakes
- I - isort
- N - pep8-naming
- W - pycodestyle warnings
- B - flake8-bugbear
- C4 - flake8-comprehensions
- UP - pyupgrade
- ARG - flake8-unused-arguments
- SIM - flake8-simplify

---

### 3. Type Checking
**Tool:** mypy
**Configuration:** `pyproject.toml` (tool.mypy section)

**Commands:**
- `mypy .` - Run type checker

**Configuration:**
```toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

**Type Checking Rules:**
- Strict mode enabled
- Return type warnings
- Unused config warnings
- Disallow untyped definitions

---

### 4. Testing
**Tool:** pytest
**Configuration:** `pyproject.toml` (tool.pytest.ini_options section)

**Commands:**
- `pytest tests/ -v --cov=. --cov-report=html` - Run tests with coverage

**Configuration:**
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
```

**Test Configuration:**
- Async mode: auto
- Test paths: tests/
- File pattern: test_*.py
- Class pattern: Test*
- Function pattern: test_*

---

### 5. Code Formatting
**Tool:** black
**Configuration:** ruff format (uses ruff's formatter)

**Commands:**
- `ruff format .` - Format code

**Note:** Using ruff's formatter instead of black directly

---

## Build Targets

### Makefile Targets

**Location:** `Makefile`

**Targets:**
- `help` - Show help message
- `install` - Install dependencies with uv
- `dev` - Start development server (uvicorn)
- `test` - Run tests with coverage
- `lint` - Run linter (ruff)
- `format` - Format code (ruff format)
- `check` - Run type checking (mypy)
- `clean` - Clean build artifacts
- `docker-up` - Start Docker containers
- `docker-down` - Stop Docker containers
- `docker-logs` - Show Docker logs

---

## Build Flow

### Development Build Flow

```
Source Code
  │
  ▼ uv sync --dev
Dependencies Installed
  │
  ├──────────────────┐
  │                  │
  ▼                  ▼
ruff check .       mypy .
  │                  │
  ▼                  ▼
Lint Passed       Type Check Passed
  │                  │
  └────────┬─────────┘
           │
           ▼
     ruff format .
           │
           ▼
     Code Formatted
           │
           ▼
     pytest tests/
           │
           ▼
     Tests Passed
           │
           ▼
     Development Ready
```

### Production Build Flow

```
Source Code
  │
  ▼ uv sync
Production Dependencies Installed
  │
  ├──────────────────┐
  │                  │
  ▼                  ▼
ruff check .       mypy .
  │                  │
  ▼                  ▼
Lint Passed       Type Check Passed
  │                  │
  └────────┬─────────┘
           │
           ▼
     ruff format .
           │
           ▼
     Code Formatted
           │
           ▼
     pytest tests/
           │
           ▼
     Tests Passed
           │
           ▼
     Production Ready
```

---

## Build Dependencies

### Linting Dependencies
- ruff>=0.1.9

### Type Checking Dependencies
- mypy>=1.8.0

### Testing Dependencies
- pytest>=7.4.4
- pytest-asyncio>=0.23.3
- pytest-cov>=4.1.0
- hypothesis>=6.92.0

### Code Formatting Dependencies
- ruff>=0.1.9 (includes formatter)

### Pre-commit Dependencies
- pre-commit>=3.6.0
- black>=23.12.1 (if using black directly)

---

## Build Artifacts

### Linting Artifacts
- Console output (lint errors/warnings)
- Exit code (0 = success, 1 = failure)

### Type Checking Artifacts
- Console output (type errors)
- Exit code (0 = success, 1 = failure)

### Testing Artifacts
- Console output (test results)
- Coverage report (htmlcov/)
- Coverage data (.coverage)
- Exit code (0 = success, 1 = failure)

### Code Formatting Artifacts
- Modified source files
- Console output (formatting changes)

---

## Build Issues

### 1. Dependency Version Conflicts
**Status:** Medium Risk
**Location:** `pyproject.toml` vs `requirements.txt`

**Issue:** Version specifications differ between files
**Examples:**
- `pyproject.toml`: `fastapi>=0.109.0`
- `requirements.txt`: `fastapi>=0.100.0`

**Impact:** Inconsistent dependency resolution
**Recommendation:** Align version specifications

### 2. Missing Pre-commit Configuration
**Status:** Low Risk
**Location:** Root directory

**Issue:** No `.pre-commit-config.yaml` file
**Impact:** Pre-commit hooks not configured
**Recommendation:** Add pre-commit configuration

### 3. No CI/CD Configuration
**Status:** Medium Risk
**Location:** Root directory

**Issue:** No GitHub Actions or other CI/CD configuration
**Impact:** No automated builds/tests
**Recommendation:** Add CI/CD configuration

### 4. No Docker Build Configuration
**Status:** Medium Risk
**Location:** `deploy/` directory

**Issue:** No Dockerfile for application container
**Impact:** Cannot containerize application
**Recommendation:** Add Dockerfile

### 5. No Build Artifacts Management
**Status:** Low Risk
**Location:** Build process

**Issue:** No artifact storage or versioning
**Impact:** Cannot track build artifacts
**Recommendation:** Add artifact management

---

## Build Performance

### Dependency Installation
**Tool:** uv
**Performance:** Fast (written in Rust)
**Estimated Time:** 10-30 seconds

### Linting
**Tool:** ruff
**Performance:** Fast (written in Rust)
**Estimated Time:** 5-15 seconds

### Type Checking
**Tool:** mypy
**Performance:** Medium (written in Python)
**Estimated Time:** 30-60 seconds

### Testing
**Tool:** pytest
**Performance:** Variable (depends on test count)
**Estimated Time:** 1-5 minutes

### Code Formatting
**Tool:** ruff format
**Performance:** Fast (written in Rust)
**Estimated Time:** 5-10 seconds

---

## Build Optimization

### Current Optimizations
- Using uv for fast dependency installation
- Using ruff for fast linting/formatting
- Parallel test execution (pytest default)

### Potential Optimizations
- Use mypy daemon for faster type checking
- Use pytest-xdist for parallel test execution
- Cache dependencies between builds
- Use incremental type checking

---

## Build Environment

### Python Version
**Required:** Python >=3.12
**Target:** Python 3.12

### Operating System
**Supported:** Linux, macOS, Windows (via WSL)

### Dependencies
**External:**
- PostgreSQL (for database)
- NATS (for messaging)
- Docker (for containerization)

---

## Build Security

### Dependency Vulnerabilities
**Status:** Not Scanned
**Tool:** None

**Recommendation:** Add dependency vulnerability scanning (e.g., `pip-audit`, `safety`)

### Code Security
**Status:** Not Scanned
**Tool:** None

**Recommendation:** Add code security scanning (e.g., `bandit`, `semgrep`)

### Supply Chain Security
**Status:** Not Verified
**Tool:** None

**Recommendation:** Add supply chain verification (e.g., `sigstore`, `SBOM`)

---

## Build Monitoring

### Current Monitoring
- Console output
- Exit codes

### Recommended Monitoring
- Build time metrics
- Dependency installation metrics
- Test execution metrics
- Coverage trends
- Build failure notifications

---

## Recommendations

1. **Align Dependency Versions:** Standardize version specifications
2. **Add Pre-commit Configuration:** Configure pre-commit hooks
3. **Add CI/CD Configuration:** Automate builds and tests
4. **Add Dockerfile:** Containerize application
5. **Add Artifact Management:** Track build artifacts
6. **Add Dependency Scanning:** Scan for vulnerabilities
7. **Add Code Scanning:** Scan for security issues
8. **Add Supply Chain Verification:** Verify package integrity
9. **Add Build Metrics:** Monitor build performance
10. **Add Build Notifications:** Notify on build failures

---

## Next Steps

- Align dependency versions between pyproject.toml and requirements.txt
- Add pre-commit configuration
- Add CI/CD configuration (GitHub Actions)
- Add Dockerfile for application containerization
- Add dependency vulnerability scanning
- Add code security scanning
- Add supply chain verification
- Add build metrics and monitoring
