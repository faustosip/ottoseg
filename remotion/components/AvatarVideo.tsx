import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';

interface AvatarVideoProps {
  avatarSrc: string;
}

export const AvatarVideo: React.FC<AvatarVideoProps> = ({avatarSrc}) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: '0 40px 200px 40px', // Espacio para el footer
      }}
    >
      <div
        style={{
          width: '500px',
          height: '700px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '4px solid #C41E3A', // Borde rojo corporativo
          backgroundColor: '#000', // Fondo negro por si el video no carga
        }}
      >
        <OffthreadVideo
          src={staticFile(avatarSrc)}
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
