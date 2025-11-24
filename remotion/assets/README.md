# Assets de Remotion

Esta carpeta contiene todos los recursos necesarios para generar los videos del boletín.

## 📁 Estructura de Carpetas

### `/backgrounds/`
**Imagen de fondo del noticiero**
- Archivo requerido: `newsroom-bg.jpg`
- Descripción: Imagen con el logo "OTTO SEGURIDAD", fondo tecnológico azul/púrpura
- Resolución recomendada: 1080x1920 o mayor
- Formato: JPG o PNG

👉 **Acción necesaria**: Guarda la primera imagen que compartiste aquí con el nombre `newsroom-bg.jpg`

### `/videos/`
**Video del presentador/avatar**
- Archivo: `avatar.mp4` ✅ (Ya copiado)
- Descripción: Video del presentador con audio completo del boletín
- Duración: 35 segundos
- Audio incluido: Sí

### `/logos/`
**Logo de Otto Seguridad**
- Archivo requerido: `otto-logo.png`
- Descripción: Logo del búho con "SEGURIDAD" (extraído de la imagen del footer)
- Fondo: Transparente (PNG)
- Tamaño recomendado: 400x400px o mayor

👉 **Acción necesaria**: Extrae el logo del búho de la segunda imagen que compartiste y guárdalo aquí como `otto-logo.png` con fondo transparente

## 🎨 Referencias Visuales

- **Imagen 1**: Pantalla de inicio con "RESUMEN DIARIO DE NOTICIAS" → usar como `newsroom-bg.jpg`
- **Imagen 2**: Vista del presentador con fecha y footer → referencia para diseño final

## ✅ Checklist

- [x] Video del avatar copiado
- [ ] Imagen de fondo guardada (`newsroom-bg.jpg`)
- [ ] Logo extraído y guardado (`otto-logo.png`)

Una vez que tengas todos los assets, podrás ejecutar:
```bash
pnpm remotion:studio
```
