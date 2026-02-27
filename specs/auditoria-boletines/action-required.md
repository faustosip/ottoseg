# Action Required: Auditoría de Boletines, Email Corporativo y Dashboard

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Verificar acceso SMTP de Outlook** — Confirmar que la cuenta `informacion2@ottoseguridad.com.ec` permite autenticación básica (usuario/contraseña) desde el servidor. Si Office 365 bloquea auth básica, se necesitará habilitar SMTP AUTH en el admin de Microsoft 365 (Security Defaults → desactivar, o habilitar SMTP AUTH por usuario)
- [ ] **Verificar que los logos sean accesibles públicamente** — Confirmar que `https://ottoseguridadai.com/buho-seguridad.png` y `https://ottoseguridadai.com/otto-logo.png` cargan correctamente desde un navegador. Los emails usan URLs absolutas para imágenes

## During Implementation

- [ ] **Actualizar `.env` en producción (Docker)** — Después de Phase 4, actualizar las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` en el entorno de producción
- [ ] **Configurar `NEXT_PUBLIC_APP_URL`** — El tracking de emails necesita la URL pública real (`https://ottoseguridadai.com`, no localhost) para generar los links del pixel de apertura, redirects de clics y desuscripción
- [ ] **Generar `unsubscribeToken` para suscriptores existentes** — Después de Phase 5, ejecutar un script o query para generar tokens únicos para los suscriptores que ya existen en la BD (los nuevos se generan automáticamente)

## After Implementation

- [ ] **Verificar recepción de emails** — Enviar un boletín de prueba usando el botón "Enviar Prueba" y confirmar que llega desde `informacion2@ottoseguridad.com.ec` con logos visibles y formato correcto
- [ ] **Verificar tracking pixel** — Abrir el email de prueba y confirmar que se registra la apertura en la tabla `email_sends` (campo `opened_at`)
- [ ] **Verificar desuscripción** — Hacer clic en "Cancelar suscripción" en un email de prueba y confirmar que desactiva al suscriptor correctamente
- [ ] **Configurar registros SPF/DKIM en DNS** — En el panel de administración del dominio `ottoseguridad.com.ec`, agregar los registros DNS que Microsoft 365 requiere para autenticar el envío de emails. Sin esto, los emails pueden caer en spam en Gmail/Yahoo. Consultar: Admin Microsoft 365 → Configuración → Dominios → Registros DNS
- [ ] **Monitorear límites de envío Outlook** — La cuenta básica de Outlook permite ~300 emails/día. Con menos de 100 suscriptores actuales esto es suficiente. Si el número crece, considerar una cuenta Business o un servicio transaccional (Resend, SendGrid)

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
