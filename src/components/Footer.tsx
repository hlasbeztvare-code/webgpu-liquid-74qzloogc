import { motion } from 'framer-motion';
import { Sparkline } from './Sparkline';

interface FooterProps {
  prices: { sol: number; eth: number };
  history: { sol: number[]; eth: number[] };
  onDetonate: () => void;
}

export const Footer = ({ prices, history, onDetonate }: FooterProps) => (
  <footer className="fixed bottom-10 left-10 z-40 flex items-baseline gap-10">
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="flex flex-col gap-2 group"
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] uppercase tracking-widest opacity-30">Solana // Live</span>
          <span className="text-xl font-bold tabular-nums">${prices.sol.toFixed(2)}</span>
        </div>
        <Sparkline data={history.sol} />
      </div>
    </motion.div>
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="flex flex-col gap-2 group"
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] uppercase tracking-widest opacity-30">Ethereum // Live</span>
          <span className="text-xl font-bold tabular-nums">${prices.eth.toFixed(2)}</span>
        </div>
        <Sparkline data={history.eth} />
      </div>
    </motion.div>
    <motion.div 
      onClick={onDetonate}
      whileHover={{ scale: 1.1, color: '#ff0000' }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      className="fixed bottom-10 right-10 z-40 cursor-pointer border border-white/5 px-4 py-2 flex items-center gap-3 group hover:border-red-500/30 transition-all bg-black/40 backdrop-blur-sm"
    >
      <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]" />
      <span className="text-[9px] uppercase tracking-[0.4em] text-white/20 group-hover:text-red-500 transition-colors">Detonate Protocol</span>
    </motion.div>
  </footer>
);
