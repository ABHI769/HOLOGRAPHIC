import { useRef } from 'react';
import { HologramSettings, HologramTransform, ProjectionMode, defaultTransform, defaultSettings } from '../lib/types';
import { jarvisAudio } from '../lib/jarvisAudio';
import {
  Sliders,
  RotateCcw,
  Move,
  Rotate3D,
  ZoomIn,
  Maximize,
  Fullscreen,
  Upload,
  Camera,
  Sparkles,
  Box,
  Layers,
  Grid,
  Disc,
  Split,
  CircleDot,
  Radio,
  Scan,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Minimize2,
  X,
} from 'lucide-react';

export const DEMO_PRESETS = [
  { id: 'reactor', name: 'ARC REACTOR', path: '/presets/reactor-core.svg' },
  { id: 'skull', name: 'CYBER SKULL', path: '/presets/cyber-skull.svg' },
  { id: 'mecha', name: 'MECHA ANDROID', path: '/presets/mecha-android.svg' },
  { id: 'cube', name: 'TESSERACT CUBE', path: '/presets/quantum-cube.svg' },
];

interface HologramControlsProps {
  settings: HologramSettings;
  onSettingsChange: (settings: HologramSettings) => void;
  transform: HologramTransform;
  onTransformChange: (transform: HologramTransform) => void;
  tool: 'rotate' | 'move' | 'scale' | 'zoom';
  onToolChange: (tool: 'rotate' | 'move' | 'scale' | 'zoom') => void;
  onReset: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  onCloseControls?: () => void;
  onLoadNewImage?: () => void;
  onImageUpload?: (url: string, file: File) => void;
  onCapture?: () => void;
  onSelectPreset?: (url: string) => void;
}

const tintOptions = [
  { label: 'J.A.R.V.I.S.', value: 0, color: '#00ffff' },
  { label: 'ARC BLUE', value: 1, color: '#38bdf8' },
  { label: 'STEALTH', value: 2, color: '#c084fc' },
  { label: 'VIBRANIUM', value: 3, color: '#4ade80' },
  { label: 'HOT ROD', value: 4, color: '#ff3b30' },
  { label: 'QUANTUM', value: 5, color: '#f59e0b' },
];

const borderOptions = [
  { label: 'NONE', value: 'none' },
  { label: 'TECH', value: 'tech' },
  { label: 'HEX', value: 'hex' },
  { label: 'CIRCULAR', value: 'circular' },
];

const projectionModes: { mode: ProjectionMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'relief', label: '3D RELIEF', icon: <Box className="w-3.5 h-3.5" /> },
  { mode: 'exploded', label: 'EXPLODED', icon: <Split className="w-3.5 h-3.5" /> },
  { mode: 'curved', label: 'CURVED', icon: <CircleDot className="w-3.5 h-3.5" /> },
  { mode: 'points', label: 'VOXELS', icon: <Disc className="w-3.5 h-3.5" /> },
  { mode: 'slices', label: 'SLICES', icon: <Layers className="w-3.5 h-3.5" /> },
  { mode: 'flat', label: 'FLAT', icon: <Grid className="w-3.5 h-3.5" /> },
];

