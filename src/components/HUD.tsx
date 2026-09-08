import { useState, useEffect } from 'react';
import { Activity, Cpu, Radar, Box, Zap, Shield, Flame } from 'lucide-react';

interface HUDProps {
  workspaceActive?: boolean;
}

export default function HUD({ workspaceActive = false }: HUDProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTime(d.toTimeString().split(' ')[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Top Left Header */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-cyan-500/40 bg-slate-900/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.25)]">
            <Radar className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-400">
                HANK
              </h1>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                J.A.R.V.I.S. 3.0
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-cyan-500/70 font-mono tracking-widest uppercase">
              STARK HOLOGRAPHIC PROJECTION SUITE
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <StatusPill icon={<Activity className="w-3 h-3 text-cyan-400" />} label="SYS: ONLINE" />
          <StatusPill icon={<Flame className="w-3 h-3 text-amber-400" />} label="ARC CORE: 100%" />
          <StatusPill icon={<Cpu className="w-3 h-3 text-emerald-400" />} label="MATRIX: STABLE" />
        </div>
      </div>

      {/* Top Right Header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1.5 rounded border border-cyan-500/30 bg-slate-900/80 text-cyan-300 text-[11px] font-mono shadow-sm">
            <span className="text-cyan-500/60">SYS TIME:</span> {time || '00:00:00'}
          </div>
          <div className="px-2.5 py-1.5 rounded border border-cyan-500/30 bg-slate-900/80 text-cyan-300 text-[11px] font-mono shadow-sm">
            <span className="text-cyan-500/60">FPS:</span> 60
          </div>
        </div>
        <div className="hidden sm:block text-[10px] font-mono text-cyan-500/50">
          STARK INDUSTRIES // VOLUMETRIC ENGINE
        </div>
      </div>

      {/* Bottom Telemetry for Workspace Mode only */}
      {workspaceActive && (
        <>
          <div className="absolute bottom-4 left-4 hidden md:flex flex-col gap-1.5 pointer-events-auto">
            <MiniPanel icon={<Box className="w-3 h-3" />} label="PROJECTOR" value="ACTIVE" />
            <MiniPanel icon={<Zap className="w-3 h-3" />} label="EMISSION" value="VOLUMETRIC" />
            <MiniPanel icon={<Shield className="w-3 h-3" />} label="TELEMETRY" value="LOCKED" />
          </div>

          <div className="absolute bottom-4 right-4 max-w-xs text-right hidden lg:block">
            <p className="text-[10px] text-cyan-500/50 font-mono leading-relaxed bg-slate-950/60 p-2 rounded border border-cyan-500/20 backdrop-blur-sm">
              STARK HANK ENGINE // REAL-TIME 3D HOLOGRAPHIC VIEWPORT
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="px-2.5 py-1 rounded-full border border-cyan-500/30 bg-slate-900/80 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 shadow-sm">
      {icon}
      {label}
    </div>
  );
}

function MiniPanel({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-cyan-500/20 bg-slate-900/70 text-cyan-400 text-[10px] font-mono backdrop-blur-sm">
      {icon}
      <span className="text-cyan-500/60">{label}</span>
      <span className="text-cyan-200">{value}</span>
    </div>
  );
}
