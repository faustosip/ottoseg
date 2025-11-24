import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

interface BrandingOverlayProps {
  bulletinDate: string;
}

export const BrandingOverlay: React.FC<BrandingOverlayProps> = ({
  bulletinDate,
}) => {
  return (
    <AbsoluteFill>
      {/* Header - Fecha */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          width: '100%',
          height: '120px',
          backgroundColor: '#C41E3A', // Rojo corporativo
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          fontSize: 32,
          fontWeight: 'bold',
          color: 'white',
          textTransform: 'uppercase',
          padding: '0 20px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        {bulletinDate}
      </div>

      {/* Footer - Logo */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '180px',
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Img
          src={staticFile('logos/otto-logo.png')}
          style={{
            height: '120px',
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
