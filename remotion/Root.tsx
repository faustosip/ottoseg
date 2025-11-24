import React from 'react';
import {Composition} from 'remotion';
import {
  BulletinNewsVideo,
  BulletinNewsVideoProps,
} from './compositions/BulletinNewsVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BulletinNews"
        component={BulletinNewsVideo as unknown as React.FC<Record<string, unknown>>}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          bulletinDate: 'DOMINGO 23 DE NOVIEMBRE DE 2025',
          news: [
            {
              category: 'economia',
              title: 'Economía ecuatoriana crece un 3.5% en el último trimestre',
              imageUrl: 'https://example.com/economia.jpg',
              avatarVideoUrl: 'https://example.com/avatar-economia.mp4',
              duration: 10,
            },
            {
              category: 'politica',
              title: 'Asamblea aprueba nueva ley de transparencia',
              imageUrl: 'https://example.com/politica.jpg',
              avatarVideoUrl: 'https://example.com/avatar-politica.mp4',
              duration: 10,
            },
          ],
        }}
        calculateMetadata={({props}) => {
          const bulletinProps = props as unknown as BulletinNewsVideoProps;
          const totalDuration = bulletinProps.news.reduce(
            (sum: number, n) => sum + n.duration,
            0
          );
          const durationInFrames = Math.round(totalDuration * 30); // 30 fps

          return {
            durationInFrames,
            props,
          };
        }}
      />
    </>
  );
};
