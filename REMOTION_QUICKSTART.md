# 🚀 Remotion - Guía Rápida de Inicio

## ⚡ 3 Pasos para Comenzar

### Paso 1: Agregar Assets (2 archivos)

Copia estos archivos a las carpetas indicadas:

1. **Imagen de fondo** → `remotion/assets/backgrounds/newsroom-bg.jpg`
   - Usar la primera imagen que compartiste (pantalla con "RESUMEN DIARIO DE NOTICIAS")

2. **Logo de Otto** → `remotion/assets/logos/otto-logo.png`
   - Extraer el logo del búho de la segunda imagen (con fondo transparente)

> ✅ El video del avatar ya está en: `remotion/assets/videos/avatar.mp4`

---

### Paso 2: Probar el Studio de Remotion

```bash
pnpm remotion:studio
```

Esto abrirá una interfaz visual en tu navegador donde podrás:
- ✅ Ver el video en tiempo real
- ✅ Ajustar la composición
- ✅ Verificar que todos los assets se carguen correctamente

---

### Paso 3: Renderizar un Video de Prueba

```bash
pnpm remotion:render
```

El video se generará en: `output/bulletin-video.mp4`

---

## 🎯 Usar desde el Dashboard

Una vez que hayas verificado que todo funciona en el Studio:

1. Ve al dashboard de boletines
2. Selecciona un boletín
3. Haz clic en "Generar Video"
4. Espera a que se procese (puede tomar varios minutos)
5. El video estará disponible en la sección del boletín

---

## 📝 Notas Importantes

- **Duración**: El video siempre será de 35 segundos (basado en tu audio del avatar)
- **Formato**: Vertical 1080x1920 (optimizado para Instagram, TikTok, Stories)
- **Calidad**: H.264 MP4 con audio
- **Renderizado**: Local (gratis pero lento) - puedes migrar a Remotion Lambda después

---

## 🐛 Si Algo Sale Mal

**"No se ve la imagen de fondo"**
→ Verifica que `newsroom-bg.jpg` esté en `remotion/assets/backgrounds/`

**"No se ve el logo"**
→ Verifica que `otto-logo.png` esté en `remotion/assets/logos/`

**"No se escucha el audio"**
→ El audio viene del video del avatar en `remotion/assets/videos/avatar.mp4`

**"El renderizado falla"**
→ Ejecuta `pnpm remotion:studio` primero para ver el error visual

---

## 🎨 Personalización Rápida

### Cambiar la fecha:
Edita: `remotion/Root.tsx` línea 16

### Cambiar colores:
Edita: `remotion/components/BrandingOverlay.tsx` línea 18

### Cambiar tamaño del avatar:
Edita: `remotion/components/AvatarVideo.tsx` líneas 17-18

---

**¿Listo? ¡Comienza con `pnpm remotion:studio`! 🎬**
