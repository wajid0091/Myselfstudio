import { useState, useEffect } from 'react';

// Global variable to hold the event if it fires before the component mounts
let deferredPromptGlobal: any = null;

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(deferredPromptGlobal);
  const [isInstallable, setIsInstallable] = useState(false); // Default false until we know
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const checkStandalone = () => {
        const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStand);
        if (isStand) setIsInstallable(false); // Don't show install if already installed
    };
    
    checkStandalone();

    const handler = (e: any) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setDeferredPrompt(e);
      // Only set installable if NOT standalone
      if (!window.matchMedia('(display-mode: standalone)').matches) {
          setIsInstallable(true);
      }
    };

    // If it already fired before this hook ran (unlikely but possible in SPA navigation), set it.
    if (deferredPromptGlobal && !isStandalone) {
        setDeferredPrompt(deferredPromptGlobal);
        setIsInstallable(true);
    }

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
        setIsInstallable(false);
        setIsStandalone(true);
        deferredPromptGlobal = null;
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone]);

  const installApp = async () => {
    if (!deferredPrompt) {
        // Fallback for browsers that don't support beforeinstallprompt or haven't fired it yet
        alert("To install, tap the Share icon (iOS) or Menu icon (Android) and select 'Add to Home Screen'.");
        return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      deferredPromptGlobal = null;
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, installApp, isStandalone };
};