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
  <header className="fixed top-0 left-0 w-full p-6 md:p-10 flex justify-between items-start z-50 pointer-events-none">
    
    {/* Left: Identity Block */}
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="pointer-events-auto"
    >
      <div className="flex flex-col gap-1 border-l border-white/10 pl-4 py-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-white/60" />
          <span className="text-[9px] font-bold tracking-[0.4em] text-white/90 uppercase">L-Code</span>
        </div>
        <span className="text-[7px] tracking-[0.5em] text-white/20 uppercase pl-3">Dynamics</span>
      </div>
    </motion.div>

    {/* Center: Fullscreen / Status (Skryté na malém mobilu pro čistotu) */}
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      onClick={onToggleFullScreen}
      className="hidden sm:flex items-center gap-8 border border-white/5 px-6 py-2 bg-black/20 backdrop-blur-md pointer-events-auto cursor-pointer group"
    >
       <span className="text-[8px] tracking-[0.4em] text-white/20 group-hover:text-white/60 transition-colors uppercase">
         [ {isFullScreen ? 'Exit Fullscreen' : 'System Active'} ]
       </span>
    </motion.div>

    {/* Right: Architect Toggle */}
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      onClick={onToggleArchitect}
      className="pointer-events-auto cursor-pointer flex flex-col items-end gap-1 group"
    >
      <span className="text-[8px] tracking-[0.3em] text-white/40 uppercase group-hover:text-white/60 transition-colors">Mode</span>
      <div className="flex items-center gap-3">
        <span className="text-[9px] tracking-[0.2em] text-white/80 uppercase font-medium group-hover:text-white transition-colors">
          {isArchitectMode ? 'Architect' : 'Sovereign'}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isArchitectMode ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/10'}`} />
      </div>
    </motion.div>

  </header>
);
