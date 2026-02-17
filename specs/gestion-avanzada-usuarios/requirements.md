# Requirements: Gestión Avanzada de Usuarios

## Descripción

Ampliar el módulo de gestión de usuarios (`/dashboard/settings/users`) para permitir al administrador:

1. **Cambiar contraseña** de cualquier usuario del sistema
2. **Activar/desactivar usuarios** para impedir el acceso al sistema
3. **Asignar permisos de menú** por usuario, controlando a qué secciones puede acceder cada uno

## Motivación

Actualmente la página de usuarios solo permite crear y listar. No hay forma de resetear una contraseña, deshabilitar un usuario sin borrarlo, ni limitar el acceso por secciones. Esto es crítico para la operación diaria del sistema.

## Acceptance Criteria

### Cambio de contraseña
- [ ] El admin puede establecer una nueva contraseña para cualquier usuario
- [ ] La contraseña mínima es 8 caracteres
- [ ] El usuario puede loguearse con la nueva contraseña inmediatamente

### Estado activo/inactivo
- [ ] Cada usuario muestra un switch de activo/inactivo en la lista
- [ ] Un usuario inactivo NO puede iniciar sesión (se muestra mensaje "Cuenta desactivada")
- [ ] Si un usuario ya logueado es desactivado, al siguiente request se le bloquea el acceso
- [ ] Los usuarios existentes se consideran activos por defecto (retrocompatibilidad)

### Permisos de menú
- [ ] El admin puede asignar/quitar acceso a cada sección del menú por usuario
- [ ] Las secciones disponibles son: Boletines, Fuentes, Suscriptores, Categorías, Usuarios, Dashboard
- [ ] El header de navegación solo muestra los menús permitidos para el usuario logueado
- [ ] Un usuario sin permisos definidos (null) tiene acceso a todo (retrocompatibilidad)

## Dependencias

- BetterAuth (autenticación existente) - tabla `account` para passwords
- Drizzle ORM + PostgreSQL - esquema en `src/lib/schema.ts`
- shadcn/ui components (Switch, Card, Input, Button, Label, Checkbox)
