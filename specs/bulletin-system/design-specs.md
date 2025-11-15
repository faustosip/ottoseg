# Design Specifications: Sistema Dual de Boletines

## Visión General

El sistema ofrece **dos diseños distintos** para visualizar el mismo contenido de boletín:

1. **Diseño Clásico**: Replica el formato tradicional familiar para audiencia mayor
2. **Diseño Moderno**: Experiencia web contemporánea, responsive y con interacciones

El usuario puede **cambiar entre diseños con un solo clic**, y su preferencia se guarda automáticamente.

---

## 🎨 Diseño Clásico

### Objetivo
Mantener familiaridad para la audiencia mayor que está acostumbrada al formato tradicional de boletín impreso digitalizado.

### Principios de Diseño
- **Simplicidad**: Layout lineal y predecible
- **Legibilidad**: Tamaños de fuente grandes, alto contraste
- **Familiaridad**: Estructura que replica boletines impresos
- **Claridad**: Separadores visuales entre secciones
- **Tradición**: Elementos decorativos clásicos

---

### Layout y Estructura

#### Contenedor Principal
```css
.classic-bulletin {
  max-width: 1024px;
  margin: 0 auto;
  background: #ffffff;
  padding: 0;
  font-family: 'Open Sans', sans-serif;
}
```

#### Secciones Principales
1. **Header Decorativo**
2. **Título del Boletín**
3. **Fecha**
4. **Separador**
5. **6 Secciones de Categorías** (numeradas)
6. **Separador Final**
7. **Footer Decorativo**
8. **Logo Corporativo**

---

### Header

#### Características
- Imagen de fondo decorativa (pattern o ilustración)
- Altura: 485px
- Imagen cubre todo el ancho

