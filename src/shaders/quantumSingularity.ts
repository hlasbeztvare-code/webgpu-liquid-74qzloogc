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
  uniform float uRiveActivity;
  uniform vec2 uVelocity;
  uniform sampler2D uText;
  varying vec2 vUv;

  mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float map(vec3 p) {
    vec3 q = p;
    
    // Dynamic text deformation (bending by velocity)
    vec2 texUv = vUv;
    float bend = length(uVelocity);
    texUv += (vUv - 0.5) * bend * 0.4;
    texUv += uVelocity * (1.0 - vUv.y) * 0.15;
    
    float textDepth = texture2D(uText, texUv).r;
    
    // Real 3D letter thickness (extrusion)
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

    // Rive activity vibration
    obj += sin(p.x * 40.0 + uTime * 30.0) * 0.01 * uRiveActivity;
    
    // Detonation protocol (atomization)
    if (uDetonate > 0.001) {
      float force = uDetonate * 5.0;
      obj += sin(pN.x * 20.0 + uTime * 10.0) * force;
      obj += cos(pN.y * 15.0 - uTime * 8.0) * force;
      obj *= 1.0 + uDetonate * 2.0;
    }
    
    // Startup scale animation
    float scale = smoothstep(0.0, 1.0, uStartup);
    obj /= max(scale, 0.001);
    
    return min(obj, textSdf) * 0.75;
  }

  // Optimized normals: 4 samples instead of 6
  vec3 getNormal(vec3 p) {
    float d = map(p);
    vec2 e = vec2(0.01, 0.0);
    return normalize(vec3(
      d - map(p-e.xyy),
      d - map(p-e.yxy),
      d - map(p-e.yyx)
    ));
  }

  // Variable raymarching: allows fewer steps for secondary samples
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
      texUv += n.xy * 0.04; // Text refraction through mercury

      vec3 viewDir = normalize(ro - p);
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

    // Text blending (exclusion / difference)
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
    // 1. Master Scale: 0.22 pro mobil (poloviční velikost), 1.0 pro desktop
    float masterScale = (uResolution.y > uResolution.x) ? 0.22 : 1.0;
    
    // 2. Centrování a Aspect Ratio Fix
    // Musíme použít přesný střed (0.5) a přepočítat UV podle šířky/výšky
    vec2 uv = vUv - 0.5;
    float aspect = uResolution.x / uResolution.y;
    
    // Tohle zajistí, že nápis nebude natažený nahoru
    uv.x *= aspect; 
    
    // Aplikujeme měřítko
    uv /= masterScale; 
    
    // Vrátíme zpět do rozsahu renderu
    vec3 col = render(uv, (uResolution.y > uResolution.x ? 28 : 45));
    
    col *= 1.1 - length(vUv - 0.5) * 1.2; 
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
    uRiveActivity: { value: 0 },
  };
}
