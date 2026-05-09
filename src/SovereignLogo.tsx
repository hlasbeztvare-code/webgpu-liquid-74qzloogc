const SovereignLogo = ({ className = '', isArchitectMode = false }) => {
  const goldColor = "#C5A27D";
  const platinumColor = "#FFFFFF";
  return (
    <svg viewBox="0 0 500 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-colors duration-1000 ${className}`}>
      <defs>
        <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D9E2EC" /><stop offset="50%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#9FB3C8" />
        </linearGradient>
      </defs>
      <g className="transition-transform duration-1000 origin-center" style={{ transform: isArchitectMode ? 'rotate(45deg) scale(0.8)' : 'rotate(0deg) scale(1)' }}>
        <path d="M60 40C40 60 50 90 70 100C90 110 120 100 130 80C140 60 130 30 110 20C90 10 80 20 60 40Z" fill={isArchitectMode ? platinumColor : goldColor} opacity={isArchitectMode ? 0.2 : 1} />
        <path d="M85 10L110 40L135 70L110 100L85 70L60 40L85 10Z" stroke={isArchitectMode ? "url(#crystalGradient)" : goldColor} strokeWidth="3" fill={isArchitectMode ? platinumColor : "none"} opacity={isArchitectMode ? 1 : 0.6} />
      </g>
      <text x="160" y="95" fontFamily="monospace" fontSize="90" fontWeight="900" fill={isArchitectMode ? platinumColor : goldColor}>Lucky</text>
      <text x="160" y="125" fontFamily="monospace" fontSize="16" letterSpacing="0.5em" fill={isArchitectMode ? platinumColor : goldColor} opacity="0.5">SOVEREIGN</text>
    </svg>
  );
};
export default SovereignLogo;
