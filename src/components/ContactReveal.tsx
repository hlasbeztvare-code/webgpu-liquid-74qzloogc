import { motion } from 'framer-motion';

interface ContactRevealProps {
  onReboot: () => void;
}

export const ContactReveal = ({ onReboot }: ContactRevealProps) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 2 }}
    className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 select-none"
  >
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <h1 className="text-4xl md:text-6xl font-black tracking-[0.2em] text-white">JAN LANČARIČ</h1>
      <a href="mailto:hlancaric@gmail.com" className="text-xl md:text-2xl tracking-[0.4em] text-white/40 hover:text-white transition-colors duration-500">
        hlancaric@gmail.com
      </a>
    </motion.div>
    
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 4 }}
      onClick={onReboot}
      className="absolute bottom-20 cursor-pointer group"
    >
      <span className="text-[10px] uppercase tracking-[0.5em] text-white/20 group-hover:text-white transition-colors">
        [ Reboot System ]
      </span>
    </motion.div>
  </motion.div>
);
