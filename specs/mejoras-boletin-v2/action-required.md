# Action Required: Mejoras del Boletín V2

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Verificar acceso a Supabase Storage** - Necesario para crear bucket de videos. Confirmar que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configurados en `.env`
- [ ] **Verificar conexión a base de datos** - Las migraciones requieren acceso a PostgreSQL. Confirmar que `POSTGRES_URL` está configurado

## During Implementation

- [ ] **Crear bucket `bulletin-videos` en Supabase** - Si el bucket no se crea automáticamente, crearlo manualmente en el dashboard de Supabase con mime type `video/mp4` y límite de 50MB
- [ ] **Crear primer usuario admin** - Después de configurar email/password auth, crear el primer usuario admin manualmente (vía seed script o API directa de BetterAuth)

## After Implementation

- [ ] **Crear categoría "Última Hora"** - Desde la página admin de categorías, crear la categoría para que aparezca en la columna derecha del boletín
- [ ] **Probar login** - Verificar que el admin puede iniciar sesión con email/password
- [ ] **Probar upload de video** - Subir un archivo MP4 de prueba y verificar que se reproduce en la vista pública
- [ ] **Dar OK para avanzar entre fases** - El usuario debe aprobar cada fase antes de continuar con la siguiente

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
