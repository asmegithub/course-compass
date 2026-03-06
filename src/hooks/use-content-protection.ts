import { useEffect, useState } from 'react';

type UseContentProtectionOptions = {
  enabled?: boolean;
  detectDevtools?: boolean;
  blockPrint?: boolean;
  blockSelection?: boolean;
  blockContextMenu?: boolean;
  blockDrag?: boolean;
  blockShortcuts?: boolean;
  blockPrintScreen?: boolean;
};

const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if ((target as HTMLElement).isContentEditable) return true;
  return Boolean(target.closest('[data-allow-selection="true"]'));
};

const pauseMedia = () => {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach((element) => {
    if (element instanceof HTMLMediaElement && !element.paused) {
      element.pause();
    }
  });
};

export const useContentProtection = ({
  enabled = true,
  detectDevtools = true,
  blockPrint = true,
  blockSelection = true,
  blockContextMenu = true,
  blockDrag = true,
  blockShortcuts = true,
  blockPrintScreen = true,
}: UseContentProtectionOptions = {}) => {
  const [isContentObscured, setIsContentObscured] = useState(false);
  const [isDevtoolsOpen, setIsDevtoolsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsContentObscured(false);
      return;
    }

    let devtoolsInterval: number | null = null;

    const handleContextMenu = (event: MouseEvent) => {
      if (!blockContextMenu) return;
      if (!isInteractiveTarget(event.target)) {
        event.preventDefault();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!blockContextMenu) return;
      if (event.button === 2 && !isInteractiveTarget(event.target)) {
        event.preventDefault();
      }
    };

    const handleSelectStart = (event: Event) => {
      if (!blockSelection) return;
      if (!isInteractiveTarget(event.target)) {
        event.preventDefault();
      }
    };

    const handleDragStart = (event: DragEvent) => {
      if (!blockDrag) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tag = target.tagName.toLowerCase();
      if (tag === 'img' || tag === 'video' || tag === 'a') {
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!blockShortcuts) return;
      const key = event.key.toLowerCase();
      const isModifier = event.ctrlKey || event.metaKey;

      const blockedCombos = isModifier && (
        key === 's'
        || key === 'p'
        || key === 'u'
        || key === 'i'
        || key === 'j'
        || key === 'c'
      );

      const blockedShiftCombos = isModifier && event.shiftKey && (
        key === 'i' || key === 'j' || key === 'c'
      );

      const blockedFunctionKeys = key === 'f12';
      const blockedContextKeys = key === 'contextmenu' || (event.shiftKey && key === 'f10');

      if (blockedCombos || blockedShiftCombos || blockedFunctionKeys || blockedContextKeys) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!blockPrintScreen) return;
      const key = event.key.toLowerCase();
      if (key === 'printscreen') {
        hideContent();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('').catch(() => {
            // ignore clipboard permission failures
          });
        }
      }
    };

    const hideContent = () => {
      setIsContentObscured(true);
      pauseMedia();
    };

    const revealContentIfSafe = () => {
      if (document.hidden) return;
      if (!document.hasFocus()) return;
      if (isDevtoolsOpen) return;
      setIsContentObscured(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hideContent();
      } else {
        revealContentIfSafe();
      }
    };

    const handleWindowBlur = () => hideContent();
    const handleWindowFocus = () => {
      revealContentIfSafe();
      window.setTimeout(() => {
        revealContentIfSafe();
      }, 120);
    };
    const handlePageHide = () => hideContent();

    const handleBeforePrint = () => {
      if (!blockPrint) return;
      hideContent();
      window.setTimeout(() => {
        window.alert('Printing is disabled on protected content pages.');
      }, 0);
    };

    const handleAfterPrint = () => revealContentIfSafe();

    if (detectDevtools) {
      devtoolsInterval = window.setInterval(() => {
        const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
        const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
        const devtoolsOpen = widthDiff > 120 || heightDiff > 120;
        setIsDevtoolsOpen(devtoolsOpen);
        if (devtoolsOpen) {
          hideContent();
        }
      }, 1200);
    }

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      if (devtoolsInterval) {
        window.clearInterval(devtoolsInterval);
      }
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [
    enabled,
    detectDevtools,
    blockPrint,
    blockSelection,
    blockContextMenu,
    blockDrag,
    blockShortcuts,
    blockPrintScreen,
    isDevtoolsOpen,
  ]);

  const resumeContent = () => {
    if (document.hidden) return;
    if (!document.hasFocus()) return;
    if (isDevtoolsOpen) return;
    setIsContentObscured(false);
  };

  return {
    isContentObscured,
    isDevtoolsOpen,
    resumeContent,
  };
};
