import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

export const BackgroundLayer: React.FC = () => {
  return (
    <AbsoluteFill>
      <Img
        src={staticFile('backgrounds/newsroom-bg.jpg')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.85, // Ligeramente transparente para destacar el avatar
        }}
      />
    </AbsoluteFill>
  );
};
