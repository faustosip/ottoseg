# 🎬 Remotion - Sistema de Generación de Videos para Boletín

## ✅ Estado de Implementación

**Implementación completada exitosamente**

- ✅ Remotion instalado y configurado
- ✅ Estructura de carpetas creada
- ✅ Composiciones de video implementadas
- ✅ API route para generación de videos
- ✅ Componentes de UI integrados
- ✅ ESLint configurado
- ✅ TypeScript validado

---

## 📋 Pasos Pendientes (Acción Requerida)

### 1. **Agregar Assets Faltantes**

Necesitas agregar manualmente 2 archivos a la carpeta de assets:

#### 📸 **Imagen de Fondo**
- **Archivo**: `remotion/assets/backgrounds/newsroom-bg.jpg`
- **Fuente**: La primera imagen que compartiste (pantalla con "RESUMEN DIARIO DE NOTICIAS")
- **Formato**: JPG o PNG
- **Resolución**: 1080x1920 o superior

#### 🦉 **Logo de Otto Seguridad**
- **Archivo**: `remotion/assets/logos/otto-logo.png`
- **Fuente**: Extraer el logo del búho de la segunda imagen
- **Formato**: PNG con fondo transparente
- **Tamaño**: 400x400px o superior

> **Nota**: El video del avatar ya fue copiado automáticamente ✅

---

## 🚀 Cómo Usar

### **Opción 1: Remotion Studio (Desarrollo Visual)**

Para previsualizar y ajustar el video en tiempo real:

```bash
pnpm remotion:studio
```

Esto abrirá una interfaz visual donde puedes:
- Ver el video en tiempo real
- Ajustar props (fecha, avatar)
- Previsualizar frame por frame
- Exportar el video manualmente

### **Opción 2: Renderizado por Línea de Comandos**

Para renderizar un video directamente:

```bash
pnpm remotion:render
```

El video se guardará en: `output/bulletin-video.mp4`

### **Opción 3: API desde el Dashboard (Producción)**

Desde el dashboard de boletines, puedes usar el botón "Generar Video" que:
1. Llama al endpoint `/api/bulletins/[id]/generate-video`
2. Renderiza el video con los datos del boletín
3. Guarda el video en `public/videos/bulletin-{id}.mp4`
4. Actualiza la base de datos con la URL del video

---

## 📁 Estructura del Proyecto

```
remotion/
├── index.ts                          # Entry point de Remotion
├── Root.tsx                          # Registro de composiciones
├── compositions/
│   └── BulletinNewsVideo.tsx         # Composición principal del video
├── components/
│   ├── BackgroundLayer.tsx           # Capa de fondo (imagen estática)
│   ├── BrandingOverlay.tsx           # Header (fecha) + Footer (logo)
│   └── AvatarVideo.tsx               # Video del presentador
└── assets/
    ├── backgrounds/
    │   └── newsroom-bg.jpg           # ⚠️ PENDIENTE: Agregar manualmente
    ├── videos/
    │   └── avatar.mp4                # ✅ Ya copiado
    └── logos/
        └── otto-logo.png             # ⚠️ PENDIENTE: Agregar manualmente
```

---

## 🎨 Configuración del Video

### Especificaciones Técnicas

- **Formato**: Vertical (Redes Sociales)
- **Resolución**: 1080x1920 (9:16)
- **FPS**: 30 frames por segundo
- **Duración**: 35 segundos (1050 frames)
- **Codec**: H.264 (MP4)

### Capas del Video (de atrás hacia adelante)

1. **Fondo**: Imagen estática del noticiero
2. **Branding**:
   - Header superior con fecha (banda roja)
   - Footer inferior con logo (banda oscura)
3. **Avatar**: Video del presentador en esquina inferior derecha

---

## 🔧 Integración con el Sistema

### API Endpoint

```typescript
POST /api/bulletins/[id]/generate-video
GET  /api/bulletins/[id]/generate-video  // Verificar estado
```

### Componentes de UI Disponibles

```tsx
import {GenerateVideoButton} from '@/components/bulletin/generate-video-button';
import {VideoPreview} from '@/components/bulletin/video-preview';

// Uso:
<GenerateVideoButton
  bulletinId="uuid-del-boletin"
  currentVideoStatus="pending"
/>

<VideoPreview
  bulletinDate="DOMINGO 23 DE NOVIEMBRE DE 2025"
  avatarSrc="videos/avatar.mp4"
/>
```

### Campos de Base de Datos

El esquema `bulletins` ya incluye:
- `videoUrl`: URL del video generado
- `videoStatus`: Estado (pending, processing, completed, failed)
- `videoMetadata`: Metadatos del video (duración, resolución, etc.)
- `errorLog`: Logs de errores si falla

---

## 🎯 Personalización

### Cambiar Fecha del Boletín

Edita `remotion/Root.tsx`:

```tsx
defaultProps={{
  bulletinDate: 'LUNES 24 DE NOVIEMBRE DE 2025',
  avatarSrc: 'videos/avatar.mp4',
}}
```

### Cambiar Colores Corporativos

Edita `remotion/components/BrandingOverlay.tsx`:

```tsx
backgroundColor: '#C41E3A', // Color rojo corporativo
```

### Ajustar Posición del Avatar

Edita `remotion/components/AvatarVideo.tsx`:

```tsx
padding: '0 40px 200px 40px', // Ajustar espaciado
width: '500px',                // Ancho del avatar
height: '700px',               // Alto del avatar
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'remotion'"

```bash
pnpm install
```

### Error: Assets no encontrados

Verifica que los archivos estén en:
- `remotion/assets/backgrounds/newsroom-bg.jpg`
- `remotion/assets/logos/otto-logo.png`
- `remotion/assets/videos/avatar.mp4`

### Video no se renderiza

1. Verifica que todos los assets existan
2. Ejecuta `pnpm remotion:studio` para ver errores visuales
3. Revisa los logs en la consola

### Renderizado muy lento

El renderizado es CPU intensivo. Para producción, considera:
- Usar Remotion Lambda (renderizado en la nube)
- Aumentar recursos de la máquina
- Reducir la resolución temporalmente para pruebas

---

## 📚 Recursos

- [Documentación oficial de Remotion](https://www.remotion.dev/docs)
- [Remotion Discord](https://discord.gg/remotion)
- [Ejemplos de Remotion](https://www.remotion.dev/showcase)

---

## ✅ Checklist Final

Antes de usar en producción:

- [ ] Agregar `newsroom-bg.jpg` a `remotion/assets/backgrounds/`
- [ ] Agregar `otto-logo.png` a `remotion/assets/logos/`
- [ ] Ejecutar `pnpm remotion:studio` y verificar visualización
- [ ] Renderizar un video de prueba con `pnpm remotion:render`
- [ ] Probar el botón "Generar Video" desde el dashboard
- [ ] Verificar que el video se guarde correctamente en `public/videos/`
- [ ] Confirmar que la base de datos se actualice con la URL del video

---

**¡Todo listo para generar videos automatizados de tu boletín de noticias! 🎉**
