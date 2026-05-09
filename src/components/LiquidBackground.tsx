import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { vertexShader, fragmentShader } from '@/shaders/quantumSingularity';
import { velocityBridge } from '@/shared/velocity';

interface ShaderMeshProps {
  isArchitectMode: boolean;
}

const ShaderMesh = ({ isArchitectMode }: ShaderMeshProps) => {
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
    uDetonate: { value: 0 },
    uRiveActivity: { value: 0 }
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
      // Export velocity magnitude via bridge
      velocityBridge.velocity = velocity.current.length();

      mousePos.current.lerp(currentMouse, 0.02);
      m.uniforms.uMouse.value.copy(mousePos.current);
      m.uniforms.uResolution.value.set(size.width, size.height);
      m.uniforms.uInversion.value = THREE.MathUtils.lerp(m.uniforms.uInversion.value, isArchitectMode ? 1.0 : 0.0, 0.04);
      m.uniforms.uDetonate.value = THREE.MathUtils.lerp(m.uniforms.uDetonate.value, velocityBridge.isDetonating ? 1.0 : 0.0, 0.08);
      m.uniforms.uRiveActivity.value = velocityBridge.riveActivity;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial 
        fragmentShader={fragmentShader} 
        vertexShader={vertexShader} 
        uniforms={uniforms} 
        transparent
      />
    </mesh>
  );
};

interface LiquidBackgroundProps {
  isArchitectMode: boolean;
}

export const LiquidBackground = ({ isArchitectMode }: LiquidBackgroundProps) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 2 }}
    className="fixed inset-0"
  >
    <Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
      <ShaderMesh isArchitectMode={isArchitectMode} />
    </Canvas>
  </motion.div>
);
