import React, { useState } from 'react';
import { Volume2, VolumeX, Flame, MapPin, ChevronDown } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { TrackId } from '../types/game';
import { TRACK_CONFIGS } from '../utils/track-builder';

interface NavbarProps {
  currentView: 'race' | 'garage' | 'multiplayer';
  onChangeView: (view: 'race' | 'garage' | 'multiplayer') => void;
  onOpenLeaderboard: () => void;
  onQuickRace: () => void;
  currentTrackId: TrackId;
  onSelectTrack: (trackId: TrackId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  onOpenLeaderboard,
  onQuickRace,
  currentTrackId,
  onSelectTrack,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const activeTrackConfig = TRACK_CONFIGS[currentTrackId] || TRACK_CONFIGS.cyber_neon;

  return (
    <header className="h-14 px-4 sm:px-6 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between z-30 shrink-0 select-none">
      {/* Zone 1: Brand & Track Selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChangeView('race')}
          className="font-['Orbitron'] text-base sm:text-lg font-black tracking-wider text-white hover:text-cyan-400 transition cursor-pointer"
        >
          APEX DRIFT
        </button>

        {/* Track Selection Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsTrackMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-cyan-400/50 text-xs font-medium text-zinc-200 transition"
            title="点击切换比赛赛道"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white max-w-[90px] sm:max-w-none truncate">{activeTrackConfig.name}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isTrackMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsTrackMenuOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-zinc-900 border border-white/15 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase px-2 py-1 tracking-wider">
                  切换比赛赛道
                </div>
                {(['cyber_neon', 'red_rock', 'alpine_peak'] as TrackId[]).map(tId => {
                  const cfg = TRACK_CONFIGS[tId];
                  const isSelected = currentTrackId === tId;
                  return (
                    <button
                      key={tId}
                      onClick={() => {
                        onSelectTrack(tId);
                        setIsTrackMenuOpen(false);
                        onChangeView('race');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between mt-1 ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                          : 'hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white">{cfg.name}</div>
                        <div className="text-[10px] text-zinc-400">{cfg.subtitle}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-white/5 font-mono">
                        {cfg.difficulty}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide">
        <button
          onClick={() => onChangeView('race')}
          className={`transition-colors whitespace-nowrap ${
            currentView === 'race' ? 'text-cyan-400 border-b border-cyan-400 pb-0.5' : 'text-zinc-400 hover:text-white'
          }`}
        >
          极速赛道
        </button>
        <button
          onClick={() => onChangeView('garage')}
          className={`transition-colors whitespace-nowrap ${
            currentView === 'garage' ? 'text-cyan-400 border-b border-cyan-400 pb-0.5' : 'text-zinc-400 hover:text-white'
          }`}
        >
          改装工坊
        </button>
        <button
          onClick={() => onChangeView('multiplayer')}
          className={`transition-colors whitespace-nowrap ${
            currentView === 'multiplayer' ? 'text-cyan-400 border-b border-cyan-400 pb-0.5' : 'text-zinc-400 hover:text-white'
          }`}
        >
          多人联机
        </button>
        <button
          onClick={onOpenLeaderboard}
          className="text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
        >
          全球排行
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleToggleMute}
          title="开关音效"
          className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <button
          onClick={onQuickRace}
          className="px-3 sm:px-4 py-2 text-xs font-['Orbitron'] font-black text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition shadow-md shadow-cyan-400/20 whitespace-nowrap active:scale-95 flex items-center gap-1.5"
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          即刻竞速
        </button>
      </div>
    </header>
  );
};
