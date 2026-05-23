import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { velocityBridge } from '@/shared/velocity';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useCryptoFeed } from '@/hooks/useCryptoFeed';

import { LiquidBackground } from '@/components/LiquidBackground';
import { Preloader } from '@/components/Preloader';
import { ContactReveal } from '@/components/ContactReveal';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SovereignRive } from '@/SovereignRive';
import { useSovereignVoice } from '@/hooks/useSovereignVoice';
import { ConversationProvider } from '@elevenlabs/react';

function AppContent() {
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem('sovereign_initialized');
  });
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDetonating, setIsDetonating] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [voiceInitiated, setVoiceInitiated] = useState(false);

  const { playSwitch, playDetonate } = useAudioEngine();
  const { prices, history } = useCryptoFeed();

  // Používáme nativní metody startSession/stopSession z našeho vyladěného hooku
  const { startSession, stopSession, isConnected, isSpeaking } = useSovereignVoice({
    agentId: 'agent_3401ks9bnnrgerzvgbje3ggft0nq'
  });

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

    // Pokud Jindřich mluví, při detonaci ho natvrdo utneme, ať uvolníme kanál
    stopSession();

    setTimeout(() => {
      setShowContact(true);
      velocityBridge.isDetonating = false;
      setIsDetonating(false);
    }, 4500);
  }, [playDetonate, stopSession]);

  const reboot = useCallback(() => {
    setShowContact(false);
    localStorage.removeItem('sovereign_initialized');
    window.location.reload();
  }, []);

  const toggleArchitect = useCallback(() => {
    const next = !isArchitectMode;
    playSwitch(next);
    setIsArchitectMode(next);

    // Místo rizikového sendVoiceInput za běhu raději při radikální změně režimu 
    // relaci restartujeme, aby Jindřich okamžitě zareagoval novým tónem, 
    // nebo necháme reaktivitu čistě na hlasovém vstupu z mikrofonu.
  }, [isArchitectMode, playSwitch]);

  const triggerVoiceSequence = useCallback(() => {
    if (!voiceInitiated && !isConnected) {
      setVoiceInitiated(true);
      startSession(); // Zažehnutí mikrofonu a streamu
    }
  }, [voiceInitiated, isConnected, startSession]);

  const handleGlobalClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() !== 'button' && !target.closest('button')) {
      triggerVoiceSequence();
    }
  }, [triggerVoiceSequence]);

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden font-mono text-[#C5A27D]"
      onClick={handleGlobalClick}
    >
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

export default function App() {
  const [userId] = useState(() => {
    let id = localStorage.getItem('sovereign_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sovereign_user_id', id);
    }
    return id;
  });

  return (
    <ConversationProvider
      agentId="agent_3401ks9bnnrgerzvgbje3ggft0nq"
      userId={userId}
    >
      <AppContent />
    </ConversationProvider>
  );
}