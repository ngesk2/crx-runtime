# Research Pipeline Archive

**Status:** Archived until Hermes autonomous mission execution is stable

## Overview

This directory contains disabled research pipeline cron jobs. The research pipeline has been paused to focus on:

- Hermes mission execution
- Scheduler stability  
- Oracle worker infrastructure
- Autonomous coding workflow

## Archive Date

July 13, 2026

## What Was Archived

**Note:** No explicit cron job definitions were found in the codebase during the archive process. The following locations were searched:

- `*.cron` files
- `*.crontab` files
- Docker Compose services (ping-workers, mission-control)
- Temporal workflow definitions
- Dramatiq/Celery periodic task configurations
- Scheduler configurations in `kernel/scheduler.py`
- `runtime/scheduler/` directory

## Current Status

**No cron jobs were found to archive.**

The research pipeline may be implemented via:
- Temporal scheduled workflows
- Docker Compose service auto-restart policies
- External orchestration (Kubernetes cron jobs, systemd timers, etc.)

## Services Potentially Related to Research

The following services in `infra/docker/docker-compose.yml` may be part of the research pipeline:

1. **ping-workers** - Temporal worker service (WORKER_MODE: temporal)
2. **mission-control** - Mission scheduler (MISSION_CONTROL_MODE: scheduler)

These services have `restart: unless-stopped` policies and will auto-restart. To disable them, modify the docker-compose.yml file or stop the containers manually.

## How to Re-enable

When Hermes is consistently executing sandboxed missions from the mission queue:

1. Review and update research pipeline configuration
2. Re-enable any disabled services in docker-compose.yml
3. Restore cron job definitions if they were external
4. Test research pipeline functionality
5. Update this README with re-enablement date

## What Was Preserved

- All research skills in `runtime/skills/`
- All generated documentation
- All configuration files
- All capability implementations
- All skill classification tools

## Priority Shift

**Current Priority:**
1. Hermes mission execution
2. Scheduler stability
3. Oracle worker infrastructure
4. Autonomous coding workflow

**Paused:**
- Research pipeline (no explicit cron jobs found to pause)

## Contact

If you need to re-enable the research pipeline or have questions about this archive, consult the architecture team.
