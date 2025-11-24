import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {BrandingOverlay} from '../components/BrandingOverlay';
import {NewsSegment} from '../components/NewsSegment';

export interface NewsItem {
  category: string;
  title: string;
  imageUrl?: string;
  avatarVideoUrl: string;
  duration: number; // en segundos
}

export interface BulletinNewsVideoProps {
  bulletinDate: string;
  news: NewsItem[];
  totalDuration?: number; // duración total en segundos
}

export const BulletinNewsVideo: React.FC<BulletinNewsVideoProps> = ({
  bulletinDate,
  news,
}) => {
  const {fps} = useVideoConfig();

  // Calcular frames acumulados para cada secuencia
  let currentFrame = 0;
  const sequences = news.map((newsItem) => {
    const durationInFrames = Math.round(newsItem.duration * fps);
    const startFrame = currentFrame;

    currentFrame += durationInFrames;

    return {
      ...newsItem,
      startFrame,
      durationInFrames,
    };
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* Layer 1: Branding (Header + Footer) - Siempre visible */}
      <BrandingOverlay bulletinDate={bulletinDate} />

      {/* Layer 2: Secuencias de noticias */}
      {sequences.map((seq, index) => (
        <Sequence
          key={`news-${seq.category}-${index}`}
          from={seq.startFrame}
          durationInFrames={seq.durationInFrames}
        >
          <NewsSegment
            imageUrl={seq.imageUrl}
            avatarVideoUrl={seq.avatarVideoUrl}
            title={seq.title}
            category={seq.category}
            durationInFrames={seq.durationInFrames}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
