import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { useEffect, useRef } from 'react';
import { velocityBridge } from '@/shared/velocity';

interface SovereignRiveProps {
  isArchitectMode: boolean;
  isDetonating: boolean;
  /** When true, renders as full-screen overlay with blend mode */
  fullScreen?: boolean;
}

export const SovereignRive = ({ isArchitectMode, isDetonating, fullScreen = false }: SovereignRiveProps) => {
  const { rive, RiveComponent } = useRive({
    src: '/sovereign.riv',
    stateMachines: 'Sovereign_Core',
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.TopLeft }),
    autoplay: true,
  });

  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  // Track mouse position for Rive inputs
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    if (!rive) return;

    const inputs = rive.stateMachineInputs('Sovereign_Core');
    const isArch   = inputs?.find(i => i.name === 'is_architect_mode');
    const uVel     = inputs?.find(i => i.name === 'uVelocity');
    const uT       = inputs?.find(i => i.name === 'uTime');
    const detonate = inputs?.find(i => i.name === 'DETONATE');
    const mouseX   = inputs?.find(i => i.name === 'mouse_x');
    const mouseY   = inputs?.find(i => i.name === 'mouse_y');

    // Architect mode
    if (isArch) isArch.value = isArchitectMode;

    // Live velocity + time + mouse — reads from velocityBridge (set by LiquidBackground)
    const tick = () => {
      const t = performance.now() / 1000;
      if (uT) uT.value = t;
      if (uVel) uVel.value = velocityBridge.velocity * 150;
      if (mouseX) mouseX.value = mouseRef.current.x;
      if (mouseY) mouseY.value = mouseRef.current.y;

      // BYPASS: Posíláme Rive aktivitu do shaderu (LiquidBackground)
      // Když se hýbe Rive, shader musí vibrovat
      velocityBridge.riveActivity = Math.sin(t * 2) * 0.5 + 0.5;

      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    // Expose detonate for App.tsx
    (window as any).riveDetonate = () => detonate?.fire();

    return () => {
      cancelAnimationFrame(frameRef.current);
      delete (window as any).riveDetonate;
    };
  }, [rive]);

  // Sync architect mode on every change
  useEffect(() => {
    if (!rive) return;
    const inputs = rive.stateMachineInputs('Sovereign_Core');
    const isArch = inputs?.find(i => i.name === 'is_architect_mode');
    if (isArch) isArch.value = isArchitectMode;
  }, [isArchitectMode, rive]);

  // Sync detonate
  useEffect(() => {
    if (isDetonating) (window as any).riveDetonate?.();
  }, [isDetonating]);

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ mixBlendMode: 'exclusion' }}
      >
        <RiveComponent className="w-full h-full" />
      </div>
    );
  }

  return <RiveComponent className="w-full h-full" />;
};
