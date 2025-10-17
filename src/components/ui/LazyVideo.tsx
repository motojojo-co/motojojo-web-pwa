import { useEffect, useRef, useState } from 'react';
import type { VideoHTMLAttributes } from 'react';
import VideoPlaceholder from './VideoPlaceholder';

interface LazyVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  fallbackSrc: string;
  className?: string;
}

export default function LazyVideo({ src, fallbackSrc, className, ...props }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading when within 200px of viewport
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoadedData={() => setIsLoaded(true)}
        preload="metadata"
        playsInline
        {...props}
      >
        {isIntersecting && (
          <>
            <source src={src} type="video/webm" />
            <source src={fallbackSrc} type="video/mp4" />
          </>
        )}
        Your browser does not support the video tag.
      </video>
      {!isLoaded && <VideoPlaceholder />}
    </div>
  );
}
