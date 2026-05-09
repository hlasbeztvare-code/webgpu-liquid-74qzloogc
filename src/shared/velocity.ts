/**
 * Velocity Bridge
 * 
 * Module-level state for sharing velocity data between the R3F render loop
 * and other components without polluting window globals.
 * 
 * Both the shader's useFrame and the SovereignMark read from here.
 * Only LiquidBackground writes to it.
 */

/** Current mouse velocity magnitude (0..~1) */
let _velocity = 0;

/** Activity feedback from Rive back to shader */
let _riveActivity = 0;

/** Whether detonation protocol is active */
let _isDetonating = false;

export const velocityBridge = {
  get velocity() { return _velocity; },
  set velocity(v: number) { _velocity = v; },

  get riveActivity() { return _riveActivity; },
  set riveActivity(v: number) { _riveActivity = v; },

  get isDetonating() { return _isDetonating; },
  set isDetonating(v: boolean) { _isDetonating = v; },
} as const;