```css
.classic-header {
  position: relative;
  height: 485px;
  width: 100%;
  background-image: url('/bulletin-assets/classic/header-bg.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### Título Principal
- Texto: "RESUMEN DIARIO DE NOTICIAS"
- Fuente: Canva Sans Bold (alternativa: Montserrat Bold)
- Tamaño: 44px
- Color: Negro (#000000)
- Alineación: Centrado
- Text-transform: Uppercase
- Letter-spacing: 1px

```css
.classic-title {
  font-family: 'Canva Sans', 'Montserrat', sans-serif;
  font-size: 44px;
  font-weight: 700;
  text-align: center;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1.2;
  margin: 0;
}
```

#### Fecha
- Formato: "Martes 11 de Noviembre de 2025"
- Fuente: Open Sans Regular
- Tamaño: 22px
- Color: Negro (#000000)
- Alineación: Centrado
- Posición: Debajo del título con margen de 16px

```css
.classic-date {
  font-family: 'Open Sans', sans-serif;
  font-size: 22px;
  font-weight: 400;
  text-align: center;
  color: #000000;
  margin-top: 16px;
}
```

**Función de Formato en JS:**
```typescript
function formatClassicDate(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${day} de ${monthName} de ${year}`;
}
```

---

### Separadores

#### Línea Horizontal
- Borde: 2px sólido
- Color: Gris (#c9c9c9)
- Margen superior: 24px
- Margen inferior: 24px
- Sin border-radius

```css
.classic-separator {
  border: none;
  border-top: 2px solid #c9c9c9;
  margin: 24px 0;
  width: 100%;
}
```

---

### Secciones de Categorías

#### Contenedor de Sección
```css
.classic-section {
  margin: 60px 48px;
  padding: 0;
}
```

#### Título de Categoría (Numerado)
- Formato: "1. Economía", "2. Política", etc.
- Fuente: Coco Gothic Bold (alternativa: Oswald Bold)
- Tamaño: 44px
- Color: Negro (#000000)
- Decoración: Subrayado
- Margen inferior: 24px

```css
.classic-section-title {
  font-family: 'Coco Gothic', 'Oswald', sans-serif;
  font-size: 44px;
  font-weight: 700;
  text-decoration: underline;
  color: #000000;
  margin-bottom: 24px;
  line-height: 1.3;
}
```

#### Título de Noticia Principal
- Fuente: Open Sans Bold
- Tamaño: 42px
- Color: Azul oscuro (#004aad)
- Alineación: Centrado
- Line-height: 1.4
- Margen: 24px arriba y abajo

```css
.classic-news-title {
  font-family: 'Open Sans', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #004aad;
  text-align: center;
  line-height: 1.4;
  margin: 24px 0;
}
```

#### Imagen de Noticia
- Ancho máximo: 450px
- Altura: Auto (mantener aspect ratio)
- Display: Block
- Margen: 32px auto (centrado)
- Sin border-radius
- Sin border

```css
.classic-news-image {
  width: 100%;
  max-width: 450px;
  height: auto;
  display: block;
  margin: 32px auto;
  border: none;
}
```

#### Contenido de Noticia (Resumen)
- Fuente: Open Sans Regular
- Tamaño: 37px
- Color: Negro (#000000)
- Line-height: 1.5
- Text-align: Justify
- Margen: 24px arriba y abajo

```css
.classic-news-content {
  font-family: 'Open Sans', sans-serif;
  font-size: 37px;
  font-weight: 400;
  line-height: 1.5;
  text-align: justify;
  color: #000000;
  margin: 24px 0;
}
```

#### Link "Leer más"
- Texto: "Leer más"
- Color: Azul (#1a62ff)
- Font-weight: 700
- Text-decoration: Underline
- Display: Block
- Text-align: Right
- Margen superior: 16px

```css
.classic-link {
  color: #1a62ff;
  text-decoration: underline;
  font-weight: 700;
  font-size: 37px;
  display: block;
  text-align: right;
  margin-top: 16px;
  cursor: pointer;
}

.classic-link:hover {
  color: #004aad;
}
```

---

### Footer

#### Imagen Decorativa
- Similar al header
- Altura: Auto
- Ancho: 100%
- Margen superior: 48px

```css
.classic-footer-image {
  width: 100%;
  height: auto;
  margin-top: 48px;
}
```

#### Logo Corporativo
- Centrado
- Altura máxima: 80px
- Margen: 24px arriba y abajo
- Padding inferior: 48px

```css
.classic-logo {
  display: block;
  margin: 24px auto;
  max-height: 80px;
  width: auto;
  padding-bottom: 48px;
}
```

---

### Paleta de Colores

```css
:root {
  /* Colores Corporativos Clásicos */
  --classic-primary: #004aad;      /* Azul oscuro */
  --classic-secondary: #1a62ff;    /* Azul enlace */
  --classic-accent: #c9c9c9;       /* Gris separadores */
  --classic-background: #ffffff;   /* Blanco */
  --classic-text: #000000;         /* Negro */
}
```

### Tipografía

#### Fuentes
1. **Canva Sans** (Heading)
   - Peso: Bold (700)
   - Uso: Título principal del boletín
   - Fallback: Montserrat Bold, sans-serif

2. **Coco Gothic** (Heading)
   - Peso: Bold (700)
   - Uso: Títulos de categorías
   - Fallback: Oswald Bold, sans-serif

3. **Open Sans** (Body)
   - Pesos: Regular (400), Bold (700)
   - Uso: Todo el contenido de texto
   - Importar desde Google Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&family=Montserrat:wght@700&family=Oswald:wght@700&display=swap" rel="stylesheet">
```

#### Jerarquía de Tamaños
- Título principal: 44px
- Fecha: 22px
- Título de categoría: 44px
- Título de noticia: 42px
- Cuerpo de texto: 37px
- Link: 37px

---

### Responsive (Diseño Clásico)

#### Tablets (768px - 1023px)
```css
@media (max-width: 1023px) {
  .classic-bulletin {
    max-width: 100%;
    padding: 0 24px;
  }

  .classic-title {
    font-size: 36px;
  }

  .classic-date {
    font-size: 18px;
  }

  .classic-section-title {
    font-size: 36px;
  }

  .classic-news-title {
    font-size: 32px;
  }

  .classic-news-content {
    font-size: 28px;
  }

  .classic-link {
    font-size: 28px;
  }
}
```

#### Mobile (< 768px)
```css
@media (max-width: 767px) {
  .classic-header {
    height: 300px;
  }

  .classic-title {
    font-size: 28px;
    padding: 0 16px;
  }

  .classic-date {
    font-size: 16px;
  }

  .classic-section {
    margin: 40px 16px;
  }

  .classic-section-title {
    font-size: 28px;
  }

  .classic-news-title {
    font-size: 24px;
    text-align: left;
  }

  .classic-news-image {
    max-width: 100%;
  }

  .classic-news-content {
    font-size: 18px;
    text-align: left; /* Cambiar de justify a left para mobile */
  }

  .classic-link {
    font-size: 18px;
  }
}
```

---

## 🌐 Diseño Moderno

### Objetivo
Ofrecer una experiencia web contemporánea, responsive, con interacciones modernas y diseño card-based.

### Principios de Diseño
- **Modernidad**: Uso de gradientes, sombras, border-radius
- **Interactividad**: Hover effects, animaciones suaves
- **Eficiencia**: Cards compactas con información densa
- **Responsividad**: Mobile-first, adaptable a todos los tamaños
- **Accesibilidad**: Alto contraste, focus states claros

---

### Layout y Estructura

#### Contenedor Principal
```css
.modern-bulletin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Inter', sans-serif;
  background: #f9fafb;
}
```

#### Secciones Principales
1. **Header con Gradiente**
2. **Navegación de Categorías (Tabs/Pills)**
3. **Grid de Noticias (Cards)**
4. **Footer Minimalista**

---

### Header Moderno

#### Contenedor con Gradiente
```css
.modern-header {
  background: linear-gradient(135deg, #004aad 0%, #1a62ff 100%);
  padding: 48px 24px;
  border-radius: 16px;
  color: white;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(0, 74, 173, 0.2);
}
```

#### Título
```css
.modern-title {
  font-family: 'Inter', sans-serif;
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  margin: 0;
  color: #ffffff;
  letter-spacing: -0.5px;
}
```

#### Fecha
```css
.modern-date {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  opacity: 0.9;
  margin-top: 8px;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
```

---

### Navegación de Categorías

#### Contenedor de Badges
```css
.modern-categories {
  display: flex;
  gap: 12px;
  margin: 32px 0;
  overflow-x: auto;
  padding: 8px 0;
  scrollbar-width: thin;
}

.modern-categories::-webkit-scrollbar {
  height: 6px;
}

.modern-categories::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}
```

#### Badge de Categoría
```css
.modern-category-badge {
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  border: 2px solid transparent;
  user-select: none;
}

.modern-category-badge:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.modern-category-badge.active {
  background: #004aad;
  color: white;
  border-color: #004aad;
}
```

#### Iconos de Categorías
- Economía: `<DollarSign />` (lucide-react)
- Política: `<Landmark />`
- Sociedad: `<Users />`
- Seguridad: `<Shield />`
- Internacional: `<Globe />`
- Vial: `<Car />`

---

### Grid de Noticias

#### Contenedor Grid
```css
.modern-news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 32px;
}

@media (max-width: 768px) {
  .modern-news-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### Card de Noticia

#### Contenedor de Card
```css
.modern-news-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modern-news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: #004aad;
}
```

#### Header de Card (Badge + Icono)
```css
.modern-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modern-category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.modern-source-badge {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

#### Imagen de Card
```css
.modern-card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  background: #f3f4f6;
}
```

#### Título de Card
```css
.modern-card-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modern-card-title:hover {
  color: #004aad;
}
```

#### Contenido de Card
```css
.modern-card-content {
  font-size: 15px;
  font-weight: 400;
  color: #4b5563;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

#### Footer de Card
```css
.modern-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.modern-read-more {
  color: #1a62ff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.2s ease;
}

.modern-read-more:hover {
  gap: 8px;
  text-decoration: underline;
}
```

---

### Paleta de Colores Moderna

```css
:root {
  /* Colores Principales */
  --modern-primary: #004aad;
  --modern-secondary: #1a62ff;
  --modern-accent: #e5e7eb;

  /* Backgrounds */
  --modern-bg-primary: #ffffff;
  --modern-bg-secondary: #f9fafb;
  --modern-bg-tertiary: #f3f4f6;

  /* Text Colors */
  --modern-text-primary: #111827;
  --modern-text-secondary: #4b5563;
  --modern-text-tertiary: #6b7280;

  /* Blues */
  --modern-blue-50: #eff6ff;
  --modern-blue-600: #1e40af;

  /* Shadows */
  --modern-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --modern-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --modern-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
  --modern-shadow-brand: 0 4px 12px rgba(0, 74, 173, 0.2);
}
```

---

### Tipografía Moderna

#### Fuente Principal
- **Inter** (Google Fonts)
- Pesos: 400, 500, 600, 700
- Variable font para mejor performance

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### Jerarquía de Tamaños
- Título principal (header): 48px
- Fecha: 14px
- Badge de categoría: 14px
- Título de card: 20px
- Contenido de card: 15px
- Labels pequeños: 12-13px

---

### Animaciones y Transiciones

```css
/* Fade In para Cards */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-news-card {
  animation: fadeIn 0.5s ease;
}

/* Stagger animation para múltiples cards */
.modern-news-card:nth-child(1) { animation-delay: 0.05s; }
.modern-news-card:nth-child(2) { animation-delay: 0.1s; }
.modern-news-card:nth-child(3) { animation-delay: 0.15s; }
.modern-news-card:nth-child(4) { animation-delay: 0.2s; }
.modern-news-card:nth-child(5) { animation-delay: 0.25s; }
.modern-news-card:nth-child(6) { animation-delay: 0.3s; }

/* Smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

### Responsive (Diseño Moderno)

#### Desktop (> 1200px)
```css
@media (min-width: 1200px) {
  .modern-bulletin {
    padding: 48px;
  }

  .modern-news-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### Tablet (768px - 1199px)
```css
@media (max-width: 1199px) and (min-width: 768px) {
  .modern-title {
    font-size: 40px;
  }

  .modern-news-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

#### Mobile (< 768px)
```css
@media (max-width: 767px) {
  .modern-bulletin {
    padding: 16px;
  }

  .modern-header {
    padding: 32px 16px;
    border-radius: 12px;
  }

  .modern-title {
    font-size: 32px;
  }

  .modern-categories {
    margin: 24px -16px;
    padding: 8px 16px;
  }

  .modern-news-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .modern-news-card {
    padding: 16px;
  }

  .modern-card-image {
    height: 160px;
  }
}
```

---

## 🔄 Design Switcher Component

### Requisitos del Switcher

#### Posición
- Sticky en top de la vista de boletín (opcional)
- Siempre visible
- No debe interferir con contenido

#### UI
```typescript
interface DesignSwitcherProps {
  currentDesign: 'classic' | 'modern';
  onDesignChange: (newDesign: 'classic' | 'modern') => void;
}
```

#### Estilos del Switcher
```css
.design-switcher {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  justify-content: center;
}

.switcher-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.switcher-option:hover {
  background: #f3f4f6;
}

.switcher-option.active {
  border-color: #004aad;
  background: #eff6ff;
}

.switcher-preview {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
}

.switcher-label {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
}

.switcher-option.active .switcher-label {
  color: #004aad;
}
```

---

## 📱 Consideraciones de Accesibilidad

### Ambos Diseños

#### Contraste
- Texto en fondo: ratio mínimo 4.5:1
- Azul #004aad en blanco: ✅ 7.2:1
- Negro #000000 en blanco: ✅ 21:1

#### Navegación por Teclado
- Todos los links y botones deben ser accesibles con Tab
- Focus states claramente visibles
- Skip links para navegación rápida

#### Screen Readers
- Headings jerárquicos (h1, h2, h3)
- Alt text descriptivo en imágenes
- ARIA labels donde sea necesario
- Landmark roles apropiados

#### Responsive Text
- Unidades relativas (rem, em) donde sea posible
- Zoom hasta 200% sin scroll horizontal
- Line-height adecuado (min 1.5)

---

## 🎯 Casos de Uso

### Cambio de Diseño

**Flujo de Usuario:**
1. Usuario visualiza boletín en diseño por defecto (Clásico)
2. Ve el Design Switcher en la parte superior
3. Click en opción "Moderno"
4. Animación suave de fade out/in (300ms)
5. Contenido se re-renderiza con diseño moderno
6. Preferencia se guarda en localStorage
7. Próxima visita: se carga automáticamente el diseño preferido

**Implementación:**
```typescript
// localStorage key
const DESIGN_PREF_KEY = 'bulletin-design-preference';

// Guardar preferencia
function saveDesignPreference(design: 'classic' | 'modern') {
  localStorage.setItem(DESIGN_PREF_KEY, design);
}

// Cargar preferencia
function loadDesignPreference(): 'classic' | 'modern' {
  return (localStorage.getItem(DESIGN_PREF_KEY) as 'classic' | 'modern') || 'classic';
}
```

---

## 🧪 Testing de Diseños

### Checklist de Validación

#### Diseño Clásico
- [ ] Header con imagen de fondo se muestra correctamente
- [ ] Título y fecha están centrados y en tamaño correcto
- [ ] Las 6 secciones tienen numeración y subrayado
- [ ] Imágenes están centradas y con tamaño apropiado
- [ ] Texto está justificado
- [ ] Links "Leer más" están alineados a la derecha
- [ ] Separadores grises son visibles
- [ ] Footer y logo se muestran correctamente
- [ ] Responsive funciona en tablet y mobile

#### Diseño Moderno
- [ ] Header con gradiente se renderiza correctamente
- [ ] Badges de categorías son interactivos
- [ ] Cards tienen sombra y hover effect
- [ ] Grid es responsive (3→2→1 columnas)
- [ ] Imágenes de cards tienen border-radius
- [ ] Animaciones son suaves
- [ ] Todo es accesible con teclado
- [ ] Mobile: scroll horizontal funciona en badges

---

**Versión**: 1.0
**Fecha**: Noviembre 2025
**Proyecto**: OttoSeguridad - Sistema de Boletines
