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
    className="fixed top-0 left-0 w-full p-10 flex justify-between items-center z-50 pointer-events-none font-sans"
  >
    <div className="flex flex-col border-l border-white/10 pl-5">
      <span className="text-[11px] font-thin tracking-[0.7em] text-white/90 uppercase leading-none">
        L-CODE // DYNAMICS
      </span>
    </div>

    <div className="flex items-center gap-10">
      <div 
        onClick={onToggleFullScreen}
        className="pointer-events-auto cursor-pointer group flex items-center gap-2"
      >
        <span className="text-[9px] font-thin uppercase tracking-[0.4em] text-white/30 group-hover:text-white transition-colors">
          [ {isFullScreen ? 'Exit' : 'Full Screen'} ]
        </span>
      </div>

      <div 
        onClick={onToggleArchitect} 
        className="pointer-events-auto cursor-pointer flex items-center gap-4 group"
      >
        <span className="text-[9px] font-thin tracking-[0.4em] text-white/40 uppercase group-hover:text-white transition-all">
          {isArchitectMode ? 'Architect' : 'Sovereign'}
        </span>
        <div className={`w-2 h-2 rounded-full transition-all duration-700 ${
          isArchitectMode ? 'bg-white shadow-[0_0_15px_white]' : 'bg-white/10'
        }`} />
      </div>
    </div>
  </motion.header>
);
