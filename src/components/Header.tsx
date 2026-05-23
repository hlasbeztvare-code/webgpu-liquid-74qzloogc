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
    className="fixed top-0 left-0 w-full p-10 flex justify-between items-center z-50 select-none"
  >
    {/* Brand block s integrovaným logem ElevenLabs */}
    <div className="flex items-center gap-6 opacity-40 hover:opacity-80 transition-opacity duration-300">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.5em] text-[#C5A27D]">L-CODE // DYNAMICS</span>
        <span className="text-[7px] tracking-[0.25em] text-white/40 uppercase">Sovereign Architecture</span>
      </div>

      {/* Vertikální dělící linka */}
      <div className="h-4 w-[1px] bg-white/10" />

      {/* ElevenLabs SVG logo */}
      <div className="flex items-center gap-2 text-white/50">
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 11.5h2v1H4zm3-3h2v7H7zm3-3h2v13h-2zm3 3h2v7h-2zm3 3h2v1h-2z" />
        </svg>
        <span className="text-[8px] tracking-[0.4em] uppercase text-white/40 font-light">
          ElevenLabs
        </span>
      </div>
    </div>

    {/* Ovládací prvky na pravé straně */}
    <div className="flex items-center gap-10">
      <div
        onClick={onToggleFullScreen}
        className="cursor-pointer group flex items-center gap-2"
      >
        <span className="text-[9px] font-thin uppercase tracking-[0.4em] text-white/30 group-hover:text-white transition-colors">
          [ {isFullScreen ? 'Exit' : 'Full Screen'} ]
        </span>
      </div>

      <div
        onClick={onToggleArchitect}
        className="cursor-pointer group flex items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">
          Architect
        </span>
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
          isArchitectMode ? 'bg-[#C5A27D] shadow-[0_0_12px_#C5A27D]' : 'bg-white/20'
        }`} />
      </div>
    </div>
  </motion.header>
);