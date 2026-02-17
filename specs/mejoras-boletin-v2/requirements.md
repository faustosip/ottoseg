# Requirements: Mejoras del Boletín V2

## Descripcion

El boletín público de Otto Seguridad necesita una serie de mejoras para convertirlo de un layout de una columna con categorías fijas a un producto más completo con layout de 3 columnas, categorías dinámicas, soporte de video, y autenticación mejorada.

## Por qué

- El boletín actual no permite agregar categorías nuevas (solo 6 hardcoded)
- No hay soporte para video MP4 en la vista pública
- La autenticación solo funciona con Google OAuth, se necesita email/password
- No hay sección de "Última Hora" destacada
- La sección de Mapa de Cierres Viales dedicada es redundante (se puede manejar como noticia manual)

## Criterios de Aceptación

### AC-1: Categorías Dinámicas
- [ ] El admin puede crear nuevas categorías desde el dashboard (ej: "Última Hora", "Deportes")
- [ ] Las nuevas categorías aparecen en el selector del formulario "Agregar Noticia Manual"
- [ ] Las nuevas categorías se renderizan en el boletín público
- [ ] Las 6 categorías originales se mantienen como defaults
- [ ] Se puede cambiar el orden de las categorías

### AC-2: Layout 3 Columnas (Desktop)
- [ ] Columna izquierda: Video MP4 con título "VIDEO"
- [ ] Columna centro: Categorías de noticias (contenido principal)
- [ ] Columna derecha: Sección "ULTIMA HORA" con noticias de esa categoría
- [ ] Responsive: 3 columnas en desktop, stack vertical en mobile

### AC-3: Upload Video MP4
- [ ] El admin puede subir un archivo MP4 desde el editor del boletín
- [ ] El video se muestra en la columna izquierda de la vista pública
- [ ] El video se reproduce con controles nativos del navegador

### AC-4: Login Email/Password
- [ ] Login funciona con email y contraseña (BetterAuth)
- [ ] No existe botón "Sign Up" visible para el público
- [ ] El administrador puede crear usuarios desde el dashboard
- [ ] La sesión se mantiene correctamente

### AC-5: Link Móvil "Última Hora"
- [ ] En mobile aparece un link/botón visible que lleva a la sección "Última Hora"
- [ ] El link hace scroll suave hasta la sección
- [ ] Solo es visible en pantallas móviles

### AC-6: Eliminar Mapa de Cierres Viales
- [ ] La sección dedicada de "Mapa de Cierres Viales" se elimina del editor
- [ ] La info vial se maneja como noticias manuales en la categoría "Vial"
- [ ] El render especial del mapa se elimina de la vista pública

## Dependencias

- BetterAuth debe soportar `emailAndPassword` plugin
- Supabase Storage debe soportar upload de archivos MP4 (bucket configurado)
- Las categorías dinámicas son prerequisito para el layout de 3 columnas (necesita categoría "Última Hora")

## Archivos de Referencia

- Vista pública actual: `src/components/bulletin/public-bulletin-view.tsx`
- Editor actual: `src/components/bulletin/editable-bulletin.tsx`
- Formulario de noticias: `src/components/bulletin/manual-news-form.tsx`
- Schema de BD: `src/lib/schema.ts`
- Auth config: `src/lib/auth.ts`
- Auth client: `src/lib/auth-client.ts`
- Sign-in component: `src/components/auth/sign-in-button.tsx`
- Storage service: `src/lib/storage/supabase-storage.ts`
- Upload API: `src/app/api/upload/image/route.ts`
