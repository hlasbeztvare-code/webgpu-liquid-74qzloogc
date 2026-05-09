import { motion } from 'framer-motion';

interface HeaderProps {
  isArchitectMode: boolean;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onToggleArchitect: () => void;
}

export const Header = ({
  isArchitectMode,
  isFullScreen,
  onToggleFullScreen,
  onToggleArchitect,
}: HeaderProps) => (
  <motion.header 
    initial={{ y: -50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2, duration: 0.8 }}
    className="fixed top-0 left-0 w-full p-10 flex justify-between items-center z-50"
  >
    <div className="w-40 h-20 opacity-50">
      {/* Tady už logo nebude, protože ho renderuje SovereignRive přes celou obrazovku */}
      <span className="text-[10px] tracking-[0.5em]">L-CODE // DYNAMICS</span>
    </div>
    
    <div className="flex items-center gap-10">
      <div 
        onClick={onToggleFullScreen}
        className="cursor-pointer group flex items-center gap-2"
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-white/30 group-hover:text-white transition-colors">
          [ {isFullScreen ? 'Exit' : 'Full Screen'} ]
        </span>
      </div>

      <div 
        onClick={onToggleArchitect} 
        className="cursor-pointer group flex items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Architect</span>
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isArchitectMode ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/20'}`} />
      </div>
    </div>
  </motion.header>
);