export default function HologramControls({
  settings,
  onSettingsChange,
  transform,
  onTransformChange,
  tool,
  onToolChange,
  onReset,
  onFullscreen,
  isFullscreen,
  onCloseControls,
  onLoadNewImage,
  onImageUpload,
  onCapture,
  onSelectPreset,
}: HologramControlsProps) {
  const sidebarFileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof HologramSettings>(key: K, value: HologramSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const updateTransform = (patch: Partial<HologramTransform>) => {
    onTransformChange({ ...transform, ...patch });
  };

  const handleProjectionChange = (mode: ProjectionMode) => {
    if (mode === 'exploded') {
      jarvisAudio.playExplode();
    } else {
      jarvisAudio.playBeep('mode');
    }
    update('projectionMode', mode);
  };

  const toggleLaserScan = () => {
    const next = !settings.laserScan;
    if (next) jarvisAudio.playScan();
    else jarvisAudio.playBeep('toggle');
    update('laserScan', next);
  };

  const toggleStarkHud = () => {
    jarvisAudio.playBeep('toggle');
    update('starkHudRings', !settings.starkHudRings);
  };

  const toggleAudio = () => {
    const next = !settings.audioEnabled;
    jarvisAudio.setEnabled(next);
    if (next) jarvisAudio.playActivation();
    update('audioEnabled', next);
  };

  const toggleAutoRotate = () => {
    jarvisAudio.playBeep('toggle');
    update('autoRotate', !settings.autoRotate);
  };

  return (
    <div className="w-full flex flex-col gap-4 max-h-full">
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-md p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)] overflow-y-auto max-h-[calc(100vh-2rem)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs tracking-widest font-bold">
            <Sliders className="w-4 h-4 text-cyan-400 animate-pulse" />
            STARK HOLO CONSOLE
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleAudio}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition flex items-center gap-1 ${
                settings.audioEnabled
                  ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                  : 'border-slate-700 bg-slate-800/40 text-slate-500'
              }`}
              title="Toggle J.A.R.V.I.S. Synthesizer SFX"
            >
              {settings.audioEnabled ? <Volume2 className="w-3 h-3 text-cyan-300" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
              {settings.audioEnabled ? 'SFX ON' : 'SFX OFF'}
            </button>
            {onCloseControls && (
              <button
                onClick={onCloseControls}
                className="p-1 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition"
                title="Close controls panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Bar: Snapshot, Reset, Fullscreen */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {onCapture && (
            <button
              onClick={() => {
                jarvisAudio.playBeep('click');
                onCapture();
              }}
              className="py-2 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 text-xs font-mono hover:bg-cyan-500/30 transition flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(0,255,255,0.1)]"
              title="Capture PNG snapshot"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-300" /> SNAP
            </button>
          )}
          <button
            onClick={() => {
              jarvisAudio.playBeep('click');
              onReset();
            }}
            className="py-2 rounded border border-cyan-500/30 bg-slate-800/50 text-cyan-200 text-xs font-mono hover:bg-cyan-500/20 transition flex items-center justify-center gap-1"
            title="Reset position & angles"
          >
            <RotateCcw className="w-3.5 h-3.5" /> RESET
          </button>
          <button
            onClick={() => {
              jarvisAudio.playBeep('click');
              onFullscreen();
            }}
            className={`py-2 rounded border text-xs font-mono transition flex items-center justify-center gap-1 ${
              isFullscreen
                ? 'border-red-500/50 bg-red-950/60 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)] font-bold'
                : 'border-cyan-500/30 bg-slate-800/50 text-cyan-200 hover:bg-cyan-500/20'
            }`}
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-red-300" /> : <Fullscreen className="w-3.5 h-3.5" />}
            {isFullscreen ? 'EXIT FULL' : 'FULL'}
          </button>
        </div>

        {/* Prominent Stop / Freeze Movement Button */}
        <button
          onClick={toggleAutoRotate}
          className={`w-full py-2 px-3 rounded-lg border text-xs font-mono font-bold tracking-wider transition flex items-center justify-center gap-2 mb-4 shadow-md ${
            settings.autoRotate
              ? 'border-amber-400 bg-amber-950/60 text-amber-200 hover:bg-amber-900/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse'
              : 'border-emerald-400/60 bg-emerald-950/50 text-emerald-200 hover:bg-emerald-900/60'
          }`}
          title={settings.autoRotate ? 'Stop image from rotating constantly' : 'Start automatic rotation'}
        >
          {settings.autoRotate ? (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>STOP ROTATION (FREEZE)</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300" />
              <span>START 3D ROTATION</span>
            </>
          )}
        </button>

        {/* Iron Man Quick Stark Controls */}
        <ControlGroup title="IRON MAN STARK MODES">
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button
              onClick={() => {
                if (settings.projectionMode === 'exploded') {
                  handleProjectionChange('relief');
                } else {
                  handleProjectionChange('exploded');
                }
              }}
              className={`py-2 px-2.5 rounded border text-[11px] font-mono transition flex items-center justify-center gap-1.5 ${
                settings.projectionMode === 'exploded'
                  ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                  : 'border-cyan-500/30 bg-slate-800/40 text-cyan-300 hover:bg-cyan-500/15'
              }`}
            >
              <Split className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPLODE LAYERS</span>
            </button>

            <button
              onClick={toggleLaserScan}
              className={`py-2 px-2.5 rounded border text-[11px] font-mono transition flex items-center justify-center gap-1.5 ${
                settings.laserScan
                  ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100 font-bold shadow-[0_0_15px_rgba(74,222,128,0.3)]'
                  : 'border-cyan-500/30 bg-slate-800/40 text-cyan-300 hover:bg-cyan-500/15'
              }`}
            >
              <Scan className="w-3.5 h-3.5 text-emerald-400" />
              <span>CAD LASER SCAN</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/90 font-mono">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>STARK ORBITAL HUD RINGS</span>
            </div>
            <Toggle
              label=""
              checked={settings.starkHudRings}
              onChange={toggleStarkHud}
            />
          </div>
        </ControlGroup>

        {/* 3D Interaction Tools */}
        <ControlGroup title="MANIPULATION TOOLS">
          <div className="grid grid-cols-2 gap-2">
            <ToolButton
              active={tool === 'rotate'}
              onClick={() => {
                jarvisAudio.playBeep('click');
                onToolChange('rotate');
              }}
              icon={<Rotate3D className="w-4 h-4" />}
              label="ROTATE"
            />
            <ToolButton
              active={tool === 'move'}
              onClick={() => {
                jarvisAudio.playBeep('click');
                onToolChange('move');
              }}
              icon={<Move className="w-4 h-4" />}
              label="MOVE"
            />
            <ToolButton
              active={tool === 'scale'}
              onClick={() => {
                jarvisAudio.playBeep('click');
                onToolChange('scale');
              }}
              icon={<Maximize className="w-4 h-4" />}
              label="SCALE"
            />
            <ToolButton
              active={tool === 'zoom'}
              onClick={() => {
                jarvisAudio.playBeep('click');
                onToolChange('zoom');
              }}
              icon={<ZoomIn className="w-4 h-4" />}
              label="ZOOM"
            />
          </div>
        </ControlGroup>

        {/* 3D PROJECTION MODES */}
        <ControlGroup title="PROJECTION GEOMETRY">
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {projectionModes.map((pm) => {
              const active = settings.projectionMode === pm.mode;
              return (
                <button
                  key={pm.mode}
                  type="button"
                  onClick={() => handleProjectionChange(pm.mode)}
                  className={`py-1.5 px-1 rounded border text-[9px] font-mono transition flex flex-col items-center justify-center gap-1 ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold shadow-[0_0_12px_rgba(0,255,255,0.25)]'
                      : 'border-cyan-500/25 bg-slate-800/40 text-cyan-400/70 hover:bg-cyan-500/10'
                  }`}
                >
                  {pm.icon}
                  {pm.label}
                </button>
              );
            })}
          </div>

          {/* Conditional Sliders based on Mode */}
          {settings.projectionMode === 'exploded' && (
            <Slider
              label="Spread"
              value={settings.explodedSpread}
              min={0.2}
              max={3.0}
              step={0.1}
              onChange={(v) => update('explodedSpread', v)}
            />
          )}

          {settings.projectionMode === 'curved' && (
            <Slider
              label="Curvature"
              value={settings.curveIntensity}
              min={0.1}
              max={1.5}
              step={0.05}
              onChange={(v) => update('curveIntensity', v)}
            />
          )}

          {settings.projectionMode !== 'flat' && settings.projectionMode !== 'exploded' && (
            <>
              {/* Quick Depth Presets */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                {[
                  { label: 'LIGHT', val: 0.6 },
                  { label: 'MED', val: 1.2 },
                  { label: 'DEEP', val: 1.8 },
                  { label: 'ULTRA', val: 2.6 },
                ].map((dp) => (
                  <button
                    key={dp.label}
                    onClick={() => {
                      jarvisAudio.playBeep('click');
                      update('depthIntensity', dp.val);
                    }}
                    className={`py-1 rounded text-[9px] font-mono border transition ${
                      Math.abs(settings.depthIntensity - dp.val) < 0.1
                        ? 'border-cyan-400 bg-cyan-500/30 text-cyan-100 font-bold'
                        : 'border-cyan-500/20 bg-slate-800/30 text-cyan-400/60 hover:bg-cyan-500/10'
                    }`}
                  >
                    {dp.label}
                  </button>
                ))}
              </div>

              <Slider
                label="Depth"
                value={settings.depthIntensity}
                min={0}
                max={3.0}
                step={0.05}
                onChange={(v) => update('depthIntensity', v)}
              />
            </>
          )}

          <Toggle
            label="Invert Depth Map"
            checked={settings.depthInvert}
            onChange={(checked) => {
              jarvisAudio.playBeep('toggle');
              update('depthInvert', checked);
            }}
          />

          {(settings.projectionMode === 'relief' || settings.projectionMode === 'curved') && (
            <Toggle
              label="Wireframe CAD Mesh"
              checked={settings.wireframe}
              onChange={(checked) => {
                jarvisAudio.playBeep('toggle');
                update('wireframe', checked);
              }}
            />
          )}
        </ControlGroup>

        {/* STARK COLOR THEMES */}
        <ControlGroup title="STARK COLOR PALETTES">
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {tintOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  jarvisAudio.playBeep('click');
                  update('tint', t.value);
                }}
                className={`py-1.5 px-1 rounded text-[9px] font-mono border transition flex items-center justify-center gap-1 ${
                  settings.tint === t.value
                    ? 'border-white/70 bg-cyan-500/30 text-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                    : 'border-cyan-500/30 text-cyan-400/70 hover:bg-cyan-500/10'
                }`}
                style={{
                  borderColor: settings.tint === t.value ? t.color : undefined,
                  color: settings.tint === t.value ? t.color : undefined,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1">
            {borderOptions.map((b) => (
              <button
                key={b.value}
                onClick={() => {
                  jarvisAudio.playBeep('click');
                  update('borderStyle', b.value as any);
                }}
                className={`py-1.5 rounded text-[10px] font-mono border transition ${
                  settings.borderStyle === b.value
                    ? 'border-white/50 bg-cyan-500/30 text-white font-bold'
                    : 'border-cyan-500/30 text-cyan-400/70 hover:bg-cyan-500/10'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* Display and FX */}
        <ControlGroup title="HOLOGRAPHIC EMISSION & SHADER FX">
          <Slider label="Glow" value={settings.glowIntensity} min={0} max={3} step={0.1} onChange={(v) => update('glowIntensity', v)} />
          <Slider label="Opacity" value={settings.opacity} min={0.1} max={1} step={0.05} onChange={(v) => update('opacity', v)} />
          <Slider label="Scan Lines" value={settings.scanIntensity} min={0} max={2} step={0.1} onChange={(v) => update('scanIntensity', v)} />
          <Slider label="Floor Grid" value={settings.gridVisibility} min={0} max={1} step={0.05} onChange={(v) => update('gridVisibility', v)} />
          <Slider label="Distortion" value={settings.distortion} min={0} max={1} step={0.05} onChange={(v) => update('distortion', v)} />
          <Slider label="Anim Speed" value={settings.animationSpeed} min={0} max={3} step={0.1} onChange={(v) => update('animationSpeed', v)} />
          <Toggle
            label="Quantum Particle Eddy"
            checked={settings.particleEffects}
            onChange={(checked) => {
              jarvisAudio.playBeep('toggle');
              update('particleEffects', checked);
            }}
          />
        </ControlGroup>

        {/* Preset quick switcher */}
        {onSelectPreset && (
          <ControlGroup title="STARK SCHEMATIC PRESETS">
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    jarvisAudio.playActivation();
                    onSelectPreset(p.path);
                  }}
                  className="px-2 py-1.5 rounded text-[10px] font-mono border border-cyan-500/20 bg-slate-800/40 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition truncate text-left flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </ControlGroup>
        )}

        {/* 3D Transform */}
        <ControlGroup title="COORDINATE TRANSFORM">
          <Slider label="Size" value={settings.hologramSize} min={0.2} max={3} step={0.1} onChange={(v) => update('hologramSize', v)} />
          <Slider label="Pos X" value={transform.position[0]} min={-5} max={5} step={0.1} onChange={(v) => updateTransform({ position: [v, transform.position[1], transform.position[2]] })} />
          <Slider label="Pos Y" value={transform.position[1]} min={-3} max={5} step={0.1} onChange={(v) => updateTransform({ position: [transform.position[0], v, transform.position[2]] })} />
          <Slider label="Pos Z" value={transform.position[2]} min={-3} max={3} step={0.1} onChange={(v) => updateTransform({ position: [transform.position[0], transform.position[1], v] })} />
          <Slider label="Rot X" value={transform.rotation[0]} min={-3.14} max={3.14} step={0.05} onChange={(v) => updateTransform({ rotation: [v, transform.rotation[1], transform.rotation[2]] })} />
          <Slider label="Rot Y" value={transform.rotation[1]} min={-3.14} max={3.14} step={0.05} onChange={(v) => updateTransform({ rotation: [transform.rotation[0], v, transform.rotation[2]] })} />
          <Slider label="Rot Z" value={transform.rotation[2]} min={-3.14} max={3.14} step={0.05} onChange={(v) => updateTransform({ rotation: [transform.rotation[0], transform.rotation[1], v] })} />
          <Slider label="Scale" value={transform.scale} min={0.2} max={5} step={0.1} onChange={(v) => updateTransform({ scale: v })} />
        </ControlGroup>

        <div className="mt-4 pt-3 border-t border-cyan-500/20 space-y-2">
          <button
            onClick={() => {
              jarvisAudio.playBeep('click');
              onSettingsChange(defaultSettings);
              onTransformChange(defaultTransform);
            }}
            className="w-full py-2 rounded border border-cyan-500/30 text-cyan-400 text-xs font-mono hover:bg-cyan-500/10 transition"
          >
            RESTORE DEFAULTS
          </button>
          <input
            ref={sidebarFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onImageUpload) {
                jarvisAudio.playActivation();
                const url = URL.createObjectURL(file);
                onImageUpload(url, file);
              }
            }}
          />
          {onImageUpload && (
            <button
              onClick={() => sidebarFileRef.current?.click()}
              className="w-full py-2 rounded border border-cyan-400/50 bg-cyan-950/40 text-cyan-200 text-xs font-mono hover:bg-cyan-500/20 transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,255,0.15)]"
            >
              <Upload className="w-3 h-3 text-cyan-300" /> UPLOAD NEW IMAGE
            </button>
          )}
          {onLoadNewImage && (
            <button
              onClick={() => {
                jarvisAudio.playBeep('click');
                onLoadNewImage();
              }}
              className="w-full py-2 rounded border border-cyan-500/30 text-cyan-400 text-xs font-mono hover:bg-cyan-500/10 transition flex items-center justify-center gap-1"
            >
              EXIT TO INTRO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded border text-xs font-mono transition flex items-center justify-center gap-1.5 ${
        active
          ? 'border-cyan-400 bg-cyan-500/25 text-cyan-100 shadow-[0_0_15px_rgba(0,255,255,0.25)] font-bold'
          : 'border-cyan-500/30 bg-slate-800/30 text-cyan-400/70 hover:bg-cyan-500/10'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] text-cyan-500/60 font-mono tracking-wider mb-2 font-semibold">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-14 text-[10px] text-cyan-400/80 font-mono">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
      <span className="w-10 text-[10px] text-cyan-300 font-mono text-right">{value.toFixed(2)}</span>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      {label && <span className="text-[10px] text-cyan-400/80 font-mono">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full p-0.5 transition duration-200 ease-in-out border ${
          checked ? 'bg-cyan-500/40 border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'bg-slate-800 border-slate-700'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full transition transform duration-200 ease-in-out ${
            checked ? 'translate-x-4 bg-cyan-300' : 'translate-x-0 bg-slate-500'
          }`}
        />
      </button>
    </div>
  );
}
