export type CarModelId =
  | 'ferrari_sf90'
  | 'lambo_urus'
  | 'pagani_zonda'
  | 'xiaomi_su7'
  | 'apollo_ie'
  | 'lambo_revuelto'
  | 'porsche_911_gt3'
  | 'monza_f1';

export interface CarSpecs {
  id: CarModelId;
  name: string;
  category: string;
  tagline: string;
  baseTopSpeed: number; // km/h
  baseAcceleration: number; // 0-100s equivalent
  baseHandling: number; // 1-100
  baseNitro: number; // 1-100
  description: string;
}

export interface CarCustomization {
  modelId: CarModelId;
  paintColor: string; // hex
  finish: 'metallic' | 'matte' | 'gloss' | 'pearl';
  livery: 'clean' | 'racing_stripes' | 'cyber_hex' | 'flame_drift' | 'carbon_hood';
  liveryColor: string;
  spoiler: 'none' | 'ducktail' | 'gt_wing' | 'carbon_fin';
  rimStyle: 'sport_5spoke' | 'aero_turbofan' | 'mesh_bbs' | 'gold_star';
  rimColor: string;
  caliperColor: string;
  underglowColor: string; // 'none' or hex
  neonPulse: boolean;
  tuning: {
    engine: number; // 1-5 level
    transmission: number; // 1-5
    tires: number; // 1-5
    nitroBoost: number; // 1-5
    aeroBrakes: number; // 1-5
  };
}

export type TrackId = 'cyber_neon' | 'red_rock' | 'alpine_peak';

export interface TrackConfig {
  id: TrackId;
  name: string;
  subtitle: string;
  difficulty: '入门' | '中等' | '大师';
  laps: number;
  environment: 'cyberpunk_night' | 'desert_sunset' | 'snow_dusk';
  skyColorTop: string;
  skyColorBottom: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  trackLength: number; // meters
  turnsCount: number;
  bestLapTimeMs?: number;
}

export interface PlayerRivalData {
  id: string;
  name: string;
  carModel: CarModelId;
  paintColor: string;
  livery: string;
  spoiler: string;
  rims: string;
  underglow: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  speed: number;
  isDrifting: boolean;
  isNitro: boolean;
  lap: number;
  progress: number;
  isAI?: boolean;
}

export interface GameTelemetry {
  speed: number; // km/h
  rpm: number;
  gear: number | string;
  nitro: number; // 0-100
  driftScore: number;
  currentLap: number;
  totalLaps: number;
  lapTime: number; // seconds
  bestLapTime: number; // seconds
  position: number; // race rank e.g. 1st, 2nd
  totalRacers: number;
  driftMultiplier: number;
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  trackId: TrackId;
  laps: number;
  maxPlayers: number;
  currentPlayers: number;
  status: 'lobby' | 'countdown' | 'racing' | 'finished';
  hostId: string;
}

export interface RoomPlayerInfo {
  id: string;
  name: string;
  carModel?: string;
  paintColor?: string;
  isReady: boolean;
}

export interface RoomPublicInfo {
  id: string;
  name: string;
  trackId: TrackId;
  laps: number;
  maxPlayers: number;
  currentPlayers: number;
  status: 'lobby' | 'countdown' | 'racing' | 'finished';
  hostId: string;
  players: RoomPlayerInfo[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  trackId: TrackId | string;
  lapTimeMs: number;
  carModel: string;
  topSpeedKmh: number;
  driftScore: number;
  date: string;
  tier: string;
}
