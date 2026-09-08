import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Terminal, ChevronRight, Scan, Boxes, Flame, Sliders } from 'lucide-react';
import HologramCanvas, { HologramCanvasRef } from './components/HologramCanvas';
import HologramControls from './components/HologramControls';
import UploadArea from './components/UploadArea';
import HUD from './components/HUD';
import { HologramSettings, HologramTransform, defaultSettings, defaultTransform } from './lib/types';
import { jarvisAudio } from './lib/jarvisAudio';
import './App.css';

export default function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [workspaceActive, setWorkspaceActive] = useState(false);
  const [settings, setSettings] = useState<HologramSettings>(defaultSettings);
  const [transform, setTransform] = useState<HologramTransform>(defaultTransform);
  const [tool, setTool] = useState<'rotate' | 'move' | 'scale' | 'zoom'>('rotate');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const canvasRef = useRef<HologramCanvasRef>(null);
  const fileRef = useRef<File | null>(null);

  const handleImageUpload = useCallback((url: string, file: File) => {
    jarvisAudio.playActivation();
    setPreviewUrl(url);
    setImageUrl(url);
    fileRef.current = file;
    setWorkspaceActive(true);
  }, []);

  const handleSelectPresetUrl = useCallback((url: string) => {
    jarvisAudio.playActivation();
    setPreviewUrl(url);
    setImageUrl(url);
    fileRef.current = null;
    setWorkspaceActive(true);
  }, []);

  const handleSelectPresetInWorkspace = useCallback((url: string) => {
    jarvisAudio.playActivation();
    setImageUrl(url);
    setPreviewUrl(url);
  }, []);

  const handleClearPreview = useCallback(() => {
    jarvisAudio.playBeep('click');
    setPreviewUrl(null);
    if (imageUrl && imageUrl === previewUrl) {
      setImageUrl(null);
    }
    setWorkspaceActive(false);
    fileRef.current = null;
  }, [imageUrl, previewUrl]);

  const handleEnterWorkspace = useCallback(() => {
    if (imageUrl) {
      jarvisAudio.playActivation();
      setWorkspaceActive(true);
    }
  }, [imageUrl]);

  const handleReset = useCallback(() => {
    jarvisAudio.playBeep('click');
    setTransform(defaultTransform);
    setSettings(defaultSettings);
  }, []);

  const handleFullscreen = useCallback(() => {
    jarvisAudio.playBeep('click');
    canvasRef.current?.toggleFullscreen();
  }, []);

  const handleCaptureSnapshot = useCallback(() => {
    jarvisAudio.playBeep('click');
    canvasRef.current?.captureSnapshot();
  }, []);

  const toggleControls = useCallback(() => {
    jarvisAudio.playBeep('click');
    setShowControls((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-50 relative selection:bg-cyan-500/30 selection:text-cyan-100">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/15 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="fixed inset-0 holographic-grid pointer-events-none opacity-30" />
      
      {/* HUD Overlay with mode prop */}
      {!isFullscreen && <HUD workspaceActive={workspaceActive} />}

      <main className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!workspaceActive ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full pt-16 sm:pt-20 pb-12"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs sm:text-sm font-mono mb-4 shadow-[0_0_25px_rgba(0,255,255,0.15)] backdrop-blur-sm"
                >
                  <Flame className="w-4 h-4 animate-pulse text-amber-400" />
                  STARK J.A.R.V.I.S. 3D HOLOGRAPHIC SUITE
                </motion.div>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.2em] mb-3 text-transparent bg-clip-text bg-gradient-to-br from-cyan-200 via-teal-200 to-blue-400 drop-shadow-[0_0_25px_rgba(0,255,255,0.3)]">
                  HANK
                </h1>
                <p className="text-cyan-400/80 text-xs sm:text-sm font-light tracking-[0.2em] max-w-lg mx-auto uppercase">
                  MANIPULATE, DECONSTRUCT & SCAN ANY IMAGE IN 3D HOLOGRAPHIC SPACE
                </p>
              </div>

              <UploadArea
                onImageUpload={handleImageUpload}
                previewUrl={previewUrl}
                onClearPreview={handleClearPreview}
                onEnterWorkspace={handleEnterWorkspace}
                onSelectPresetUrl={handleSelectPresetUrl}
              />

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-4xl w-full">
                <FeatureCard icon={<Scan className="w-4 h-4" />} title="EXPLODE & DECONSTRUCT" desc="Pull apart image layers in 3D along the Z-axis with Stark laser guide vectors." />
                <FeatureCard icon={<Boxes className="w-4 h-4" />} title="ORBITAL GYROSCOPES" desc="Interact with 3D Stark Arc reticles and rotating gyroscopic telemetry rings." />
                <FeatureCard icon={<Terminal className="w-4 h-4" />} title="CAD LASER SCAN" desc="Perform live holographic planar diagnostic sweeps with authentic J.A.R.V.I.S. sound fx." />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className={`flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-4 ${
                isFullscreen ? 'fixed inset-0 z-50 p-0 m-0 w-screen h-screen' : 'h-screen pt-16 sm:pt-18'
              }`}
            >
              {/* 3D Hologram Canvas Area */}
              <div className="flex-1 relative min-h-[50vh] lg:min-h-0 h-full w-full">
                <HologramCanvas
                  ref={canvasRef}
                  imageUrl={imageUrl}
                  settings={settings}
                  transform={transform}
                  onTransformChange={setTransform}
                  tool={tool}
                  isFullscreen={isFullscreen}
                  setIsFullscreen={setIsFullscreen}
                  showControls={showControls}
                  onToggleControls={toggleControls}
                  onImageUpload={handleImageUpload}
                  onSettingsChange={setSettings}
                />
              </div>

              {/* Hologram Controls Sidebar / Floating Overlay */}
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className={
                      isFullscreen
                        ? 'absolute top-16 right-4 bottom-4 z-50 w-84 max-w-[calc(100vw-2rem)]'
                        : 'w-full lg:w-80 shrink-0 h-full'
                    }
                  >
                    <HologramControls
                      settings={settings}
                      onSettingsChange={setSettings}
                      transform={transform}
                      onTransformChange={setTransform}
                      tool={tool}
                      onToolChange={setTool}
                      onReset={handleReset}
                      onFullscreen={handleFullscreen}
                      isFullscreen={isFullscreen}
                      onCloseControls={isFullscreen ? toggleControls : undefined}
                      onLoadNewImage={() => {
                        jarvisAudio.playBeep('click');
                        setWorkspaceActive(false);
                      }}
                      onImageUpload={handleImageUpload}
                      onCapture={handleCaptureSnapshot}
                      onSelectPreset={handleSelectPresetInWorkspace}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating button to open controls if hidden in normal or fullscreen mode */}
              {!showControls && (
                <button
                  onClick={toggleControls}
                  className="fixed bottom-5 right-5 z-40 px-3.5 py-2 rounded-xl border border-cyan-400/50 bg-slate-900/90 hover:bg-cyan-950 text-cyan-200 text-xs font-mono font-bold tracking-wider shadow-[0_0_20px_rgba(0,255,255,0.3)] backdrop-blur-md flex items-center gap-2 transition"
                >
                  <Sliders className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>SHOW CONTROLS</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group p-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 hover:bg-cyan-950/40 hover:border-cyan-400/50 transition duration-300 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg border border-cyan-500/30 bg-cyan-950/50 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition shadow-[0_0_10px_rgba(0,255,255,0.15)]">
          {icon}
        </div>
        <h3 className="text-cyan-200 text-xs font-mono tracking-wider font-semibold">{title}</h3>
      </div>
      <p className="text-cyan-400/70 text-xs leading-relaxed pl-11">{desc}</p>
      <ChevronRight className="w-3.5 h-3.5 text-cyan-500/30 mt-2.5 group-hover:text-cyan-300 transition ml-auto" />
    </div>
  );
}
