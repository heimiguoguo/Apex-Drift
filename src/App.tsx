import React, { useState, useEffect } from 'react';
import { CarCustomization, PlayerRivalData, TrackId } from './types/game';
import { Garage } from './components/Garage';
import { GameCanvas } from './components/GameCanvas';
import { RaceFinishModal } from './components/RaceFinishModal';
import { preloadAllRealCarModels } from './utils/gltf-car-loader';
import { Trophy, Wrench, Play, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { soundManager } from './utils/audio';

preloadAllRealCarModels();

const DEFAULT_CUSTOMIZATION: CarCustomization = {
  modelId: 'ferrari_sf90',
  paintColor: '#dc2626', // Rosso Corsa
  finish: 'metallic',
  livery: 'clean',
  liveryColor: '#ffffff',
  spoiler: 'gt_wing',
  rimStyle: 'sport_5spoke',
  rimColor: '#e4e4e7',
  caliperColor: '#ef4444',
  underglowColor: '#00f0ff',
  neonPulse: true,
  tuning: {
    engine: 3,
    transmission: 3,
    tires: 3,
    nitroBoost: 3,
    aeroBrakes: 3,
  },
};

export function App() {
  const [gameState, setGameState] = useState<'garage' | 'racing' | 'finished'>('garage');
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('cyber_neon');
  const [customization, setCustomization] = useState<CarCustomization>(DEFAULT_CUSTOMIZATION);
  const [isMuted, setIsMuted] = useState(false);

  // Race Results
  const [raceResult, setRaceResult] = useState<{ rank: number; finalTimeMs: number; driftScore: number } | null>(null);

  // AI Rivals on Track with Real Supercar Models
  const [aiRivals, setAiRivals] = useState<PlayerRivalData[]>([]);

  useEffect(() => {
    const ais: PlayerRivalData[] = [
      {
        id: 'ai-1',
        name: 'Lambo_Urus_Pro',
        carModel: 'lambo_urus',
        paintColor: '#f59e0b',
        livery: 'clean',
        spoiler: 'ducktail',
        rims: 'mesh_bbs',
        underglow: '#f59e0b',
        position: { x: 3, y: 0.42, z: -8 },
        rotationY: 0,
        speed: 55,
        isDrifting: false,
        isNitro: false,
        lap: 1,
        progress: 0.005,
        isAI: true,
      },
      {
        id: 'ai-2',
        name: 'Pagani_Zonda_R',
        carModel: 'pagani_zonda',
        paintColor: '#a855f7',
        livery: 'racing_stripes',
        spoiler: 'gt_wing',
        rims: 'aero_turbofan',
        underglow: '#a855f7',
        position: { x: -3, y: 0.42, z: -16 },
        rotationY: 0,
        speed: 53,
        isDrifting: false,
        isNitro: false,
        lap: 1,
        progress: 0.008,
        isAI: true,
      },
      {
        id: 'ai-3',
        name: 'Xiaomi_SU7_Ultra',
        carModel: 'xiaomi_su7',
        paintColor: '#f59e0b',
        livery: 'clean',
        spoiler: 'gt_wing',
        rims: 'sport_5spoke',
        underglow: '#00f0ff',
        position: { x: 0, y: 0.42, z: -24 },
        rotationY: 0,
        speed: 59,
        isDrifting: false,
        isNitro: false,
        lap: 1,
        progress: 0.012,
        isAI: true,
      },
      {
        id: 'ai-4',
        name: 'Apollo_IE_Hyper',
        carModel: 'apollo_ie',
        paintColor: '#dc2626',
        livery: 'clean',
        spoiler: 'carbon_fin',
        rims: 'gold_star',
        underglow: '#ff0077',
        position: { x: 2.5, y: 0.42, z: -32 },
        rotationY: 0,
        speed: 57,
        isDrifting: false,
        isNitro: false,
        lap: 1,
        progress: 0.016,
        isAI: true,
      },
    ];
    setAiRivals(ais);
  }, []);

  const handleStartRace = () => {
    soundManager.userGesture();
    setGameState('racing');
  };

  const handleRaceFinished = (finalTimeMs: number, driftScore: number, rank: number) => {
    setRaceResult({ rank, finalTimeMs, driftScore });
    setGameState('finished');
  };

  const toggleSound = () => {
    soundManager.userGesture();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden select-none font-sans">
      {/* Sound Mute Toggle Button */}
      <button
        onClick={toggleSound}
        className="absolute top-6 right-6 z-50 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl border border-zinc-700/60 backdrop-blur-md transition-all cursor-pointer shadow-lg"
        title={isMuted ? '开启声音' : '静音'}
      >
        {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
      </button>

      {/* Main Game State Routing */}
      {gameState === 'garage' && (
        <Garage
          customization={customization}
          onChange={setCustomization}
          onStartRace={handleStartRace}
        />
      )}

      {gameState === 'racing' && (
        <GameCanvas
          trackId={selectedTrack}
          playerCar={customization}
          playerName="Player_1"
          rivals={aiRivals}
          totalLaps={2}
          onRaceFinished={handleRaceFinished}
        />
      )}

      {/* Race Finished Result Overlay */}
      {gameState === 'finished' && raceResult && (
        <RaceFinishModal
          rank={raceResult.rank}
          finalTimeMs={raceResult.finalTimeMs}
          driftScore={raceResult.driftScore}
          onRestart={() => {
            soundManager.userGesture();
            setGameState('racing');
          }}
          onGarage={() => {
            soundManager.userGesture();
            setGameState('garage');
          }}
        />
      )}
    </div>
  );
}
export default App;
