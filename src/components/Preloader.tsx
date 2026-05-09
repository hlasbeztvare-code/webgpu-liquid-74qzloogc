import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BOOT_STEPS = [
  'CORE // VANGUARD KERNEL 8.4.1',
  'NET // ESTABLISHING P2P_TUNNEL...',
  'NET // CONNECTING TO COINGECKO_FEED...',
  'MEM // ALLOCATING QUANTUM_SINGULARITY...',
  'SDR // COMPILING SHADER_CORE...',
  'ENC // ENCRYPTING PEER_STREAMS...',
  'AUTH // SOVEREIGN_IDENTITY: VERIFIED',
  'SYSTEM // READY'
];

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader = ({ onComplete }: PreloaderProps) => {
  const [steps, setSteps] = useState<string[]>([]);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < BOOT_STEPS.length) {
        setSteps(prev => [...prev, BOOT_STEPS[current]]);
        current++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1500);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-10 font-mono"
    >
      <div className="w-full max-w-md flex flex-col gap-2 relative z-10">
        <motion.div 
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[#C5A27D] text-[10px] mb-8 tracking-[1em] text-center"
        >
          LUCKY PROTOCOL // LOADING
        </motion.div>
        
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 border-b border-white/5 py-2"
          >
            <span className="text-[10px] text-white/20">0{i+1}</span>
            <span className="text-[11px] text-white/80 tracking-widest">{step}</span>
            <div className="ml-auto w-1 h-1 bg-[#C5A27D] rounded-full animate-pulse" />
          </motion.div>
        ))}

        <div className="mt-10 flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-white/10 overflow-hidden relative">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 7, ease: 'linear' }}
              className="absolute inset-0 bg-[#C5A27D]"
            />
          </div>
          <span className="text-[10px] text-white/40 tabular-nums">SCANNING...</span>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={steps.length}
          initial={{ opacity: 0.15 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-white pointer-events-none z-[5]"
        />
      </AnimatePresence>

      <motion.div 
        animate={{ opacity: [0, 0.05, 0] }}
        transition={{ repeat: Infinity, duration: 0.1 }}
        className="absolute inset-0 bg-white pointer-events-none"
      />
    </motion.div>
  );
};
