import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface StarkOrbitalsProps {
  tint: number;
  glowIntensity: number;
  size: number;
  active: boolean;
}

const TINT_COLORS: Record<number, number> = {
  0: 0x00ffff, // Cyan (J.A.R.V.I.S.)
  1: 0x38bdf8, // Arc Blue
  2: 0xc084fc, // Stealth Purple
  3: 0x4ade80, // Vibranium Green
  4: 0xff3b30, // Hot Rod Red (Mark IV/VII)
  5: 0xf59e0b, // Quantum Amber (Arc Core)
};

export default function StarkOrbitals({
  tint,
  glowIntensity,
  size,
  active,
}: StarkOrbitalsProps) {
  const outerRingRef = useRef<THREE.Group>(null);
  const midRingRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.Group>(null);

  const activeColor = TINT_COLORS[tint] ?? 0x00ffff;

  useFrame((state, delta) => {
    if (!active) return;
    const time = state.clock.elapsedTime;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = time * 0.25;
      outerRingRef.current.rotation.x = Math.sin(time * 0.15) * 0.1;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.y = -time * 0.35;
      midRingRef.current.rotation.z = Math.cos(time * 0.2) * 0.15;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.x = time * 0.45;
      innerRingRef.current.rotation.z = -time * 0.3;
    }
    if (reticleRef.current) {
      const pulse = 1.0 + Math.sin(time * 4.0) * 0.04;
      reticleRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  if (!active) return null;

  const radius = Math.max(1.4, size * 1.5);

  return (
    <group>
      {/* Outer Gyroscopic Ring */}
      <group ref={outerRingRef}>
        {/* Main Outer Circle */}
        <mesh>
          <ringGeometry args={[radius * 1.18, radius * 1.2, 64]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.35 * glowIntensity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Outer Segmented Arc */}
        <mesh>
          <ringGeometry args={[radius * 1.23, radius * 1.26, 32, 1, 0, Math.PI * 0.6]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.6 * glowIntensity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[radius * 1.23, radius * 1.26, 32, 1, Math.PI, Math.PI * 0.6]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.6 * glowIntensity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Middle Gyroscopic Ring (Tilted) */}
      <group ref={midRingRef} rotation={[Math.PI / 4, 0, 0]}>
        <mesh>
          <ringGeometry args={[radius * 1.08, radius * 1.095, 48]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.25 * glowIntensity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Orbital Marker Pips */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          const x = Math.cos(angle) * radius * 1.08;
          const y = Math.sin(angle) * radius * 1.08;
          return (
            <mesh key={i} position={[x, y, 0]}>
              <boxGeometry args={[0.08, 0.08, 0.02]} />
              <meshBasicMaterial
                color={activeColor}
                transparent
                opacity={0.8 * glowIntensity}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          );
        })}
      </group>

      {/* Inner Fast Ring (Cross-axis) */}
      <group ref={innerRingRef} rotation={[0, Math.PI / 3, 0]}>
        <mesh>
          <ringGeometry args={[radius * 0.95, radius * 0.965, 36, 1, 0, Math.PI * 1.4]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.3 * glowIntensity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Stark Reticle & Corner Brackets */}
      <group ref={reticleRef}>
        {/* Corner Telemetry Brackets around model */}
        {[-1, 1].map((xDir) =>
          [-1, 1].map((yDir) => {
            const bx = (radius * 0.75) * xDir;
            const by = (radius * 0.75) * yDir;
            const armLen = 0.25;
            return (
              <group key={`corner-${xDir}-${yDir}`} position={[bx, by, 0]}>
                {/* Horizontal arm */}
                <mesh position={[-xDir * armLen * 0.5, 0, 0]}>
                  <boxGeometry args={[armLen, 0.025, 0.01]} />
                  <meshBasicMaterial
                    color={activeColor}
                    transparent
                    opacity={0.7 * glowIntensity}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                {/* Vertical arm */}
                <mesh position={[0, -yDir * armLen * 0.5, 0]}>
                  <boxGeometry args={[0.025, armLen, 0.01]} />
                  <meshBasicMaterial
                    color={activeColor}
                    transparent
                    opacity={0.7 * glowIntensity}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              </group>
            );
          })
        )}
      </group>
    </group>
  );
}
