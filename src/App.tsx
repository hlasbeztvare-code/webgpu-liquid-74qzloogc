import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { velocityBridge } from '@/shared/velocity';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useCryptoFeed } from '@/hooks/useCryptoFeed';
import { useIdleDetonate } from '@/hooks/useIdleDetonate';
import { LiquidBackground } from '@/components/LiquidBackground';
import { Preloader } from '@/components/Preloader';
import { ContactReveal } from '@/components/ContactReveal';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SovereignRive } from '@/SovereignRive';

export default function App() {
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem('sovereign_initialized');
  });
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDetonating, setIsDetonating] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const { playSwitch, playDetonate } = useAudioEngine();
  const { prices, history } = useCryptoFeed();

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  }, []);

  const detonate = useCallback(() => {
    setIsDetonating(true);
    velocityBridge.isDetonating = true;
    playDetonate();

    setTimeout(() => {
      setShowContact(true);
      velocityBridge.isDetonating = false;
      setIsDetonating(false);
    }, 4500);
  }, [playDetonate]);

  const reboot = useCallback(() => {
    setShowContact(false);
    localStorage.removeItem('sovereign_initialized');
    window.location.reload();
  }, []);

  const toggleArchitect = useCallback(() => {
    const next = !isArchitectMode;
    playSwitch(next);
    setIsArchitectMode(next);
  }, [isArchitectMode, playSwitch]);

  useIdleDetonate(detonate, isLoading || showContact || isDetonating);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-[#C5A27D]">
      <AnimatePresence>
        {isLoading && (
          <Preloader onComplete={() => {
            setIsLoading(false);
            localStorage.setItem('sovereign_initialized', 'true');
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContact && <ContactReveal onReboot={reboot} />}
      </AnimatePresence>

      {!isLoading && !showContact && (
        <>
          <LiquidBackground isArchitectMode={isArchitectMode} />

          {/* RIVE OVERLAY — Full-screen, blended with shader via screen mode */}
          <SovereignRive
            isArchitectMode={isArchitectMode}
            isDetonating={isDetonating}
            fullScreen
          />

          <Header
            isArchitectMode={isArchitectMode}
            isFullScreen={isFullScreen}
            onToggleFullScreen={toggleFullScreen}
            onToggleArchitect={toggleArchitect}
          />

          <Footer
            prices={prices}
            history={history}
            onDetonate={detonate}
          />
        </>
      )}
    </div>
  );
}
