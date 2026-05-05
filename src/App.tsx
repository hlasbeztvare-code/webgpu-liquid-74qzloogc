import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import SovereignLogo from './SovereignLogo';

const QuantumSingularityShader = {
  uniforms: { 
    uTime: { value: 0 }, 
    uMouse: { value: new THREE.Vector2(0.5, 0.5) }, 
    uResolution: { value: new THREE.Vector2(0, 0) }, 
    uInversion: { value: 0 },
    uText: { value: null },
    uStartup: { value: 0 },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uDetonate: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform float uInversion;
    uniform float uStartup;
    uniform float uDetonate;
    uniform vec2 uVelocity;
    uniform sampler2D uText;
    varying vec2 vUv;

    mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float map(vec3 p) {
        vec3 q = p;
        
        // DYNAMICKÁ DEFORMACE TEXTU (Ohýbání podle rychlosti)
        vec2 texUv = vUv;
        float bend = length(uVelocity);
        texUv += (vUv - 0.5) * bend * 0.4;
        texUv += uVelocity * (1.0 - vUv.y) * 0.15;
        
        float textDepth = texture2D(uText, texUv).r;
        
        // REÁLNÁ 3D TLOUŠŤKA PÍSMEN (Extrusion)
        float thickness = 0.15;
        float textSdf = mix(100.0, abs(p.z - 0.3) - thickness, step(0.1, textDepth));
        
        float mDist = length(uMouse - 0.5);
        q.xy *= rot(uTime * 0.2 + mDist);
        q.xz *= rot(uTime * 0.1);
        
        vec2 m = (uMouse * 2.0 - 1.0) * vec2(uResolution.x/uResolution.y, 1.0);
        
        float noise = 0.0;
        float amp = 0.5;
        float freq = 1.8;
        vec3 pN = q;
        for(int i = 0; i < 4; i++) {
            noise += abs(sin(pN.x*freq + uTime*0.5)*cos(pN.y*freq)*sin(pN.z*freq)) * amp;
            pN *= 2.1;
            amp *= 0.48;
        }
        
        float liquid = length(q) - 1.6 + (noise * 0.4) + sin(length(p.xy - m) * 5.0 - uTime) * 0.15;
        float cry = (abs(q.x) + abs(q.y) + abs(q.z)) * 0.7 - 1.2 + (sin(q.x * 12.0 + uTime) * 0.04);
        
        float obj = mix(liquid, cry, uInversion);
        
        // DETONATION PROTOCOL (Atomization)
        if (uDetonate > 0.001) {
            float force = uDetonate * 5.0;
            obj += sin(pN.x * 20.0 + uTime * 10.0) * force;
            obj += cos(pN.y * 15.0 - uTime * 8.0) * force;
            obj *= 1.0 + uDetonate * 2.0;
        }
        
        // STARTUP SCALE ANIMATION
        float scale = smoothstep(0.0, 1.0, uStartup);
        obj /= max(scale, 0.001); // Expand from center
        
        return min(obj, textSdf) * 0.75;
    }

    // OPTIMALIZOVANÝ NORMAL: Pouze 4 samply místo 6
    vec3 getNormal(vec3 p) {
        float d = map(p);
        vec2 e = vec2(0.01, 0.0);
        return normalize(vec3(
            d - map(p-e.xyy),
            d - map(p-e.yxy),
            d - map(p-e.yyx)
        ));
    }

    // VARIABILNÍ RAYMARCHING: Umožňuje méně kroků pro sekundární samply
    vec3 render(vec2 uv, int steps) {
        vec3 ro = vec3(0.0, 0.0, 3.5);
        vec3 rd = normalize(vec3(uv, -1.2));
        
        float t = 0.0;
        float glow = 0.0;
        vec3 p;
        for(int i = 0; i < 40; i++) {
            if(i >= steps) break; 
            p = ro + rd * t;
            float d = map(p);
            
            float auraPulse = sin(uTime * 2.0) * 0.1 + 1.0;
            float mouseActivity = length(uVelocity) * 20.0;
            glow += (0.012 + mouseActivity * 0.005) * auraPulse / (abs(d) + 0.05);
            
            if(d < 0.002 || t > 8.0) break;
            t += d;
        }
        
        vec3 col = vec3(0.0);
        vec2 texUv = vUv;

        if (t >= 8.0) {
            col = vec3(0.1, 0.15, 0.2) * glow * 0.5;
        }
        
        if(t < 8.0) {
            vec3 n = getNormal(p);
            texUv += n.xy * 0.04; // Refrakce textu přes rtuť
\n            vec3 viewDir = normalize(ro - p);
            vec3 lightDir = normalize(vec3(3,5,2));
            float diff = max(dot(n, lightDir), 0.0);
            float spec = pow(max(dot(viewDir, reflect(-lightDir, n)), 0.0), 32.0);
            float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 5.0);
            
            vec3 iri = 0.5 + 0.5 * cos(uTime + fres * 4.0 + vec3(0,2,4));
            vec3 base = mix(vec3(0.0), vec3(1.0), uInversion);
            
            col = base * (diff * 0.7) + spec * 1.5 + iri * fres * 0.8;
            col += vec3(0.1, 0.2, 0.4) * glow * 0.3; 
            col += pow(spec, 15.0) * 3.0;
        }

        // TEXT BLENDING (Exclusion / Difference)
        float textMask = texture2D(uText, texUv).r;
        if (textMask > 0.1) {
            vec3 textCol = vec3(textMask);
            col = abs(textCol - col);
            float edge = fwidth(textMask);
            col += smoothstep(0.4 - edge, 0.5 + edge, textMask) * 0.3;
        }
        
        return col;
    }

    void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= uResolution.x / uResolution.y;
        vec3 col = render(uv, 45);
        col *= 1.1 - length(vUv - 0.5) * 1.2; 
        col = col / (col + vec3(1.0));
        col = pow(col, vec3(0.4545));
        gl_FragColor = vec4(col, 1.0);
    }
  `
};

const Sparkline = ({ data }: { data: number[] }) => {
  if (data.length < 2) return <div className="w-16 h-4" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${16 - ((v - min) / range) * 16}`).join(' ');
  
  return (
    <svg className="w-16 h-4 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 60 16">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

const LiquidBackground = ({ isArchitectMode }: { isArchitectMode: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));
  const lastMousePos = useRef(new THREE.Vector2(0.5, 0.5));
  const velocity = useRef(new THREE.Vector2(0, 0));
  const { size } = useThree();

  const textTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 280px "JetBrains Mono", monospace';
    ctx.fillText('SOVEREIGN', canvas.width / 2, canvas.height / 2 - 140);
    ctx.font = '900 280px "JetBrains Mono", monospace';
    ctx.fillText('ARCHITECT', canvas.width / 2, canvas.height / 2 + 140);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, []);

  const uniforms = useMemo(() => ({ 
    uTime: { value: 0 }, 
    uMouse: { value: new THREE.Vector2(0.5, 0.5) }, 
    uResolution: { value: new THREE.Vector2(size.width, size.height) }, 
    uInversion: { value: 0 },
    uText: { value: textTexture },
    uStartup: { value: 0 },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uDetonate: { value: 0 }
  }), [textTexture]);

  useFrame((state) => {
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.ShaderMaterial;
      const t = state.clock.getElapsedTime();
      m.uniforms.uTime.value = t;
      
      // STARTUP ANIMATION (0 to 1 in 2 seconds)
      m.uniforms.uStartup.value = THREE.MathUtils.clamp(t / 2.0, 0, 1);
      
      // VELOCITY CALCULATION
      const currentMouse = new THREE.Vector2((state.mouse.x + 1) / 2, (state.mouse.y + 1) / 2);
      velocity.current.lerp(currentMouse.clone().sub(lastMousePos.current), 0.1);
      lastMousePos.current.copy(currentMouse);
      m.uniforms.uVelocity.value.copy(velocity.current);

      mousePos.current.lerp(currentMouse, 0.02);
      m.uniforms.uMouse.value.copy(mousePos.current);
      m.uniforms.uResolution.value.set(size.width, size.height);
      m.uniforms.uInversion.value = THREE.MathUtils.lerp(m.uniforms.uInversion.value, isArchitectMode ? 1.0 : 0.0, 0.04);
      m.uniforms.uDetonate.value = THREE.MathUtils.lerp(m.uniforms.uDetonate.value, (window as any).isDetonating ? 1.0 : 0.0, 0.08);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial 
        fragmentShader={QuantumSingularityShader.fragmentShader} 
        vertexShader={QuantumSingularityShader.vertexShader} 
        uniforms={uniforms} 
        transparent
      />
    </mesh>
  );
};

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [steps, setSteps] = useState<string[]>([]);
  const allSteps = [
    'CORE // VANGUARD KERNEL 8.4.1',
    'NET // ESTABLISHING P2P_TUNNEL...',
    'NET // CONNECTING TO COINGECKO_FEED...',
    'MEM // ALLOCATING QUANTUM_SINGULARITY...',
    'SDR // COMPILING SHADER_CORE...',
    'ENC // ENCRYPTING PEER_STREAMS...',
    'AUTH // SOVEREIGN_IDENTITY: VERIFIED',
    'SYSTEM // READY'
  ];

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < allSteps.length) {
        setSteps(prev => [...prev, allSteps[current]]);
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

export default function App() {
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem('sovereign_initialized');
  });
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [prices, setPrices] = useState({ sol: 0, eth: 0 });
  const [history, setHistory] = useState<{ sol: number[], eth: number[] }>({ sol: [], eth: [] });
  const [lastUpdate, setLastUpdate] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDetonating, setIsDetonating] = useState(false);
  const [showContact, setShowContact] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<any>(null);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const detonate = () => {
    setIsDetonating(true);
    (window as any).isDetonating = true;
    playSound(100); 
    
    setTimeout(() => {
      setShowContact(true);
      (window as any).isDetonating = false;
      setIsDetonating(false);
    }, 4500);
  };

  const reboot = () => {
    setShowContact(false);
    localStorage.removeItem('sovereign_initialized');
    window.location.reload();
  };

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum&vs_currencies=usd');
        const data = await res.json();
        setPrices({
          sol: data.solana.usd,
          eth: data.ethereum.usd
        });
        setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        setPrices({ sol: 154.22, eth: 3421.50 });
      }
    };

    fetchPrices();
    const fetchInterval = setInterval(fetchPrices, 60000);
    
    const microInterval = setInterval(() => {
      setPrices(prev => {
        const newSol = prev.sol + (Math.random() - 0.5) * 0.05;
        const newEth = prev.eth + (Math.random() - 0.5) * 0.2;
        
        setHistory(h => ({
          sol: [...h.sol.slice(-20), newSol],
          eth: [...h.eth.slice(-20), newEth]
        }));
        
        return { sol: newSol, eth: newEth };
      });
    }, 2500);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(microInterval);
    };
  }, []);

  useEffect(() => {
    if (isLoading || showContact || isDetonating) return;

    let idleTime = 0;
    const idleLimit = 60;

    const resetTimer = () => {
      idleTime = 0;
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));

    const checkInterval = setInterval(() => {
      idleTime++;
      if (idleTime >= idleLimit) {
        detonate();
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
      clearInterval(checkInterval);
    };
  }, [isLoading, showContact, isDetonating]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    
    if (!ambientRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc1.type = 'sine'; osc1.frequency.value = 40;
      osc2.type = 'sine'; osc2.frequency.value = 40.5;
      filter.type = 'lowpass'; filter.frequency.value = 200;
      g.gain.value = 0;

      osc1.connect(filter); osc2.connect(filter); filter.connect(g); g.connect(ctx.destination);
      osc1.start(); osc2.start();
      g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3);
      ambientRef.current = { g, filter };
    }
  };

  const playSound = (on: boolean) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current!;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.connect(filter); filter.connect(g); g.connect(ctx.destination);
      
      osc.type = on ? 'sawtooth' : 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(on ? 2000 : 500, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.2);

      osc.frequency.setValueAtTime(on ? 150 : 80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(on ? 60 : 160, ctx.currentTime + 1.2);
      
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      
      osc.start(); osc.stop(ctx.currentTime + 1.2);

      if (ambientRef.current) {
        ambientRef.current.filter.frequency.exponentialRampToValueAtTime(on ? 600 : 200, ctx.currentTime + 1);
        ambientRef.current.g.gain.linearRampToValueAtTime(on ? 0.12 : 0.08, ctx.currentTime + 1);
      }
    } catch(e) {}
  };

  const toggle = () => {
    const next = !isArchitectMode;
    playSound(next);
    setIsArchitectMode(next);
  };


  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-[#C5A27D]">
      <AnimatePresence>
        {isLoading && (
          <Preloader onComplete={() => {
            setIsLoading(false);
            localStorage.setItem('sovereign_initialized', 'true');
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContact && (
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
              <a href="mailto:hlancaric@gmail.com" className="text-xl md:text-2xl tracking-[0.4em] text-white/40 hover:text-[#C5A27D] transition-colors duration-500">
                hlancaric@gmail.com
              </a>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4 }}
              onClick={reboot}
              className="absolute bottom-20 cursor-pointer group"
            >
              <span className="text-[10px] uppercase tracking-[0.5em] text-white/20 group-hover:text-white transition-colors">
                [ Reboot System ]
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && !showContact && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="fixed inset-0"
          >
            <Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
              <LiquidBackground isArchitectMode={isArchitectMode} />
            </Canvas>
          </motion.div>

          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="fixed top-0 left-0 w-full p-10 flex justify-between items-center z-50"
          >
            <SovereignLogo className="w-40 h-auto opacity-80 hover:opacity-100 transition-opacity" isArchitectMode={isArchitectMode} />
            
            <div className="flex items-center gap-10">
              <div 
                onClick={toggleFullScreen}
                className="cursor-pointer group flex items-center gap-2"
              >
                <span className="text-[9px] uppercase tracking-[0.4em] text-white/30 group-hover:text-white transition-colors">
                  [ {isFullScreen ? 'Exit' : 'Full Screen'} ]
                </span>
              </div>

              <div 
                onClick={toggle} 
                className="cursor-pointer group flex items-center gap-3"
              >
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">Architect</span>
                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isArchitectMode ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/20'}`} />
              </div>
            </div>
          </motion.header>

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
          onClick={detonate}
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
    </>
  )}
</div>
  );
}
