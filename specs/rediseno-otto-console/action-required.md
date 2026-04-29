# Action Required: Rediseño OttoSeguridad Console

Pasos manuales que debe ejecutar el usuario. No se pueden automatizar.

## Antes de implementar

- [ ] **Confirmar arranque de Fase 1** — Dar luz verde para empezar (los tokens y el shell del dashboard tocan archivos compartidos)
- [ ] **Backup de rama actual** — `git checkout -b rediseno-console` antes de empezar para aislar los cambios visuales

## Durante la implementación

- [ ] **Aprobar cierre de cada fase** — Al final de cada fase (1 → 9) se pausa para que el usuario confirme antes de pasar a la siguiente
- [ ] **Correr `pnpm dev`** — Cuando se pida verificación visual, el usuario debe arrancar el dev server (Claude no lo arranca por convención del proyecto)
- [ ] **Verificar visualmente cada pantalla** — Comparar el resultado contra el HTML correspondiente en `/tmp/design-extract/otto/project/otto-app/`

## Después de implementar

- [ ] **Smoke test funcional** — Abrir DevTools → Network y confirmar que ningún endpoint cambió (mismas URLs, mismos métodos)
- [ ] **Verificar dark mode** — Toggle global y revisar que el dashboard se mantenga legible (el diseño es light-only; aceptable que el shell ignore dark)
- [ ] **Decidir destino de rutas no rediseñadas** — `/boletines` (demo), `/chat` (AI), `/profile`: el usuario decide si aplicar el shell nuevo o dejarlas con el header público

---

> **Nota:** Estos pasos también aparecen en contexto dentro de `implementation-plan.md`.
