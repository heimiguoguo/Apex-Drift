import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Gauge, Calendar, Medal, RefreshCw, X, Play } from 'lucide-react';
import { LeaderboardEntry, TrackId } from '../types/game';
import { TRACK_CONFIGS } from '../utils/track-builder';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrackAndRace: (trackId: TrackId) => void;
}

function formatTime(ms: number): string {
  if (ms <= 0 || !isFinite(ms)) return '--:--.--';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  onSelectTrackAndRace,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<TrackId | 'all'>('cyber_neon');
  const [records, setRecords] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const url = selectedTrack === 'all' ? '/api/leaderboard' : `/api/leaderboard?trackId=${selectedTrack}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.records) {
        setRecords(data.records);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen, selectedTrack]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-zinc-900 border border-white/15 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Orbitron'] text-xl font-black text-white">全球玩家巅峰排行榜</h2>
              <p className="text-xs text-zinc-400">实时统计全球车手极限圈速与漂移神级纪录</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="刷新榜单"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Track Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-zinc-950/40 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'cyber_neon', label: '赛博霓虹之夜' },
            { id: 'red_rock', label: '烈日峡谷狂飙' },
            { id: 'alpine_peak', label: '雪峰极速山道' },
            { id: 'all', label: '全部纪录' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTrack(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedTrack === tab.id
                  ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Records Table / List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-24 text-center text-zinc-500 text-sm">正在同步全球车手成绩...</div>
          ) : records.length === 0 ? (
            <div className="py-24 text-center text-zinc-500 text-sm">暂无该赛道纪录，快去开创新奇迹！</div>
          ) : (
            records.map((item, index) => {
              const rank = index + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;
              const trackCfg = TRACK_CONFIGS[item.trackId as TrackId];

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                    isTop1
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : isTop2
                      ? 'bg-slate-800/40 border-slate-400/30'
                      : isTop3
                      ? 'bg-orange-950/20 border-orange-500/30'
                      : 'bg-zinc-800/30 border-white/5'
                  }`}
                >
                  {/* Left: Rank, Name, Tier, Car */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-['Orbitron'] font-black text-sm ${
                        isTop1
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                          : isTop2
                          ? 'bg-slate-300 text-zinc-950'
                          : isTop3
                          ? 'bg-amber-700 text-zinc-100'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.playerName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {item.tier || '宗师'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                        <span>车型: <strong className="text-zinc-200">{item.carModel}</strong></span>
                        {trackCfg && <span>赛道: {trackCfg.name}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right Telemetry: Lap Time, Speed, Drift */}
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-zinc-500 font-semibold uppercase">极速 / 漂移分</div>
                      <div className="text-xs text-zinc-300 flex items-center justify-end gap-2 font-mono">
                        <span>{item.topSpeedKmh} KM/H</span>
                        <span className="text-amber-400">+{item.driftScore}pt</span>
                      </div>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <div className="text-[10px] text-zinc-500 font-semibold uppercase">最速圈速</div>
                      <div className="font-['Orbitron'] text-base sm:text-lg font-black text-cyan-400 tabular-nums">
                        {formatTime(item.lapTimeMs)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Challenge CTA */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-400">选择心仪赛道，刷新全服传奇圈速记录！</span>
          <button
            onClick={() => {
              const target = selectedTrack === 'all' ? 'cyber_neon' : selectedTrack;
              onSelectTrackAndRace(target);
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-zinc-950 font-['Orbitron'] font-black text-xs transition active:scale-95 shadow-md shadow-cyan-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            向榜单发起挑战
          </button>
        </div>
      </div>
    </div>
  );
};
