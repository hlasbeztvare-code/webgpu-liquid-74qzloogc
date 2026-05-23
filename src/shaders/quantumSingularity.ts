import * as THREE from 'three';

/**
 * Quantum Singularity Shader
 * 
 * Raymarched liquid/crystal hybrid with:
 * - Velocity-based deformation
 * - Text extrusion (SOVEREIGN ARCHITECT)
 * - Iridescent Fresnel reflections
 * - Architect mode inversion (liquid ↔ crystal)
 * - Detonation atomization protocol
 */

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uInversion;
  uniform float uStartup;
  uniform float uDetonate;
  uniform float uArchitectMode; 
  uniform float uRiveActivity; // Restored for UI vibration
  uniform vec2 uVelocity;
  uniform sampler2D uText;
  varying vec2 vUv;

  // Global variable for text depth to avoid up to 44 texture fetches per fragment
  float gTextDepth;

  mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float map(vec3 p) {
    vec3 q = p;
    
    // Real 3D letter thickness (extrusion) using precomputed gTextDepth
    float thickness = 0.15;
    float textSdf = mix(100.0, abs(p.z - 0.3) - thickness, step(0.1, gTextDepth));
    
    float mDist = length(uMouse - 0.5);
    q.xy *= rot(uTime * 0.2 + mDist);
    q.xz *= rot(uTime * 0.1);
    
    vec2 m = (uMouse * 2.0 - 1.0) * vec2(uResolution.x/uResolution.y, 1.0);
    
    float noise = 0.0;
    float amp = 0.5;
    float freq = 1.8;
    vec3 pN = q;
    for(int i = 0; i < 3; i++) {
      noise += abs(sin(pN.x*freq + uTime*0.5)*cos(pN.y*freq)*sin(pN.z*freq)) * amp;
      pN *= 2.1;
      amp *= 0.48;
    }
    // Scale pN one more time for detonation consistency with original 4-octave version
    vec3 pNDet = pN * 2.1;
    
    float ripple = sin(length(p.xy - m) * 5.0 - uTime) * 0.15;
    float vibrate = sin(uTime * 60.0) * uRiveActivity * 0.03;
    float liquid = length(q) - 1.6 + (noise * 0.4) + ripple + vibrate;
    float cry = (abs(q.x) + abs(q.y) + abs(q.z)) * 0.7 - 1.2 + (sin(q.x * 12.0 + uTime) * 0.04) + vibrate;
    
    float obj = mix(liquid, cry, uInversion);
    
    // Detonation protocol (atomization)
    if (uDetonate > 0.001) {
      float force = uDetonate * 5.0;
      obj += sin(pNDet.x * 20.0 + uTime * 10.0) * force;
      obj += cos(pNDet.y * 15.0 - uTime * 8.0) * force;
      obj *= 1.0 + uDetonate * 2.0;
    }
    
    // Startup scale animation
    float scale = smoothstep(0.0, 1.0, uStartup);
    obj /= max(scale, 0.001);
    
    return min(obj, textSdf) * 0.75;
  }

  // Optimized normals: 3 samples instead of 6
  vec3 getNormal(vec3 p) {
    float d = map(p);
    vec2 e = vec2(0.01, 0.0);
    return normalize(vec3(
      d - map(p-e.xyy),
      d - map(p-e.yxy),
      d - map(p-e.yyx)
    ));
  }

  // Variable raymarching: returns vec4(col, mask)
  vec4 render(vec2 uv, int steps) {
    vec3 ro = vec3(0.0, 0.0, 3.5);
    vec3 rd = normalize(vec3(uv, -1.2));
    
    float t = 0.0;
    float glow = 0.0;
    vec3 p;
    float mask = 0.0;
    
    for(int i = 0; i < 30; i++) {
      if(i >= steps) break; 
      p = ro + rd * t;
      float d = map(p);
      
      float auraPulse = sin(uTime * 2.0) * 0.1 + 1.0;
      float mouseActivity = length(uVelocity) * 25.0;
      // Volume glow accumulation
      glow += (0.012 + mouseActivity * 0.01) * auraPulse / (abs(d) + 0.035);
      
      if(d < 0.0015 || t > 8.0) break;
      t += d;
    }
    
    vec3 col = vec3(0.0);
    vec2 texUv = vUv;

    // Background depth
    if (t >= 8.0) {
      col = vec3(0.01, 0.02, 0.08) * glow * 0.3;
    }
    
    if(t < 8.0) {
      mask = 1.0;
      vec3 n = getNormal(p);
      texUv += n.xy * 0.045; 

      vec3 viewDir = normalize(ro - p);
      vec3 lightDir = normalize(vec3(5, 10, 5));
      float diff = max(dot(n, lightDir), 0.0);
      float spec = pow(max(dot(viewDir, reflect(-lightDir, n)), 0.0), 64.0);
      float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 4.0);
      
      vec3 iri = 0.5 + 0.5 * cos(uTime + fres * 3.0 + vec3(0, 2, 4));
      
      // MERCURY: Absolute clear/crisp (Zero base, high spec/fres)
      // ARCHITECT: Core blue
      vec3 base = mix(vec3(0.0), vec3(0.3, 0.7, 1.0), uInversion);
      
      // Metallic reflection logic
      vec3 reflectDir = reflect(-viewDir, n);
      float shiny = pow(max(0.0, dot(reflectDir, vec3(0,1,0))), 8.0) * 2.0;
      
      col = base * (diff * 0.4) + spec * 5.0 + iri * fres * 3.0 + shiny;
      
      // Additive Cyan Bloom (Architect Mode Only)
      vec3 cyanBloom = vec3(0.0, 0.9, 1.0) * glow * 0.6 * uArchitectMode;
      col += cyanBloom; 
      col += pow(spec, 16.0) * 12.0;
    }

    // Text blending with high-intensity depth
    float textMask = texture2D(uText, texUv).r;
    if (textMask > 0.01) {
      vec3 textCol = vec3(textMask);
      col = mix(col, abs(textCol - col), 0.99);
      float edge = fwidth(textMask);
      col += smoothstep(0.4 - edge, 0.5 + edge, textMask) * 0.8;
    }
    
    return vec4(col, mask);
  }

  void main() {
    bool isMobile = uResolution.y > uResolution.x;
    vec2 uv = vUv * 2.0 - 1.0;
    float aspect = uResolution.x / uResolution.y;
    
    if (isMobile) {
        // BEFEL: Entita +20% (Škálování 2.5), Text snížen o 30% (0.7)
        uv.x *= aspect;
        uv *= 2.5; 
        uv.y *= 0.7; 
    } else {
        uv.x *= aspect;
    }

    // Precompute text depth once per fragment to save GPU load
    vec2 texUv = vUv;
    float bend = length(uVelocity);
    texUv += (vUv - 0.5) * bend * 0.4;
    texUv += uVelocity * (1.0 - vUv.y) * 0.15;
    gTextDepth = texture2D(uText, texUv).r;

    // ARCHITEKT RENDER (capped to 30 steps)
    vec4 result = render(uv, 30); 
    vec3 col = result.rgb;
    float mask = result.a;
    
    // VNITŘNÍ ZÁŘE: Agresivní luminiscence vázaná na masku objektu
    float innerGlow = 0.0;
    if (isMobile) {
        // Mobile internal glow focused on the core
        innerGlow = 0.5 / (0.1 + length(uv) * 2.0);
        innerGlow *= mask; // Masking to keep it "internal"
    } else {
        innerGlow = 0.1 / (0.02 + length(uv) * 0.5);
    }
    
    vec3 glowCol = vec3(0.0, 0.8, 1.0) * innerGlow;
    col += glowCol * uArchitectMode; 

    // Maximální hloubka: Černo-modrá propast
    float vig = length(vUv - 0.5);
    vec3 vigCol = vec4(vec3(0.0, 0.005, 0.02) * (1.0 - uArchitectMode), 1.0).rgb;
    col = mix(col, vigCol, smoothstep(0.1, 1.1, vig) * 0.98);

    // Tonemapping
    col = col / (col + vec3(1.0));
    col = pow(col, vec3(0.4545));
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Creates a fresh set of typed uniforms for the shader material */
export function createUniforms(textTexture: THREE.Texture, width: number, height: number) {
  return {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(width, height) },
    uInversion: { value: 0 },
    uText: { value: textTexture },
    uStartup: { value: 0 },
    uVelocity: { value: new THREE.Vector2(0, 0) },
    uDetonate: { value: 0 },
    uArchitectMode: { value: 0 },
    uRiveActivity: { value: 0 },
  };
}
