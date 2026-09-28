import React from 'react';
import { Trophy, RotateCcw, Wrench, Flame, Zap } from 'lucide-react';

interface RaceFinishModalProps {
  rank: number;
  finalTimeMs: number;
  driftScore: number;
  onRestart: () => void;
  onGarage: () => void;
}

export const RaceFinishModal: React.FC<RaceFinishModalProps> = ({
  rank,
  finalTimeMs,
  driftScore,
  onRestart,
  onGarage,
}) => {
  const formatTime = (ms: number) => {
    const totalSecs = ms / 1000;
    const mins = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    const m = Math.floor((totalSecs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
  };

  const isWinner = rank === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-zinc-950 border border-cyan-500/40 rounded-3xl p-8 shadow-2xl shadow-cyan-950/80 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-5">
          <Trophy className="w-10 h-10 text-zinc-950 fill-zinc-950" />
        </div>

        <h2 className="text-3xl font-black italic tracking-wide text-white uppercase">
          {isWinner ? '冠军冲线！VICTORY' : '比赛结束 RACE COMPLETED'}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          {isWinner ? '完美的过弯走线与极速漂移统治了赛道！' : '发挥出色，每一次漂移都在突破极限！'}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">最终名次 RANK</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">第 {rank} 名</div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">总用时 TIME</div>
            <div className="text-2xl font-mono font-black text-cyan-400 mt-0.5">{formatTime(finalTimeMs)}</div>
          </div>

          <div className="col-span-2 bg-gradient-to-r from-amber-950/40 to-zinc-900/80 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">漂移积分 DRIFT</div>
                <div className="text-lg font-black text-amber-300">{Math.round(driftScore)} PTS</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5" /> 获得改装代币 +500
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> 再战一局
          </button>
          <button
            onClick={onGarage}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Wrench className="w-4 h-4" /> 返回车库
          </button>
        </div>
      </div>
    </div>
  );
};
