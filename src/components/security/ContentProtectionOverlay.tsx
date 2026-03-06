type ContentProtectionOverlayProps = {
  isDevtoolsOpen?: boolean;
};

const ContentProtectionOverlay = ({ isDevtoolsOpen = false }: ContentProtectionOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[200] bg-background/85 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-2">
        <p className="text-sm font-semibold text-foreground">Protected content hidden</p>
        <p className="text-xs text-muted-foreground">
          Content is restored automatically when you return focus to this tab.
        </p>
        {isDevtoolsOpen && (
          <p className="text-xs text-destructive">Developer tools detected. Close them to resume content.</p>
        )}
      </div>
    </div>
  );
};

export default ContentProtectionOverlay;
