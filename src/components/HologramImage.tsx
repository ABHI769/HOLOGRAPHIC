import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { HologramSettings, HologramTransform } from '../lib/types';
import { createHologramMaterial, createHologramPointMaterial } from '../lib/hologramShader';
import { generateDepthCanvas, generatePointCloudData, PointCloudData } from '../lib/depthExtractor';

interface HologramImageProps {
  imageUrl: string;
  settings: HologramSettings;
  transform: HologramTransform;
  onTransformChange?: (transform: HologramTransform) => void;
  tool?: 'rotate' | 'move' | 'scale' | 'zoom';
}

const TINT_HEX: Record<number, number> = {
  0: 0x00ffff, // Cyan
  1: 0x38bdf8, // Blue
  2: 0xc084fc, // Purple
  3: 0x4ade80, // Green
  4: 0xff3b30, // Hot Rod Red
  5: 0xf59e0b, // Quantum Amber
};

export default function HologramImage({
  imageUrl,
  settings,
  transform,
}: HologramImageProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [depthTexture, setDepthTexture] = useState<THREE.CanvasTexture | null>(null);
  const [material, setMaterial] = useState<THREE.ShaderMaterial | null>(null);
  const [pointMaterial, setPointMaterial] = useState<THREE.ShaderMaterial | null>(null);
  const [aspect, setAspect] = useState(1);
  const [pointData, setPointData] = useState<PointCloudData | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // Load Image and generate depth map
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(imageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      setTexture(tex);

      const img = tex.image as HTMLImageElement;
      imgElementRef.current = img;
      const loadedAspect = img && img.width && img.height ? img.width / img.height : 1;
      setAspect(loadedAspect);

      // Generate depth map
      const depthCanvas = generateDepthCanvas(img, settings.depthInvert);
      const depthTex = new THREE.CanvasTexture(depthCanvas);
      depthTex.minFilter = THREE.LinearFilter;
      depthTex.magFilter = THREE.LinearFilter;
      setDepthTexture(depthTex);

      // Generate Point Cloud data
      const pc = generatePointCloudData(img, 110, loadedAspect, settings.depthIntensity, settings.depthInvert);
      setPointData(pc);

      // Create 3D Surface Relief Material
      const newMat = createHologramMaterial(tex, depthTex, {
        opacity: settings.opacity,
        glowIntensity: settings.glowIntensity,
        scanIntensity: settings.scanIntensity,
        gridVisibility: settings.gridVisibility,
        distortion: settings.distortion,
        animationSpeed: settings.animationSpeed,
        borderStyle: settings.borderStyle,
        tint: settings.tint,
        aspect: loadedAspect,
        depthIntensity: settings.projectionMode === 'flat' ? 0 : settings.depthIntensity,
        depthInvert: settings.depthInvert,
        wireframe: settings.wireframe,
        curveIntensity: settings.projectionMode === 'curved' ? settings.curveIntensity : 0,
        laserScan: settings.laserScan,
      });
      setMaterial(newMat);

      // Create Point Cloud Material
      const pMat = createHologramPointMaterial({
        opacity: settings.opacity,
        glowIntensity: settings.glowIntensity,
        scanIntensity: settings.scanIntensity,
        distortion: settings.distortion,
        animationSpeed: settings.animationSpeed,
        tint: settings.tint,
        particleSize: 3.5,
      });
      setPointMaterial(pMat);
    });
  }, [imageUrl]);

  // Re-generate depth and point cloud when depth settings change
  useEffect(() => {
    if (!imgElementRef.current) return;
    const img = imgElementRef.current;
    const depthCanvas = generateDepthCanvas(img, settings.depthInvert);
    const depthTex = new THREE.CanvasTexture(depthCanvas);
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.magFilter = THREE.LinearFilter;
    setDepthTexture(depthTex);

    if (material) {
      material.uniforms.uDepthMap.value = depthTex;
    }

    const pc = generatePointCloudData(img, 110, aspect, settings.depthIntensity, settings.depthInvert);
    setPointData(pc);
  }, [settings.depthInvert, settings.depthIntensity, aspect]);

  // Synchronize surface material uniforms
  useEffect(() => {
    if (!material) return;
    const borderStyleMap: Record<string, number> = {
      none: 0,
      tech: 1,
      hex: 2,
      circular: 3,
    };
    material.uniforms.uOpacity.value = settings.opacity;
    material.uniforms.uGlowIntensity.value = settings.glowIntensity;
    material.uniforms.uScanIntensity.value = settings.scanIntensity;
    material.uniforms.uGridVisibility.value = settings.gridVisibility;
    material.uniforms.uDistortion.value = settings.distortion;
    material.uniforms.uAnimationSpeed.value = settings.animationSpeed;
    material.uniforms.uBorderStyle.value = borderStyleMap[settings.borderStyle] ?? 1;
    material.uniforms.uTint.value = settings.tint;
    material.uniforms.uAspect.value = aspect;
    material.uniforms.uDepthIntensity.value = settings.projectionMode === 'flat' ? 0.0 : settings.depthIntensity;
    material.uniforms.uDepthInvert.value = settings.depthInvert ? 1.0 : 0.0;
    material.uniforms.uCurveIntensity.value = settings.projectionMode === 'curved' ? settings.curveIntensity : 0.0;
    material.uniforms.uLaserScan.value = settings.laserScan ? 1.0 : 0.0;
    material.wireframe = settings.wireframe;
  }, [material, settings, aspect]);

  // Synchronize point cloud material uniforms
  useEffect(() => {
    if (!pointMaterial) return;
    pointMaterial.uniforms.uOpacity.value = settings.opacity;
    pointMaterial.uniforms.uGlowIntensity.value = settings.glowIntensity;
    pointMaterial.uniforms.uScanIntensity.value = settings.scanIntensity;
    pointMaterial.uniforms.uDistortion.value = settings.distortion;
    pointMaterial.uniforms.uAnimationSpeed.value = settings.animationSpeed;
    pointMaterial.uniforms.uTint.value = settings.tint;
  }, [pointMaterial, settings]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (material) {
      material.uniforms.uTime.value = time;
      if (settings.laserScan) {
        // Ping-pong laser scanning position along Y from 0 to 1
        const scanPos = (Math.sin(time * settings.laserScanSpeed * 2.5) + 1.0) * 0.5;
        material.uniforms.uLaserScanPos.value = scanPos;
      }
    }
    if (pointMaterial) {
      pointMaterial.uniforms.uTime.value = time;
    }
    if (groupRef.current) {
      // Iron Man holographic idle levitation
      groupRef.current.position.y = transform.position[1] + Math.sin(time * 1.5) * 0.03;
    }
  });

  // Keep group synchronized when transform is updated via UI controls
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(transform.position[0], transform.position[1], transform.position[2]);
      groupRef.current.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
    }
  }, [transform.position, transform.rotation]);

  const clampedAspect = isFinite(aspect) && aspect > 0 ? aspect : 1;
  const baseSize = 2.4 * settings.hologramSize * transform.scale;
  const width = baseSize * clampedAspect;
  const height = baseSize;

  // Buffer Geometry for 3D Point Cloud
  const pointGeometry = useMemo(() => {
    if (!pointData) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pointData.positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(pointData.colors, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(pointData.uvs, 2));
    return geom;
  }, [pointData]);

  // Slices for volumetric tomography mode
  const sliceCount = 5;
  const slices = useMemo(() => {
    const arr = [];
    const maxZ = 0.35 * settings.depthIntensity;
    for (let i = 0; i < sliceCount; i++) {
      const zOffset = ((i / (sliceCount - 1)) - 0.5) * maxZ;
      const opacityFactor = 0.45 + (1 - Math.abs((i / (sliceCount - 1)) - 0.5) * 2) * 0.55;
      arr.push({ id: i, z: zOffset, opacityFactor });
    }
    return arr;
  }, [settings.depthIntensity]);

  // Exploded / Deconstructed Stark Layers
  const explodedLayers = useMemo(() => {
    const count = 4;
    const spread = (settings.explodedSpread ?? 1.2) * 0.45;
    const labels = ['CORE MATRIX', 'MID TELEMETRY', 'SURFACE CAD', 'HUD OVERLAY'];
    const arr = [];
    for (let i = 0; i < count; i++) {
      const z = (i - (count - 1) / 2) * spread;
      const scaleFactor = 1.0 + (i - (count - 1) / 2) * 0.04;
      arr.push({ id: i, z, label: labels[i], scaleFactor });
    }
    return arr;
  }, [settings.explodedSpread]);

  // Laser Guide lines between exploded corners
  const explodedGuideLines = useMemo(() => {
    if (settings.projectionMode !== 'exploded' || explodedLayers.length < 2) return null;
    const firstZ = explodedLayers[0].z;
    const lastZ = explodedLayers[explodedLayers.length - 1].z;
    const corners = [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ];
    const points: THREE.Vector3[] = [];
    corners.forEach(([cx, cy]) => {
      points.push(new THREE.Vector3(cx, cy, firstZ));
      points.push(new THREE.Vector3(cx, cy, lastZ));
    });
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [settings.projectionMode, explodedLayers]);

  const tintColorHex = TINT_HEX[settings.tint] ?? 0x00ffff;

  return (
    <group
      ref={groupRef}
      position={transform.position}
      rotation={transform.rotation}
      scale={[width, height, 1]}
    >
      {/* 1. 3D Relief Surface Mode */}
      {settings.projectionMode === 'relief' && material && (
        <>
          <mesh ref={meshRef} material={material}>
            <planeGeometry args={[1, 1, 160, 160]} />
          </mesh>

          {/* 3D Holographic Bounding Cage */}
          <lineSegments scale={[1.02, 1.02, Math.max(0.25, settings.depthIntensity * 0.55)]}>
            <boxGeometry args={[1, 1, 1]} />
            <lineBasicMaterial
              color={tintColorHex}
              transparent
              opacity={0.2 * settings.glowIntensity}
            />
          </lineSegments>

          {/* Holographic Backing Matrix Plate */}
          <mesh position={[0, 0, -0.12]} scale={[0.98, 0.98, 1]}>
            <planeGeometry args={[1, 1, 12, 12]} />
            <meshBasicMaterial
              color={tintColorHex}
              wireframe
              transparent
              opacity={0.08 * settings.glowIntensity}
            />
          </mesh>
        </>
      )}

      {/* 2. Iron Man Exploded / Deconstructed Layer Mode */}
      {settings.projectionMode === 'exploded' && material && (
        <group>
          {explodedLayers.map((layer) => (
            <group key={layer.id} position={[0, 0, layer.z]} scale={[layer.scaleFactor, layer.scaleFactor, 1]}>
              <mesh material={material}>
                <planeGeometry args={[1, 1, 48, 48]} />
              </mesh>
              {/* Layer Frame / Border */}
              <lineSegments scale={[1.01, 1.01, 0.02]}>
                <boxGeometry args={[1, 1, 0.01]} />
                <lineBasicMaterial
                  color={tintColorHex}
                  transparent
                  opacity={0.35 * settings.glowIntensity}
                />
              </lineSegments>
            </group>
          ))}

          {/* Laser Guide Connecting Lines across exploded corners */}
          {explodedGuideLines && (
            <lineSegments geometry={explodedGuideLines}>
              <lineBasicMaterial
                color={tintColorHex}
                transparent
                opacity={0.5 * settings.glowIntensity}
                blending={THREE.AdditiveBlending}
              />
            </lineSegments>
          )}
        </group>
      )}

      {/* 3. Curved Holographic Screen Mode (Stark Console Wrap) */}
      {settings.projectionMode === 'curved' && material && (
        <>
          <mesh ref={meshRef} material={material}>
            <planeGeometry args={[1, 1, 120, 120]} />
          </mesh>
          <lineSegments scale={[1.02, 1.02, 0.4]}>
            <boxGeometry args={[1, 1, 1]} />
            <lineBasicMaterial
              color={tintColorHex}
              transparent
              opacity={0.2 * settings.glowIntensity}
            />
          </lineSegments>
        </>
      )}

      {/* 4. 3D Point Cloud / Voxel Matrix Mode */}
      {settings.projectionMode === 'points' && pointGeometry && pointMaterial && (
        <>
          <points ref={pointsRef} geometry={pointGeometry} material={pointMaterial} />
          <lineSegments scale={[1.02, 1.02, Math.max(0.25, settings.depthIntensity * 0.55)]}>
            <boxGeometry args={[1, 1, 1]} />
            <lineBasicMaterial
              color={tintColorHex}
              transparent
              opacity={0.15 * settings.glowIntensity}
            />
          </lineSegments>
        </>
      )}

      {/* 5. Multi-Plane Volumetric Slices Mode */}
      {settings.projectionMode === 'slices' && material && (
        <group>
          {slices.map((slice) => (
            <mesh key={slice.id} position={[0, 0, slice.z]} material={material}>
              <planeGeometry args={[1, 1, 32, 32]} />
            </mesh>
          ))}
          <lineSegments scale={[1.02, 1.02, Math.max(0.3, settings.depthIntensity * 0.55)]}>
            <boxGeometry args={[1, 1, 1]} />
            <lineBasicMaterial
              color={tintColorHex}
              transparent
              opacity={0.18 * settings.glowIntensity}
            />
          </lineSegments>
        </group>
      )}

      {/* 6. Flat Holographic Plane Mode */}
      {settings.projectionMode === 'flat' && material && (
        <mesh ref={meshRef} material={material}>
          <planeGeometry args={[1, 1, 32, 32]} />
        </mesh>
      )}
    </group>
  );
}
