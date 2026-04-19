---
name: Infrastructure surface (Docker + Traefik + Swarm)
description: Hallazgos clave de infra del audit 2026-04-18 rev2 que aplican a futuros audits
type: project
---

El proyecto se despliega en VPS Contabo + Docker Swarm + Traefik + Let's Encrypt. Cualquier audit futuro debe cubrir esta superficie además del código.

**Why:** El audit inicial (2026-04-18) cubrió bien el código pero omitió toda la capa de infra. El usuario pidió rehacerlo y la segunda pasada descubrió 19 hallazgos nuevos en Dockerfile/docker-compose/Traefik que eran críticos.

**How to apply:**
- **Dockerfile:** revisar build args hardcoded (el original tenía `BETTER_AUTH_SECRET="build-time-secret-not-used-in-production"`), `COPY . .` contra `.dockerignore`, pnpm pinneado, Node LTS.
- **docker-compose.yml:** labels Traefik (rate-limit por ruta, IP allowlist `/api/cron/*`, security headers, redirect HTTP→HTTPS, compression), secrets en `environment:` vs `secrets:` de Swarm, healthcheck.
- **.dockerignore:** debe excluir `audit/`, `.claude/`, `specs/`, `temp/`, `output/`, además de `.env*` y `.git`.
- **Registry:** verificar si la imagen (`faustoai/ottoseguridadai:latest`) es pública, migrar a tag versionado.
- **Traefik middlewares pendientes:** rate-limit global + específicos (expensive, tracking, upload), IP allowlist para cron, secure-headers con CSP.
- **Node 20 LTS expira 2026-04**, planificar migración a 22.
