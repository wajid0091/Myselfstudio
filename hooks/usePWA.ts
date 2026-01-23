import { useState, useEffect } from 'react';

// Global variable to hold the event if it fires before the component mounts
let deferredPromptGlobal: any = null;

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(deferredPromptGlobal);
  const [isInstallable, setIsInstallable] = useState(false); 
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const checkStandalone = () => {
        const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStand);
        if (isStand) {
            setIsInstallable(false);
            return;
        }
    };
    
    checkStandalone();

    // 2. Check for iOS (iPhone/iPad/iPod)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // If iOS and not standalone, it's technically "installable" via manual steps
    if (isIOS && !isStandalone) {
        setIsInstallable(true);
    }

    // 3. Handle Android/Desktop Native Prompt
    const handler = (e: any) => {
      e.preventDefault(); // Prevent automatic mini-infobar
      deferredPromptGlobal = e;
      setDeferredPrompt(e);
      setIsInstallable(true); // Native install is available
    };

    // If it fired before mount
    if (deferredPromptGlobal && !isStandalone) {
        setDeferredPrompt(deferredPromptGlobal);
        setIsInstallable(true);
    }

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
        setIsInstallable(false);
        setIsStandalone(true);
        deferredPromptGlobal = null;
        setDeferredPrompt(null);
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone]);

  const installApp = async () => {
    // SCENARIO 1: Android / Desktop (Native Prompt Available)
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
    
    // SCENARIO 2: iOS (Manual Instructions)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
        alert("To install on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'");
        return;
    }

    // SCENARIO 3: Fallback / Unknown
    alert("To install, look for the 'Add to Home Screen' option in your browser menu (usually the three dots).");
  };

  return { isInstallable, installApp, isStandalone };
};