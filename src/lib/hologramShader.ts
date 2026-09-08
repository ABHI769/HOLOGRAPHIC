import * as THREE from 'three';

export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDepth;
  varying float vModelY;

  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform float uDepthIntensity;
  uniform float uDepthInvert;
  uniform float uTime;
  uniform float uDistortion;
  uniform float uAnimationSpeed;
  uniform float uCurveIntensity;
  uniform float uLaserScan;
  uniform float uLaserScanPos;

  float sampleDepth(vec2 uvCoord) {
    vec4 dCol = texture2D(uDepthMap, uvCoord);
    float d = dot(dCol.rgb, vec3(0.299, 0.587, 0.114));
    if (uDepthInvert > 0.5) {
      d = 1.0 - d;
    }
    return d;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    vModelY = pos.y;

    // Sample depth from depth texture
    float d = sampleDepth(uv);
    vec4 texColor = texture2D(uTexture, uv);
    
    // Extrude vertices along Z axis based on depth map
    float activeDepth = (d - 0.5) * uDepthIntensity * 0.65 * step(0.02, texColor.a);
    pos.z += activeDepth;

    // Curved Holographic Screen (Cylindrical warp like Stark command table)
    if (uCurveIntensity > 0.001) {
      float curveX = (uv.x - 0.5);
      pos.z -= curveX * curveX * uCurveIntensity * 0.8;
    }

    vDepth = d;

    // Subtle holographic wave
    float wave = sin(pos.x * 8.0 + uTime * 2.0 * uAnimationSpeed) * 0.02;
    wave += sin(pos.y * 6.0 - uTime * 1.5 * uAnimationSpeed) * 0.015;
    pos.z += wave * uDistortion;

    // Dynamically compute surface normals from depth gradients
    float eps = 0.008;
    float dRight = sampleDepth(uv + vec2(eps, 0.0));
    float dUp = sampleDepth(uv + vec2(0.0, eps));
    vec3 tangentX = vec3(eps, 0.0, (dRight - d) * uDepthIntensity * 0.65);
    vec3 tangentY = vec3(0.0, eps, (dUp - d) * uDepthIntensity * 0.65);
    vec3 computedNormal = normalize(cross(tangentX, tangentY));

    // Combine with original normal
    vec3 mixedNormal = normalize(mix(normal, computedNormal, clamp(uDepthIntensity, 0.0, 1.0)));
    vNormal = normalize(normalMatrix * mixedNormal);
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const fragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uGlowIntensity;
  uniform float uScanIntensity;
  uniform float uGridVisibility;
  uniform float uDistortion;
  uniform float uAnimationSpeed;
  uniform int uTint;
  uniform int uBorderStyle;
  uniform vec2 uResolution;
  uniform float uAspect;
  uniform float uDepthIntensity;
  uniform float uLaserScan;
  uniform float uLaserScanPos;
  uniform float uLayerMin;
  uniform float uLayerMax;
  uniform int uIsLayerSlice;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDepth;
  varying float vModelY;

  vec3 getTint() {
    if (uTint == 0) return vec3(0.0, 1.0, 1.0); // Cyan (J.A.R.V.I.S.)
    if (uTint == 1) return vec3(0.2, 0.65, 1.0); // Arc Blue
    if (uTint == 2) return vec3(0.78, 0.4, 1.0); // Stealth Purple
    if (uTint == 3) return vec3(0.2, 1.0, 0.4); // Vibranium Green
    if (uTint == 4) return vec3(1.0, 0.22, 0.2); // Hot Rod Red (Mark IV/VII)
    return vec3(1.0, 0.65, 0.1); // Quantum Amber (Arc Core)
  }

  vec3 getSecondaryTint() {
    if (uTint == 4) return vec3(1.0, 0.85, 0.2); // Gold accent for Hot Rod Red
    if (uTint == 0) return vec3(0.3, 0.9, 1.0); // Bright cyan
    if (uTint == 5) return vec3(1.0, 0.35, 0.05); // Deep orange
    return getTint() * 1.2;
  }

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float scanLines(vec2 uv) {
    float scan = sin(uv.y * 200.0 + uTime * 10.0 * uAnimationSpeed) * 0.5 + 0.5;
    scan = pow(scan, 8.0);
    // moving scan band
    float band = smoothstep(0.48, 0.52, fract(uv.y * 2.0 - uTime * 0.5 * uAnimationSpeed));
    return scan + band * 0.3;
  }

  float lightStreaks(vec2 uv) {
    float streaks = 0.0;
    for (float i = 1.0; i <= 4.0; i += 1.0) {
      float offset = uTime * (0.2 + i * 0.1) * uAnimationSpeed;
      float y = fract(uv.y * i * 3.0 + offset);
      streaks += smoothstep(0.95, 1.0, y) * 0.15 / i;
    }
    return streaks;
  }

  float grid(vec2 uv) {
    vec2 gridUV = uv * 20.0;
    vec2 gridLines = abs(fract(gridUV - 0.5) - 0.5) / fwidth(gridUV);
    float line = min(gridLines.x, gridLines.y);
    float gridMask = 1.0 - min(line, 1.0);
    return gridMask;
  }

  float frame(vec2 uv, int style, float aspect) {
    float frameMask = 0.0;
    float border = 0.015;

    if (style == 1) { // tech
      frameMask += step(0.0, uv.x) * step(uv.x, border);
      frameMask += step(0.0, 1.0 - uv.x) * step(1.0 - uv.x, border);
      frameMask += step(0.0, uv.y) * step(uv.y, border);
      frameMask += step(0.0, 1.0 - uv.y) * step(1.0 - uv.y, border);
    }
    else if (style == 2) { // hex corners
      float corner = 0.08;
      float w = border * 1.5;
      float asp = max(aspect, 0.001);
      if (uv.x < corner && uv.y < corner) {
        float d = length(vec2((uv.x - corner) * asp, uv.y - corner));
        frameMask += 1.0 - smoothstep(corner - w, corner, d);
      }
      if (uv.x > 1.0 - corner && uv.y < corner) {
        float d = length(vec2((uv.x - (1.0 - corner)) * asp, uv.y - corner));
        frameMask += 1.0 - smoothstep(corner - w, corner, d);
      }
      if (uv.x < corner && uv.y > 1.0 - corner) {
        float d = length(vec2((uv.x - corner) * asp, uv.y - (1.0 - corner)));
        frameMask += 1.0 - smoothstep(corner - w, corner, d);
      }
      if (uv.x > 1.0 - corner && uv.y > 1.0 - corner) {
        float d = length(vec2((uv.x - (1.0 - corner)) * asp, uv.y - (1.0 - corner)));
        frameMask += 1.0 - smoothstep(corner - w, corner, d);
      }
    }
    else if (style == 3) { // circular
      vec2 center = uv - 0.5;
      float asp = max(aspect, 0.001);
      center.x *= asp;
      float radius = 0.48;
      float dist = length(center);
      float ring = smoothstep(radius, radius - border, dist) - smoothstep(radius - border * 0.5, radius - border, dist);
      frameMask += ring;
      float insideCircle = step(dist, radius);
      frameMask += (1.0 - smoothstep(0.002, 0.004, abs(center.x))) * 0.4 * insideCircle;
      frameMask += (1.0 - smoothstep(0.002, 0.004, abs(center.y))) * 0.4 * insideCircle;
    }

    return frameMask;
  }

  vec4 sampleHolographic(sampler2D tex, vec2 uv, float aberration) {
    vec4 texR = texture2D(tex, uv + vec2(aberration, 0.0));
    vec4 texG = texture2D(tex, uv);
    vec4 texB = texture2D(tex, uv - vec2(aberration, 0.0));
    return vec4(texR.r, texG.g, texB.b, texG.a);
  }

  void main() {
    // If this is a deconstructed/exploded slice, check depth bounds
    if (uIsLayerSlice == 1) {
      if (vDepth < uLayerMin || vDepth > uLayerMax) {
        discard;
      }
    }

    vec3 tint = getTint();
    vec3 secTint = getSecondaryTint();

    float aberration = 0.003 * uDistortion;
    vec4 texColor = sampleHolographic(uTexture, vUv, aberration);

    // Ghost / duplicate projection offset
    vec2 ghostUv = vUv + vec2(0.01 * sin(uTime * uAnimationSpeed), 0.005 * cos(uTime * 1.3 * uAnimationSpeed)) * uDistortion;
    vec4 ghostColor = sampleHolographic(uTexture, ghostUv, aberration * 0.5);
    float ghost = ghostColor.a * 0.15 * uGlowIntensity;

    // Convert to holographic look
    float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 holoColor = texColor.rgb * 0.55 + tint * brightness * 0.5 + secTint * (1.0 - brightness) * 0.15;
    holoColor += ghostColor.rgb * ghost;

    // Depth contour highlighting for 3D view
    float depthContour = sin(vDepth * 30.0 + uTime * 2.0) * 0.08 * uDepthIntensity;
    holoColor += tint * max(0.0, depthContour);

    // Sweeping Stark Laser Diagnostic Scan Beam
    float laserIntensity = 0.0;
    if (uLaserScan > 0.5) {
      float scanDist = abs(vUv.y - uLaserScanPos);
      laserIntensity = exp(-scanDist * 40.0) * 2.2;
      // High-intensity laser edge
      float sharpLine = smoothstep(0.006, 0.0, scanDist);
      holoColor += vec3(1.0, 1.0, 1.0) * sharpLine * 2.5;
      holoColor += secTint * laserIntensity;
    }

    // Add scan lines
    float scan = scanLines(vUv) * uScanIntensity;
    holoColor += tint * scan * 0.3;

    // Add light streaks
    float streaks = lightStreaks(vUv) * uGlowIntensity;
    holoColor += tint * streaks;

    // Add grid overlay
    float gridMask = grid(vUv) * uGridVisibility * 0.15;
    holoColor += tint * gridMask;

    // Add frame/border
    float frameMask = frame(vUv, uBorderStyle, uAspect);
    holoColor += tint * frameMask * uGlowIntensity;

    // Noise / digital grain
    float noise = rand(vUv * uTime) * 0.04 * uDistortion;
    holoColor += noise;

    // Flicker effect
    float flicker = sin(uTime * 20.0 * uAnimationSpeed) * 0.03 + 0.97;
    flicker *= (sin(uTime * 7.0 * uAnimationSpeed) * 0.05 + 0.95);

    // Occasional glitch bars
    float glitch = step(0.97, rand(vec2(floor(uTime * 5.0 * uAnimationSpeed), 0.0))) * 0.08 * uDistortion;
    holoColor += glitch;

    // 3D Edge glow based on extruded 3D normal vector
    float edgeGlow = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    edgeGlow = pow(edgeGlow, 2.0);
    holoColor += tint * edgeGlow * uGlowIntensity * 0.5;

    // Holographic transparency: darker areas more transparent
    float alpha = texColor.a * uOpacity * flicker;
    alpha = max(alpha, scan * 0.2 * uOpacity);
    alpha = max(alpha, frameMask * uOpacity);
    alpha = max(alpha, edgeGlow * 0.35 * uOpacity);
    alpha = max(alpha, ghost * 0.5);
    alpha = max(alpha, laserIntensity * 0.4);

    // Boost brightness
    holoColor *= (1.0 + uGlowIntensity * 0.3);

    gl_FragColor = vec4(holoColor, alpha);
  }
`;

export function createHologramMaterial(
  texture: THREE.Texture,
  depthTexture: THREE.Texture,
  settings: {
    opacity: number;
    glowIntensity: number;
    scanIntensity: number;
    gridVisibility: number;
    distortion: number;
    animationSpeed: number;
    borderStyle: string;
    tint: number;
    aspect?: number;
    depthIntensity?: number;
    depthInvert?: boolean;
    wireframe?: boolean;
    curveIntensity?: number;
    laserScan?: boolean;
    layerMin?: number;
    layerMax?: number;
    isLayerSlice?: boolean;
  }
): THREE.ShaderMaterial {
  const borderStyleMap: Record<string, number> = {
    none: 0,
    tech: 1,
    hex: 2,
    circular: 3,
  };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uDepthMap: { value: depthTexture },
      uDepthIntensity: { value: settings.depthIntensity ?? 1.0 },
      uDepthInvert: { value: settings.depthInvert ? 1.0 : 0.0 },
      uTime: { value: 0 },
      uOpacity: { value: settings.opacity },
      uGlowIntensity: { value: settings.glowIntensity },
      uScanIntensity: { value: settings.scanIntensity },
      uGridVisibility: { value: settings.gridVisibility },
      uDistortion: { value: settings.distortion },
      uAnimationSpeed: { value: settings.animationSpeed },
      uBorderStyle: { value: borderStyleMap[settings.borderStyle] ?? 1 },
      uTint: { value: settings.tint },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uAspect: { value: settings.aspect ?? 1 },
      uCurveIntensity: { value: settings.curveIntensity ?? 0 },
      uLaserScan: { value: settings.laserScan ? 1.0 : 0.0 },
      uLaserScanPos: { value: 0.5 },
      uLayerMin: { value: settings.layerMin ?? 0.0 },
      uLayerMax: { value: settings.layerMax ?? 1.0 },
      uIsLayerSlice: { value: settings.isLayerSlice ? 1 : 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    wireframe: settings.wireframe ?? false,
  });

  return material;
}

// ----------------------------------------------------
// 3D Holographic Point Cloud Shader
// ----------------------------------------------------

export const pointVertexShader = `
  attribute vec3 color;
  varying vec3 vColor;
  varying vec2 vUv;
  varying float vDepth;
  uniform float uTime;
  uniform float uSize;
  uniform float uDistortion;
  uniform float uAnimationSpeed;

  void main() {
    vColor = color;
    vUv = uv;
    vec3 pos = position;
    vDepth = pos.z;

    // Scan wave
    float wave = sin(pos.y * 8.0 + uTime * 3.0 * uAnimationSpeed) * 0.03 * uDistortion;
    pos.z += wave;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const pointFragmentShader = `
  varying vec3 vColor;
  varying vec2 vUv;
  varying float vDepth;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uGlowIntensity;
  uniform float uScanIntensity;
  uniform int uTint;

  vec3 getTint() {
    if (uTint == 0) return vec3(0.0, 1.0, 1.0); // Cyan
    if (uTint == 1) return vec3(0.2, 0.65, 1.0); // Blue
    if (uTint == 2) return vec3(0.78, 0.4, 1.0); // Purple
    if (uTint == 3) return vec3(0.2, 1.0, 0.4); // Green
    if (uTint == 4) return vec3(1.0, 0.25, 0.2); // Hot Rod Red
    return vec3(1.0, 0.65, 0.1); // Quantum Amber
  }

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.2, dist);

    vec3 tint = getTint();
    vec3 col = mix(vColor, tint, 0.55) * (1.0 + core * 0.8);
    col *= (1.0 + uGlowIntensity * 0.5);

    // Subtle scan line pulse
    float scan = sin(vUv.y * 150.0 + uTime * 8.0) * 0.2 + 0.8;
    float alpha = glow * uOpacity * scan;

    gl_FragColor = vec4(col, alpha);
  }
`;

export function createHologramPointMaterial(
  settings: {
    opacity: number;
    glowIntensity: number;
    scanIntensity: number;
    distortion: number;
    animationSpeed: number;
    tint: number;
    particleSize?: number;
  }
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: settings.particleSize ?? 3.5 },
      uOpacity: { value: settings.opacity },
      uGlowIntensity: { value: settings.glowIntensity },
      uScanIntensity: { value: settings.scanIntensity },
      uDistortion: { value: settings.distortion },
      uAnimationSpeed: { value: settings.animationSpeed },
      uTint: { value: settings.tint },
    },
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
