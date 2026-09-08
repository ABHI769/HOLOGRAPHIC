import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { HologramSettings, HologramTransform } from '../lib/types';
import { jarvisAudio } from '../lib/jarvisAudio';
import HologramImage from './HologramImage';
import GridFloor from './GridFloor';
import StarkOrbitals from './StarkOrbitals';
import { Play, Pause, Fullscreen, Minimize2, Sliders } from 'lucide-react';

export type CameraPreset = 'iso' | 'front' | 'side-r' | 'side-l' | 'top' | 'reset';

interface HologramCanvasProps {
  imageUrl: string | null;
  settings: HologramSettings;
  transform: HologramTransform;
  onTransformChange: (transform: HologramTransform) => void;
  tool: 'rotate' | 'move' | 'scale' | 'zoom';
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  showControls?: boolean;
  onToggleControls?: () => void;
  onImageUpload?: (url: string, file: File) => void;
  onSettingsChange?: (settings: HologramSettings) => void;
}

export interface HologramCanvasRef {
  toggleFullscreen: () => void;
  captureSnapshot: () => void;
}

function Scene({
  imageUrl,
  settings,
  transform,
  tool,
  cameraPreset,
  onCameraPresetDone,
}: {
  imageUrl: string;
  settings: HologramSettings;
  transform: HologramTransform;
  tool: 'rotate' | 'move' | 'scale' | 'zoom';
  cameraPreset: CameraPreset | null;
  onCameraPresetDone: () => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.4, 0));

  useEffect(() => {
    if (!cameraPreset) return;
    if (cameraPreset === 'iso') {
      targetCamPos.current = new THREE.Vector3(3.8, 1.8, 3.8);
      targetLookAt.current.set(transform.position[0], transform.position[1], transform.position[2]);
    } else if (cameraPreset === 'front') {
      targetCamPos.current = new THREE.Vector3(0, transform.position[1], 5.5);
      targetLookAt.current.set(transform.position[0], transform.position[1], transform.position[2]);
    } else if (cameraPreset === 'side-r') {
      targetCamPos.current = new THREE.Vector3(5.5, transform.position[1], 0);
      targetLookAt.current.set(transform.position[0], transform.position[1], transform.position[2]);
    } else if (cameraPreset === 'side-l') {
      targetCamPos.current = new THREE.Vector3(-5.5, transform.position[1], 0);
      targetLookAt.current.set(transform.position[0], transform.position[1], transform.position[2]);
    } else if (cameraPreset === 'top') {
      targetCamPos.current = new THREE.Vector3(0, 6.0, 0.05);
      targetLookAt.current.set(transform.position[0], transform.position[1], transform.position[2]);
    } else if (cameraPreset === 'reset') {
      targetCamPos.current = new THREE.Vector3(0, 1.5, 6);
      targetLookAt.current.set(0, 0.4, 0);
    }
  }, [cameraPreset, transform.position]);

  useFrame(() => {
    if (targetCamPos.current) {
      camera.position.lerp(targetCamPos.current, 0.09);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.09);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetCamPos.current) < 0.04) {
        targetCamPos.current = null;
        onCameraPresetDone();
      }
    }
  });

  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 8, 25]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.65} color="#00ffff" />
      <pointLight position={[-5, 3, -5]} intensity={0.4} color="#0088ff" />
      <Stars radius={50} depth={30} count={800} factor={3} saturation={0.8} fade speed={0.5} />
      <GridFloor
        gridVisibility={settings.gridVisibility}
        particleEffects={settings.particleEffects}
        tint={settings.tint}
      />
      <HologramImage
        imageUrl={imageUrl}
        settings={settings}
        transform={transform}
        tool={tool}
      />
      {/* Stark Gyroscopic Orbitals & Reticles */}
      <group position={transform.position}>
        <StarkOrbitals
          tint={settings.tint}
          glowIntensity={settings.glowIntensity}
          size={settings.hologramSize * transform.scale}
          active={settings.starkHudRings}
        />
      </group>
      <OrbitControls
        ref={controlsRef}
        enableDamping={true}
        dampingFactor={0.08}
        rotateSpeed={0.85}
        panSpeed={1.3}
        zoomSpeed={1.1}
        minDistance={1.4}
        maxDistance={25}
        enablePan={true}
        enableZoom={true}
        enableRotate={tool !== 'zoom'}
        autoRotate={settings.autoRotate && !targetCamPos.current}
        autoRotateSpeed={settings.autoRotateSpeed * 1.6}
        mouseButtons={{
          LEFT: tool === 'move' ? THREE.MOUSE.PAN : tool === 'zoom' ? THREE.MOUSE.DOLLY : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: tool === 'move' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </>
  );
}

