
import { useState, useEffect } from 'react';

let deferredPromptGlobal: any = null;

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(deferredPromptGlobal);
  const [isInstallable, setIsInstallable] = useState(false); 
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
        const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStand);
        if (isStand) {
            setIsInstallable(false);
            return;
        }
    };
    
    checkStandalone();

    const handler = (e: any) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
        setIsInstallable(false);
        setIsStandalone(true);
        deferredPromptGlobal = null;
        setDeferredPrompt(null);
    });
    
    // Check iOS Manual
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isStandalone) {
        setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone]);

  const installApp = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          deferredPromptGlobal = null;
          setDeferredPrompt(null);
          setIsInstallable(false);
        }
        return;
    }
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
        alert("To install on iOS:\n\n1. Tap the Share button\n2. Select 'Add to Home Screen'");
    } else {
        alert("To install, use the browser's menu (three dots) and select 'Install App' or 'Add to Home Screen'.");
    }
  };

  return { isInstallable, installApp, isStandalone };
};
