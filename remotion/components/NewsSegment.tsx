/**
 * Componente para mostrar un segmento individual de noticia
 * Incluye: imagen de fondo + video de avatar + título
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
} from 'remotion';

interface NewsSegmentProps {
  imageUrl?: string;
  avatarVideoUrl: string;
  title: string;
  category: string;
  durationInFrames: number;
  categoryColor?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  economia: '#2E7D32', // Verde
  politica: '#1565C0', // Azul
  sociedad: '#F57C00', // Naranja
  seguridad: '#C41E3A', // Rojo
  internacional: '#6A1B9A', // Púrpura
  vial: '#FFB300', // Amarillo
};

export const NewsSegment: React.FC<NewsSegmentProps> = ({
  imageUrl,
  avatarVideoUrl,
  title,
  category,
  durationInFrames,
  categoryColor,
}) => {
  const frame = useCurrentFrame();

  // Animación de entrada (fade in)
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Animación de salida (fade out)
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
    }
  );

  const finalOpacity = Math.min(opacity, fadeOut);

  const color = categoryColor || CATEGORY_COLORS[category] || '#C41E3A';

  return (
    <AbsoluteFill style={{ opacity: finalOpacity }}>
      {/* Imagen de fondo de la noticia */}
      {imageUrl && (
        <AbsoluteFill>
          <Img
            src={imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.7)', // Oscurecer para mejor contraste
            }}
          />
          {/* Overlay para mejor legibilidad */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Badge de categoría */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 40,
          backgroundColor: color,
          padding: '12px 24px',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          fontSize: 28,
          fontWeight: 'bold',
          color: 'white',
          textTransform: 'uppercase',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        {category}
      </div>

      {/* Título de la noticia */}
      <div
        style={{
          position: 'absolute',
          top: 220,
          left: 40,
          right: 40,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '20px 30px',
          borderRadius: '12px',
          borderLeft: `6px solid ${color}`,
          maxWidth: '1000px',
        }}
      >
        <p
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 36,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            lineHeight: 1.4,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          {title}
        </p>
      </div>

      {/* Video del avatar - Esquina inferior derecha */}
      <div
        style={{
          position: 'absolute',
          bottom: 200, // Espacio para el footer
          right: 40,
          width: '500px',
          height: '700px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: `4px solid ${color}`,
          backgroundColor: '#000',
        }}
      >
        <OffthreadVideo
          src={avatarVideoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
