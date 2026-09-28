import React from 'react';
import { GameTelemetry } from '../types/game';
import { Flame, Gauge, Zap, Trophy, Timer, Flag } from 'lucide-react';

interface HUDProps {
  telemetry: GameTelemetry;
  trackName: string;
}

export const HUD: React.FC<HUDProps> = ({ telemetry, trackName }) => {
  const speed = Math.round(telemetry.speed);
  const nitroPct = Math.round(telemetry.nitro);
  const rpmPct = Math.min(100, Math.round(telemetry.rpm * 100));

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans">
      {/* Top Bar: Lap, Position, Track, Lap Times */}
      <div className="absolute top-4 left-6 right-6 flex justify-between items-start">
        {/* Left: Position & Lap */}
        <div className="flex items-center gap-4">
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400">名次 POS</div>
              <div className="text-2xl font-black italic tracking-wider text-cyan-400">
                {telemetry.position} <span className="text-xs text-zinc-500">/ {telemetry.totalRacers}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md border border-zinc-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
            <Flag className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400">圈数 LAP</div>
              <div className="text-xl font-bold text-white">
                {telemetry.currentLap} <span className="text-xs text-zinc-500">/ {telemetry.totalLaps}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Track title & Drift Score */}
        <div className="flex flex-col items-center">
          <div className="text-xs uppercase tracking-widest text-cyan-400 font-semibold px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-cyan-500/20">
            {trackName}
          </div>

          {telemetry.driftScore > 0 && (
            <div className="mt-2 flex items-center gap-2 bg-gradient-to-r from-amber-500/80 to-rose-600/80 px-4 py-1.5 rounded-full border border-amber-300/40 shadow-lg shadow-amber-500/30 animate-pulse">
              <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span className="text-sm font-black tracking-wider text-white">
                漂移得分 +{Math.round(telemetry.driftScore)}
              </span>
              {telemetry.driftMultiplier > 1 && (
                <span className="text-xs bg-amber-300 text-amber-950 font-extrabold px-1.5 py-0.5 rounded">
                  x{telemetry.driftMultiplier.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Timers */}
        <div className="bg-black/60 backdrop-blur-md border border-zinc-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
          <Timer className="w-5 h-5 text-emerald-400" />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400">当前单圈 TIME</div>
            <div className="text-xl font-mono font-bold text-emerald-400">{formatTime(telemetry.lapTime)}</div>
            {telemetry.bestLapTime > 0 && (
              <div className="text-[10px] font-mono text-zinc-400">
                最佳 BEST: <span className="text-zinc-200">{formatTime(telemetry.bestLapTime)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Center / Right: Speedometer & Tachometer Gauge */}
      <div className="absolute bottom-6 right-8 flex items-end gap-5">
        {/* Nitro Tank Gauge */}
        <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3.5 flex flex-col items-center gap-2">
          <div className="text-[10px] font-bold tracking-wider text-cyan-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-cyan-400" /> N2O
          </div>
          <div className="w-4 h-32 bg-zinc-900 rounded-full border border-zinc-700 overflow-hidden relative flex flex-col justify-end p-0.5">
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                nitroPct > 20
                  ? 'bg-gradient-to-t from-cyan-500 to-emerald-400 shadow-md shadow-cyan-500/50'
                  : 'bg-rose-500 animate-pulse'
              }`}
              style={{ height: `${nitroPct}%` }}
            />
          </div>
          <div className="text-xs font-mono font-bold text-white">{nitroPct}%</div>
        </div>

        {/* Speedometer Cluster */}
        <div className="bg-black/80 backdrop-blur-lg border border-cyan-500/40 rounded-3xl p-5 shadow-2xl shadow-cyan-950/60 min-w-[210px]">
          {/* RPM Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[9px] text-zinc-400 mb-1 font-mono">
              <span>0</span>
              <span>4</span>
              <span>8</span>
              <span className="text-rose-500 font-bold">10K RPM</span>
            </div>
            <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden flex p-0.5 border border-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  rpmPct > 85
                    ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                    : rpmPct > 65
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${rpmPct}%` }}
              />
            </div>
          </div>

          {/* Speed & Gear */}
          <div className="flex items-baseline justify-between mt-1">
            <div className="flex items-baseline">
              <span className="text-6xl font-black italic tracking-tighter text-white font-mono">{speed}</span>
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold ml-2">KM/H</span>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl px-3 py-1 flex flex-col items-center">
              <span className="text-[8px] uppercase tracking-wider text-zinc-400">GEAR</span>
              <span className="text-xl font-black text-amber-400 font-mono">{telemetry.gear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Left: Controls Quick Guide */}
      <div className="absolute bottom-6 left-8 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-300 flex flex-col gap-1.5">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">驾驶操控 CONTROLS</div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] font-mono text-cyan-300 font-bold">
            W / ↑
          </kbd>
          <span>油门加速</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] font-mono text-cyan-300 font-bold">
            A / D / ← →
          </kbd>
          <span>转向</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] font-mono text-amber-300 font-bold">
            空格 SPACE
          </kbd>
          <span>手刹漂移</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] font-mono text-emerald-300 font-bold">
            SHIFT
          </kbd>
          <span>氮气加速 (N2O)</span>
        </div>
      </div>
    </div>
  );
};
