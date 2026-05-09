import { motion } from 'framer-motion';
import { Sparkline } from './Sparkline';

interface FooterProps {
  prices: { sol: number; eth: number };
  history: { sol: number[]; eth: number[] };
  onDetonate: () => void;
}

export const Footer = ({ prices, history, onDetonate }: FooterProps) => (
  <footer className="fixed bottom-10 left-10 right-10 z-40 flex flex-col md:flex-row md:items-baseline md:gap-10 font-sans pointer-events-none">
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="flex flex-col md:flex-row gap-6 md:gap-12 pointer-events-auto"
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-thin text-white/20 uppercase tracking-[0.3em]">Solana // Live</span>
          <span className="text-sm font-thin tracking-widest text-white/90 tabular-nums">${prices.sol.toFixed(2)}</span>
        </div>
        <Sparkline data={history.sol} />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-thin text-white/20 uppercase tracking-[0.3em]">Ethereum // Live</span>
          <span className="text-sm font-thin tracking-widest text-white/90 tabular-nums">${prices.eth.toFixed(2)}</span>
        </div>
        <Sparkline data={history.eth} />
      </div>
    </motion.div>

    <motion.div 
      onClick={onDetonate} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="mt-10 md:mt-0 md:fixed md:bottom-10 md:right-10 z-40 border border-white/5 px-10 py-4 bg-black/40 backdrop-blur-sm cursor-pointer text-center group pointer-events-auto"
    >
      <span className="text-[10px] font-thin tracking-[0.8em] uppercase text-white/40 group-hover:text-white transition-all">
        Detonate Protocol
      </span>
    </motion.div>
  </footer>
);
