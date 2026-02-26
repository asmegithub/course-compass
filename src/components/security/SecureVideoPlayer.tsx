import { useEffect, useRef, useState } from 'react';

type DrmSource = {
  manifestUrl: string;
  licenseServerUrl: string;
};

type SecureVideoPlayerProps = {
  src?: string;
  drm?: DrmSource;
  className?: string;
};

const SecureVideoPlayer = ({ src, drm, className }: SecureVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [drmError, setDrmError] = useState<string | null>(null);

  useEffect(() => {
    let destroyPlayer: (() => void) | null = null;
    const video = videoRef.current;
    if (!video) return;

    setDrmError(null);

    if (!drm?.manifestUrl || !drm.licenseServerUrl) {
      if (src) {
        video.src = src;
      }
      return;
    }

    const initializeDrm = async () => {
      try {
        const shakaModule = await import('shaka-player/dist/shaka-player.compiled.js');
        const shaka = (shakaModule as unknown as { default?: any }).default || (shakaModule as unknown as any);
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
  }, [src, drm?.manifestUrl, drm?.licenseServerUrl]);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        className={className}
        controls
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        onContextMenu={(event) => event.preventDefault()}
      />
      {drmError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-xs p-4 text-center">
          {drmError}
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
