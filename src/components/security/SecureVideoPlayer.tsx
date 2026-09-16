import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';

import { getApiBaseUrl } from '@/lib/api';

type DrmSource = {
  manifestUrl: string;
  licenseServerUrl: string;
};

export type SecureVideoPlayerProps = {
  src?: string;
  drm?: DrmSource;
  className?: string;
  watermarkText?: string;
  showWatermark?: boolean;
  poster?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onPause?: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onEnded?: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onLoadedMetadata?: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onPlay?: (e: SyntheticEvent<HTMLVideoElement>) => void;
};

/**
 * Resolves standard media URLs to use the high-performance range streaming endpoint
 */
export const getOptimizedStreamingUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  let url = rawUrl;
  if (!/^https?:\/\//i.test(url)) {
    const base = getApiBaseUrl();
    url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  if (url.includes('/uploads/')) {
    return url.replace('/uploads/', '/api/media/stream/');
  }
  return url;
};

const SecureVideoPlayer = forwardRef<HTMLVideoElement, SecureVideoPlayerProps>(
  (
    {
      src,
      drm,
      className = 'w-full h-full object-contain',
      watermarkText,
      showWatermark = true,
      poster,
      autoPlay = false,
      onTimeUpdate,
      onPause,
      onEnded,
      onLoadedMetadata,
      onPlay,
    },
    ref,
  ) => {
    const internalVideoRef = useRef<HTMLVideoElement | null>(null);
    const [drmError, setDrmError] = useState<string | null>(null);
    const [watermarkPosIndex, setWatermarkPosIndex] = useState(0);
    const [liveTime, setLiveTime] = useState<string>('');

    // Expose internal video ref to forwarded ref
    useImperativeHandle(ref, () => internalVideoRef.current as HTMLVideoElement);

    // Optimized streaming URL
    const streamSrc = getOptimizedStreamingUrl(src);

    // Dynamic drifting watermark positions to deter screen recording
    const watermarkPositions = [
      'top-3 right-4 text-right',
      'bottom-12 left-4 text-left',
      'top-1/3 left-6 text-left',
      'bottom-1/3 right-6 text-right',
      'top-4 left-4 text-left',
    ];

    useEffect(() => {
      if (!showWatermark || !watermarkText) return;

      const updateTimestamp = () => {
        const d = new Date();
        setLiveTime(
          d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
            ' ' +
            d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        );
      };

      updateTimestamp();
      const timeInterval = window.setInterval(updateTimestamp, 30000);

      // Periodically shift watermark location smoothly
      const posInterval = window.setInterval(() => {
        setWatermarkPosIndex((prev) => (prev + 1) % watermarkPositions.length);
      }, 18000);

      return () => {
        window.clearInterval(timeInterval);
        window.clearInterval(posInterval);
      };
    }, [showWatermark, watermarkText]);

    useEffect(() => {
      let destroyPlayer: (() => void) | null = null;
      const video = internalVideoRef.current;
      if (!video) return;

      setDrmError(null);

      if (!drm?.manifestUrl || !drm.licenseServerUrl) {
        if (streamSrc) {
          video.src = streamSrc;
        }
        return;
      }

      const initializeDrm = async () => {
        try {
          const shakaModule = await import('shaka-player');
          const shaka = ((shakaModule as unknown as { default?: unknown }).default ?? shakaModule) as {
            polyfill: { installAll: () => void };
            Player: {
              isBrowserSupported: () => boolean;
              new (el: HTMLVideoElement): {
                destroy: () => void;
                configure: (c: object) => void;
                load: (url: string) => Promise<void>;
              };
            };
          };
          shaka.polyfill.installAll();
          if (!shaka.Player.isBrowserSupported()) {
            setDrmError('This browser does not support DRM playback.');
            return;
          }

          const player = new shaka.Player(video);
          destroyPlayer = () => {
            player.destroy();
          };

          player.configure({
            drm: {
              servers: {
                'com.widevine.alpha': drm.licenseServerUrl,
              },
            },
          });

          await player.load(drm.manifestUrl);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to initialize DRM video.';
          setDrmError(message);
        }
      };

      initializeDrm();

      return () => {
        if (destroyPlayer) {
          destroyPlayer();
        }
      };
    }, [streamSrc, drm?.manifestUrl, drm?.licenseServerUrl]);

    return (
      <div
        className="relative w-full h-full select-none bg-black overflow-hidden group"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <video
          ref={internalVideoRef}
          className={className}
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          preload="metadata"
          poster={poster}
          autoPlay={autoPlay}
          onTimeUpdate={onTimeUpdate}
          onPause={onPause}
          onEnded={onEnded}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={onPlay}
          onContextMenu={(event) => event.preventDefault()}
        />

        {/* Dynamic anti-piracy user watermark */}
        {showWatermark && watermarkText && (
          <div
            className={`pointer-events-none absolute z-10 transition-all duration-1000 ease-in-out select-none opacity-30 group-hover:opacity-45 ${watermarkPositions[watermarkPosIndex]}`}
          >
            <div className="font-mono text-[20px] tracking-wider text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              <span>{watermarkText}</span>
              {liveTime && <span className="ml-2 opacity-80">{liveTime}</span>}
            </div>
          </div>
        )}

        {drmError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 text-white text-xs p-4 text-center z-20">
        {drmError}
          </div>
        )}
      </div>
    );
  },
);

SecureVideoPlayer.displayName = 'SecureVideoPlayer';

export default SecureVideoPlayer;
