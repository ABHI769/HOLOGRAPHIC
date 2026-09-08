import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface GridFloorProps {
  gridVisibility?: number;
  particleEffects?: boolean;
  tint?: number;
}

const TINT_COLORS: Record<number, number> = {
  0: 0x00ffff, // Cyan
  1: 0x38bdf8, // Blue
  2: 0xc084fc, // Purple
  3: 0x4ade80, // Green
  4: 0xff3b30, // Hot Rod Red
  5: 0xf59e0b, // Quantum Amber
};

export default function GridFloor({
  gridVisibility = 0.5,
  particleEffects = true,
  tint = 0,
}: GridFloorProps) {
  const gridRef = useRef<THREE.GridHelper>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const emitterRingRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const particleCount = 220;
  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  const activeColor = TINT_COLORS[tint] ?? 0x00ffff;

  useFrame((state, delta) => {
    if (gridRef.current) {
      const material = gridRef.current.material as THREE.LineBasicMaterial;
      const baseOpacity = 0.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      material.opacity = baseOpacity * gridVisibility;
      material.transparent = true;
    }
    if (particlesRef.current && particleEffects) {
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += 0.012;
        if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = 0;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (emitterRingRef.current) {
      emitterRingRef.current.rotation.y += delta * 0.35;
    }
    if (coreRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 3.0) * 0.08;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <>
      <gridHelper
        key={`grid-${tint}`}
        ref={gridRef}
        args={[22, 44, activeColor, 0x0f2937]}
        position={[0, -1.5, 0]}
        visible={gridVisibility > 0.01}
      />

      {/* Stark Arc Reactor Holographic Projector Pad */}
      <group position={[0, -1.48, 0]}>
        {/* Projector Base Outer Dark Disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 2.2, 48]} />
          <meshBasicMaterial
            color={0x020617}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>

        {/* Central Arc Core Emitter */}
        <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.22, 32]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Static Base Glow Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.06, 64]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.6, 48]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Rotating Telemetry Emitter Aperture Rings */}
        <group ref={emitterRingRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.05, 1.1, 32, 1, 0, Math.PI * 1.5]} />
            <meshBasicMaterial
              color={activeColor}
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.54, 32, 1, Math.PI * 0.4, Math.PI * 1.4]} />
            <meshBasicMaterial
              color={activeColor}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>

        {/* Holographic Light Emitter Cone projecting upward */}
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[1.6, 0.45, 2.0, 32, 1, true]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.06 * gridVisibility}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <points ref={particlesRef} visible={particleEffects}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          key={`particles-${tint}`}
          color={activeColor}
          size={0.055}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}
