export type ProjectionMode = 'relief' | 'exploded' | 'points' | 'slices' | 'curved' | 'flat';

export interface HologramSettings {
  glowIntensity: number;
  opacity: number;
  scanIntensity: number;
  gridVisibility: number;
  particleEffects: boolean;
  distortion: number;
  borderStyle: 'none' | 'tech' | 'hex' | 'circular';
  animationSpeed: number;
  hologramSize: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  tint: number; // 0 = cyan, 1 = blue, 2 = purple, 3 = green, 4 = hot rod red, 5 = quantum amber
  // 3D Depth & Volume settings
  projectionMode: ProjectionMode;
  depthIntensity: number; // 0.0 to 3.0
  depthInvert: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  // Iron Man Stark Hologram Features
  explodedSpread: number; // 0.2 to 3.0 distance between deconstructed layers
  starkHudRings: boolean; // Orbital 3D gyroscopic HUD rings
  laserScan: boolean; // Sweeping laser diagnostic scan
  laserScanSpeed: number; // 0.2 to 3.0
  curveIntensity: number; // For curved holographic screen mode
  audioEnabled: boolean; // J.A.R.V.I.S. sound synthesizer
}

export interface HologramTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export type Tool = 'rotate' | 'move' | 'scale' | 'zoom';

export const defaultSettings: HologramSettings = {
  glowIntensity: 1.3,
  opacity: 0.95,
  scanIntensity: 0.6,
  gridVisibility: 0.6,
  particleEffects: true,
  distortion: 0.12,
  borderStyle: 'tech',
  animationSpeed: 1.0,
  hologramSize: 1.0,
  positionX: 0,
  positionY: 0.4,
  positionZ: 0,
  rotationX: -0.1,
  rotationY: 0.45,
  rotationZ: 0,
  tint: 0,
  // 3D & Stark settings
  projectionMode: 'relief',
  depthIntensity: 1.5,
  depthInvert: false,
  wireframe: false,
  autoRotate: false, // Default to static so image does not spin without user intent
  autoRotateSpeed: 0.8,
  explodedSpread: 1.2,
  starkHudRings: true,
  laserScan: false,
  laserScanSpeed: 1.0,
  curveIntensity: 0.6,
  audioEnabled: true,
};

export const defaultTransform: HologramTransform = {
  position: [0, 0.4, 0],
  rotation: [-0.1, 0.45, 0],
  scale: 1.0,
};
