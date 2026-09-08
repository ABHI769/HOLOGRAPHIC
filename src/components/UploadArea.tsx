import { useState, useRef, useCallback } from 'react';
import { Upload, ImageIcon, X, Check, Sparkles, Cpu, Shield, Zap, Box } from 'lucide-react';

interface UploadAreaProps {
  onImageUpload: (url: string, file: File) => void;
  previewUrl: string | null;
  onClearPreview: () => void;
  onEnterWorkspace: () => void;
  onSelectPresetUrl?: (url: string, name: string) => void;
}

const PRESET_CARDS = [
  {
    id: 'reactor',
    name: 'QUANTUM CORE',
    subtitle: 'ARC Fusion Reactor',
    path: '/presets/reactor-core.svg',
    icon: <Zap className="w-4 h-4 text-cyan-300" />,
  },
  {
    id: 'skull',
    name: 'CYBER SKULL',
    subtitle: 'Cranial Telemetry MK-VIII',
    path: '/presets/cyber-skull.svg',
    icon: <Shield className="w-4 h-4 text-cyan-300" />,
  },
  {
    id: 'mecha',
    name: 'MECHA AVATAR',
    subtitle: 'Neural Link Visor',
    path: '/presets/mecha-android.svg',
    icon: <Cpu className="w-4 h-4 text-cyan-300" />,
  },
  {
    id: 'cube',
    name: '4D TESSERACT',
    subtitle: 'Non-Euclidean Matrix',
    path: '/presets/quantum-cube.svg',
    icon: <Box className="w-4 h-4 text-cyan-300" />,
  },
];

export default function UploadArea({
  onImageUpload,
  previewUrl,
  onClearPreview,
  onEnterWorkspace,
  onSelectPresetUrl,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setFileName(file.name);
      onImageUpload(url, file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChoosePreset = (path: string, name: string) => {
    setFileName(name);
    if (onSelectPresetUrl) {
      onSelectPresetUrl(path, name);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-light tracking-[0.3em] text-cyan-300 mb-2">
          PROJECT IMAGE IN 3D HOLOGRAM
        </h2>
        <p className="text-cyan-500/70 text-sm font-mono">
          DROP ANY IMAGE TO INSTANTLY PROJECT IN VOLUMETRIC 3D
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 group cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_60px_rgba(0,255,255,0.3)]'
            : 'border-cyan-500/40 bg-slate-900/40 hover:border-cyan-400/80 hover:bg-slate-800/50 shadow-[0_0_30px_rgba(0,255,255,0.05)]'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full border border-cyan-500/30 bg-cyan-950/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,255,0.15)] group-hover:scale-110 transition">
            <Upload className="w-8 h-8 text-cyan-300" />
          </div>
          <div className="text-center">
            <p className="text-cyan-100 font-medium text-sm mb-1 tracking-wide">
              {isDragging ? 'RELEASE TO PROJECT 3D HOLOGRAM' : 'DRAG & DROP IMAGE HERE'}
            </p>
            <p className="text-cyan-400/70 text-xs font-mono">
              INSTANT 3D HOLOGRAPHIC VIEW • JPG, PNG, WEBP, GIF, SVG
            </p>
          </div>
        </div>
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-cyan-500/50" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-cyan-500/50" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-cyan-500/50" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-cyan-500/50" />
      </div>

      {/* Preset Cards */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3 text-cyan-400/80 text-xs font-mono tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span>QUICK DEMO PRESETS (ONE-CLICK TO TEST)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_CARDS.map((p) => {
            const isSelected = previewUrl === p.path;
            return (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoosePreset(p.path, p.name);
                }}
                className={`p-2.5 rounded-xl border text-left transition duration-200 flex flex-col gap-2 group relative overflow-hidden ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_20px_rgba(0,255,255,0.25)]'
                    : 'border-cyan-500/25 bg-slate-900/50 hover:bg-cyan-950/30 hover:border-cyan-400/60'
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden border border-cyan-500/20 bg-slate-950/90 relative flex items-center justify-center p-2">
                  <img
                    src={p.path}
                    alt={p.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-slate-900/80 border border-cyan-500/40 flex items-center justify-center">
                    {p.icon}
                  </div>
                </div>
                <div>
                  <div className="text-cyan-200 font-mono text-[11px] font-bold tracking-wider truncate">
                    {p.name}
                  </div>
                  <div className="text-cyan-500/60 font-mono text-[9px] truncate">
                    {p.subtitle}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">
                    ACTIVE
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {previewUrl && (
        <div className="mt-6 rounded-xl border border-cyan-500/40 bg-slate-900/80 p-4 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,255,0.15)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono tracking-wider">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>SELECTED: {fileName || 'HOLOGRAM SOURCE'}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearPreview();
                setFileName(null);
              }}
              className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 transition"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative aspect-video max-h-52 rounded-lg overflow-hidden border border-cyan-500/30 flex items-center justify-center bg-slate-950">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none border border-cyan-400/20" />
          </div>
          <button
            onClick={onEnterWorkspace}
            className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/30 via-cyan-400/30 to-blue-500/30 border border-cyan-400/60 text-cyan-100 font-mono tracking-widest hover:bg-cyan-400/40 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Check className="w-4 h-4 text-cyan-300" />
            INITIALIZE 3D HOLOGRAM
          </button>
        </div>
      )}
    </div>
  );
}
