'use client';

import {Player} from '@remotion/player';
import {
  BulletinNewsVideo,
  NewsItem,
} from '../../../remotion/compositions/BulletinNewsVideo';

interface VideoPreviewProps {
  bulletinDate: string;
  news?: NewsItem[];
}

export function VideoPreview({
  bulletinDate,
  news = [
    {
      category: 'economia',
      title: 'Noticia de ejemplo - Economía',
      imageUrl: 'https://via.placeholder.com/1080x1920',
      avatarVideoUrl: 'videos/avatar.mp4',
      duration: 10,
    },
  ],
}: VideoPreviewProps) {
  // Calcular duración total
  const totalDuration = news.reduce((sum, n) => sum + n.duration, 0);
  const durationInFrames = Math.round(totalDuration * 30); // 30 fps

  return (
    <div className="w-full max-w-[540px] mx-auto rounded-lg overflow-hidden shadow-xl border border-border">
      <Player
        component={BulletinNewsVideo}
        durationInFrames={durationInFrames}
        compositionWidth={1080}
        compositionHeight={1920}
        fps={30}
        style={{
          width: '100%',
          aspectRatio: '9/16',
        }}
        controls
        inputProps={{
          bulletinDate,
          news,
        }}
      />
    </div>
  );
}
