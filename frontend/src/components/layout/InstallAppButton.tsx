import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    if (isIPhoneOrIPad) {
      setIsIOS(true);
      setIsInstallable(true);
    }

    // Listen for beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      alert("To install this app, tap your browser's menu (three dots ⋮) and select 'Install app' or 'Add to Home screen'.");
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install Call Center App on your phone"
        className="h-8 px-2.5 rounded-md bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sm hover:shadow text-xs font-semibold inline-flex items-center space-x-1.5 transition active:scale-95 animate-pulse"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">Install App</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <img src="/pwa-192x192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow" />
              <div>
                <h3 className="font-bold text-base text-white">Install on iPhone / iPad</h3>
                <p className="text-xs text-sky-400 font-medium">Add to your Home Screen</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button (📤) in Safari's bottom toolbar.</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">2</span>
                <span>Scroll down and select <strong>'Add to Home Screen'</strong> (➕).</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">3</span>
                <span>Tap <strong>'Add'</strong> in the top right. You can now open it like a native mobile app!</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
