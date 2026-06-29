import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveRoom } from '@/components/live/LiveRoom';
import { getLiveKitToken } from '@/lib/livekit';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LiveClass = () => {
  const { slug } = useParams(); // Using slug/id mapping from router, but backend expects courseId. For now we use slug as courseId if they match, or we need to look up courseId.
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In this app, URL often uses `slug`, but APIs expect `courseId`.
  // Wait, the router path will be `/live/:courseId`.
  const { courseId } = useParams();

  useEffect(() => {
    // If router param is slug, we use slug, if it's courseId we use courseId
    const idToUse = courseId || slug;
    if (!idToUse) return;

    const fetchToken = async () => {
      try {
        setIsLoading(true);
        const fetchedToken = await getLiveKitToken(idToUse);
        setToken(fetchedToken);
      } catch (err: any) {
        setError(err.message || 'Failed to join live class. Please check if you are enrolled.');
        toast({
          title: 'Access Denied',
          description: err.message || 'You cannot access this live class.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [courseId, slug, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Connecting to classroom...</p>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center space-y-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full mb-2">
          <VideoOff className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold font-display">Connection Failed</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="accent">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return <LiveRoom token={token} onDisconnected={() => navigate(-1)} />;
};

export default LiveClass;
