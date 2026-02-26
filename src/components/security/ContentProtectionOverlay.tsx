type ContentProtectionOverlayProps = {
  onResume?: () => void;
  isDevtoolsOpen?: boolean;
};

const ContentProtectionOverlay = ({ onResume, isDevtoolsOpen = false }: ContentProtectionOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[200] bg-background/85 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-2">
        <p className="text-sm font-semibold text-foreground">Protected content hidden</p>
        <p className="text-xs text-muted-foreground">
          Return focus to this tab and close developer tools to continue viewing content.
        </p>
        {isDevtoolsOpen ? (
          <p className="text-xs text-destructive">Developer tools detected. Close them to resume content.</p>
        ) : (
          <button
            type="button"
            onClick={onResume}
            className="mt-2 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Resume Content
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentProtectionOverlay;
