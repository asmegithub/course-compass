import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

interface LiveRoomProps {
  token: string;
  onDisconnected: () => void;
}

export const LiveRoom = ({ token, onDisconnected }: LiveRoomProps) => {
  // Use env var or default to standard localhost websocket (ws for local dev)
  const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://127.0.0.1:7880';

  return (
    <div className="w-full h-screen bg-card text-foreground flex flex-col relative" data-lk-theme="default">
      {/* Decorative gradient matching Marian blue theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 pointer-events-none z-0" />
      
      <div className="relative z-10 flex-1 h-full w-full max-w-[1920px] mx-auto p-2 sm:p-4 shadow-glass rounded-xl overflow-hidden">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={liveKitUrl}
          onDisconnected={onDisconnected}
          className="h-full w-full rounded-xl overflow-hidden border border-border/50 bg-background/50 backdrop-blur-md"
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
};
