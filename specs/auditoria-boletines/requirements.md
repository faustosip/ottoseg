# Requirements: Auditoría de Boletines, Email Corporativo y Dashboard

## Descripción

Feature integral que abarca 5 mejoras al sistema de boletines:

1. **Limpieza de UI**: Ocultar botón "Exportar JSON" (sin funcionalidad) y condicionar "Compartir Link Público" para que solo esté disponible después de autorizar
2. **Módulo de auditoría**: Registrar quién autoriza, publica y elimina boletines con fecha/hora completa
3. **Email corporativo con tracking**: Configurar SMTP de Outlook (`informacion2@ottoseguridad.com.ec`) con tracking de aperturas/clics, prevención de envío duplicado, botón de prueba y desuscripción funcional
4. **Rediseño de template de email**: Email profesional con logos (búho + OttoSeguridad), saludo personalizado, imágenes destacadas, botón CTA y footer corporativo
5. **Dashboard ejecutivo**: Panel de métricas con estadísticas de boletines, emails, suscriptores y rendimiento del pipeline para gerencia

## Dominios

- **Correo corporativo (remitente):** `ottoseguridad.com.ec` — `informacion2@ottoseguridad.com.ec`
- **Plataforma (links, tracking, logos):** `ottoseguridadai.com` — `https://ottoseguridadai.com`

## Motivación

- La gerencia necesita visibilidad sobre quién autoriza cada boletín (auditoría/trazabilidad)
- El email actual usa credenciales placeholder de Gmail — no funciona en producción
- No hay forma de medir si los suscriptores leen los boletines (no hay tracking)
- No existe un dashboard con KPIs para la toma de decisiones
- El template de email actual es básico, sin branding corporativo
- No hay desuscripción funcional (riesgo de caer en spam)
- No hay prevención de envío duplicado ni forma de enviar prueba antes del envío masivo

## Acceptance Criteria

### UI del boletín
- [ ] El botón "Exportar JSON" no es visible en la página de detalle del boletín
- [ ] "Compartir Link Público" solo aparece cuando el boletín está autorizado o publicado (NO en estado "ready")

### Auditoría
- [ ] Al autorizar un boletín, se registra: usuario (nombre, email), acción, fecha/hora
- [ ] Al publicar un boletín, se registra lo mismo
- [ ] Al eliminar un boletín, se registra antes de la eliminación
- [ ] Los registros de auditoría son visibles en la UI del boletín

### Email corporativo
- [ ] Los emails se envían desde `informacion2@ottoseguridad.com.ec` vía Outlook SMTP
- [ ] Cada envío individual queda registrado en tabla `email_sends`
- [ ] Se registra si el email fue abierto (tracking pixel)
- [ ] Se registra si el usuario hizo clic en un link (URL rewriting)
- [ ] No se puede enviar el mismo boletín dos veces a los suscriptores
- [ ] Existe botón "Enviar prueba a mi email" para probar antes del envío masivo
- [ ] Existe endpoint funcional de desuscripción con un clic desde el email

### Template de email
- [ ] Header con logos (búho + OttoSeguridad) sobre fondo gradiente azul corporativo
- [ ] Saludo personalizado con el nombre del suscriptor
- [ ] Imagen destacada por categoría (primera noticia de cada sección)
- [ ] Botón CTA "Ver Boletín Completo" apuntando a `ottoseguridadai.com`
- [ ] Footer profesional con datos de contacto y link de desuscripción
- [ ] Todos los links apuntan a `ottoseguridadai.com` (plataforma)

### Dashboard
- [ ] La ruta `/dashboard` muestra un panel de métricas (ya no redirige a `/bulletin`)
- [ ] Muestra KPIs: total boletines publicados, suscriptores activos, tasa de apertura email, noticias procesadas
- [ ] Muestra gráficos de tendencia (boletines por semana, emails enviados vs abiertos)
- [ ] Muestra distribución de noticias por categoría y por fuente
- [ ] Muestra tabla de actividad reciente (auditoría) y rendimiento del pipeline

## Dependencias

- Nodemailer (ya instalado v7.0.12)
- Recharts (nueva dependencia para gráficos del dashboard)
- Drizzle ORM + PostgreSQL (esquema existente en `src/lib/schema.ts`)
- shadcn/ui components existentes
- Logos existentes: `buho-seguridad.png`, `otto-logo.png` en `/public/`