const HologramCanvas = forwardRef<HologramCanvasRef, HologramCanvasProps>(
  (
    {
      imageUrl,
      settings,
      transform,
      onTransformChange,
      tool,
      isFullscreen,
      setIsFullscreen,
      showControls = true,
      onToggleControls,
      onImageUpload,
      onSettingsChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);

    const handleExitFullscreen = () => {
      jarvisAudio.playBeep('click');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    };

    const handleToggleFullscreen = () => {
      jarvisAudio.playBeep('click');
      if (!isFullscreen) {
        setIsFullscreen(true);
      } else {
        handleExitFullscreen();
      }
    };

    useImperativeHandle(ref, () => ({
      toggleFullscreen: handleToggleFullscreen,
      captureSnapshot: () => {
        const canvas = containerRef.current?.querySelector('canvas');
        if (!canvas) return;
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `hank-hologram-${Date.now()}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error('Failed to capture snapshot:', e);
        }
      },
    }));

    // Listen for ESC key and native fullscreen change events
    useEffect(() => {
      const onFullscreenChange = () => {
        if (!document.fullscreenElement && isFullscreen) {
          setIsFullscreen(false);
        }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullscreen) {
          handleExitFullscreen();
        }
      };

      document.addEventListener('fullscreenchange', onFullscreenChange);
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        window.removeEventListener('keydown', onKeyDown);
      };
    }, [isFullscreen, setIsFullscreen]);

    // Handle dropping new images directly onto the 3D canvas
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/') && onImageUpload) {
        jarvisAudio.playActivation();
        const url = URL.createObjectURL(file);
        onImageUpload(url, file);
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImageUpload) {
        jarvisAudio.playActivation();
        const url = URL.createObjectURL(file);
        onImageUpload(url, file);
      }
    };

    const toggleAutoRotate = () => {
      jarvisAudio.playBeep('toggle');
      if (onSettingsChange) {
        onSettingsChange({
          ...settings,
          autoRotate: !settings.autoRotate,
        });
      }
    };

    return (
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden shadow-[0_0_40px_rgba(0,255,255,0.15)] bg-slate-950 select-none w-full h-full ${
          isFullscreen ? 'rounded-none border-0' : 'rounded-2xl border border-cyan-500/30'
        } ${tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />

        <div className="absolute inset-0 pointer-events-none z-10 scan-overlay" />
        <div className="absolute inset-0 pointer-events-none z-10 corner-brackets" />

        {/* Drag and drop overlay over canvas */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 bg-cyan-950/80 border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none animate-pulse">
            <div className="w-16 h-16 rounded-full border border-cyan-400 bg-cyan-900/60 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(0,255,255,0.5)]">
              <span className="text-2xl">✨</span>
            </div>
            <div className="text-cyan-200 font-mono text-base font-bold tracking-widest">
              DROP IMAGE TO PROJECT 3D HOLOGRAM
            </div>
            <div className="text-cyan-400/80 font-mono text-xs">
              INSTANT VOLUMETRIC DEPTH MAPPING
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none flex-wrap gap-2">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="px-3 py-1 rounded border border-cyan-500/40 bg-slate-900/90 text-cyan-300 text-xs font-mono tracking-widest flex items-center gap-2 shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>STARK VIEWPORT</span>
            </div>

            {/* Prominent Stop / Start Movement Button */}
            <button
              onClick={toggleAutoRotate}
              className={`px-3 py-1 rounded border text-xs font-mono tracking-wider transition flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                settings.autoRotate
                  ? 'border-amber-400 bg-amber-950/60 text-amber-200 hover:bg-amber-900/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                  : 'border-emerald-400/60 bg-emerald-950/50 text-emerald-200 hover:bg-emerald-900/50'
              }`}
              title={settings.autoRotate ? 'Stop automatic rotation' : 'Start automatic rotation'}
            >
              {settings.autoRotate ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span className="font-bold">STOP ROTATION</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300" />
                  <span>START ROTATION</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-500/30 text-cyan-200 text-xs font-mono tracking-wider transition hidden sm:flex items-center gap-1.5 shadow-md backdrop-blur-md"
              title="Upload new image to project"
            >
              <span>+ UPLOAD</span>
            </button>
          </div>

          {/* Quick View Angle Presets & Controls/Fullscreen buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-cyan-500/30 backdrop-blur-md shadow-lg">
              <button
                onClick={() => setCameraPreset('iso')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                  cameraPreset === 'iso'
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold'
                    : 'border-transparent text-cyan-300 hover:bg-cyan-500/20'
                }`}
                title="3D Isometric Perspective View"
              >
                3D ISO
              </button>
              <button
                onClick={() => setCameraPreset('front')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                  cameraPreset === 'front'
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold'
                    : 'border-transparent text-cyan-400/80 hover:bg-cyan-500/20'
                }`}
                title="Front Orthogonal View"
              >
                FRONT
              </button>
              <button
                onClick={() => setCameraPreset('side-r')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                  cameraPreset === 'side-r'
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold'
                    : 'border-transparent text-cyan-400/80 hover:bg-cyan-500/20'
                }`}
                title="Right Side Depth Profile"
              >
                RIGHT
              </button>
              <button
                onClick={() => setCameraPreset('side-l')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                  cameraPreset === 'side-l'
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold'
                    : 'border-transparent text-cyan-400/80 hover:bg-cyan-500/20'
                }`}
                title="Left Side Depth Profile"
              >
                LEFT
              </button>
              <button
                onClick={() => setCameraPreset('top')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                  cameraPreset === 'top'
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold'
                    : 'border-transparent text-cyan-400/80 hover:bg-cyan-500/20'
                }`}
                title="Top View"
              >
                TOP
              </button>
              <button
                onClick={() => setCameraPreset('reset')}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400/70 hover:bg-cyan-500/20 hover:text-cyan-200 transition"
                title="Reset Camera View"
              >
                RESET
              </button>
            </div>

            {/* Show / Hide Controls Button */}
            {onToggleControls && (
              <button
                onClick={onToggleControls}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono tracking-wider transition flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                  showControls
                    ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold shadow-[0_0_12px_rgba(0,255,255,0.25)]'
                    : 'border-cyan-500/30 bg-slate-900/90 text-cyan-300 hover:bg-cyan-500/20'
                }`}
                title="Toggle Controls Sidebar"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden md:inline">{showControls ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}</span>
              </button>
            )}

            {/* Direct Fullscreen Button in the Viewport */}
            {isFullscreen ? (
              <button
                onClick={handleExitFullscreen}
                className="px-3 py-1.5 rounded-lg border border-red-500/60 bg-red-950/90 hover:bg-red-900 text-red-200 text-xs font-mono font-bold tracking-wider transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md"
                title="Exit Fullscreen Mode (or press ESC)"
              >
                <Minimize2 className="w-3.5 h-3.5 text-red-300" />
                <span>EXIT FULLSCREEN</span>
              </button>
            ) : (
              <button
                onClick={handleToggleFullscreen}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-slate-900/90 hover:bg-cyan-500/20 text-cyan-200 text-xs font-mono tracking-wider transition flex items-center gap-1.5 shadow-md backdrop-blur-md"
                title="Enter Fullscreen"
              >
                <Fullscreen className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">FULLSCREEN</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Toolbar with interactive guidance */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none flex-wrap gap-2">
          <div className="pointer-events-auto text-cyan-300 text-[11px] font-mono bg-slate-950/90 px-3 py-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-md flex items-center gap-2 shadow-lg">
            <span>TOOL: <strong className="text-cyan-200 underline decoration-cyan-400 decoration-2">{tool.toUpperCase()}</strong></span>
            <span className="text-cyan-600">|</span>
            {tool === 'move' ? (
              <span className="text-emerald-300 font-medium">DRAG CURSOR TO MOVE / PAN SIDEWAYS</span>
            ) : tool === 'zoom' ? (
              <span className="text-cyan-200">DRAG CURSOR OR SCROLL WHEEL TO ZOOM</span>
            ) : tool === 'scale' ? (
              <span className="text-cyan-200">USE SCALE SLIDER IN CONTROLS OR DRAG</span>
            ) : (
              <span className="text-cyan-200">LEFT DRAG: ORBIT 3D • RIGHT DRAG: PAN • WHEEL: ZOOM</span>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={toggleAutoRotate}
              className={`px-2.5 py-1 rounded border text-[11px] font-mono transition flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                settings.autoRotate
                  ? 'border-amber-400 bg-amber-950/50 text-amber-200 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'border-slate-700 bg-slate-900/80 text-cyan-400/80 hover:bg-cyan-500/10'
              }`}
              title="Toggle automatic rotation"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${settings.autoRotate ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
              MOVEMENT: {settings.autoRotate ? 'ROTATING' : 'STOPPED'}
            </button>
          </div>
        </div>

        <Canvas
          camera={{ position: [0, 1.5, 6], fov: 50 }}
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
        >
          {imageUrl && (
            <Scene
              imageUrl={imageUrl}
              settings={settings}
              transform={transform}
              tool={tool}
              cameraPreset={cameraPreset}
              onCameraPresetDone={() => setCameraPreset(null)}
            />
          )}
        </Canvas>
      </div>
    );
  }
);

export default HologramCanvas;
