import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CarCustomization, GameTelemetry, PlayerRivalData, TrackId } from '../types/game';
import { buildCar, BuiltCar } from '../utils/three-car-builder';
import { buildTrack, BuiltTrack, TRACK_CONFIGS } from '../utils/track-builder';
import { soundManager } from '../utils/audio';
import { HUD } from './HUD';

interface GameCanvasProps {
  trackId: TrackId;
  playerCar: CarCustomization;
  playerName: string;
  rivals: PlayerRivalData[];
  onPlayerUpdate?: (data: {
    position: { x: number; y: number; z: number };
    rotationY: number;
    speed: number;
    isDrifting: boolean;
    isNitro: boolean;
    lap: number;
    progress: number;
  }) => void;
  onLapCompleted?: (lap: number, lapTimeMs: number) => void;
  onRaceFinished?: (finalTimeMs: number, driftScore: number, rank: number) => void;
  totalLaps?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  trackId,
  playerCar,
  rivals,
  onLapCompleted,
  onRaceFinished,
  totalLaps = 2,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speed: 0,
    rpm: 0,
    gear: 1,
    nitro: 100,
    driftScore: 0,
    currentLap: 1,
    totalLaps,
    lapTime: 0,
    bestLapTime: 0,
    position: 1,
    totalRacers: rivals.length + 1,
    driftMultiplier: 1,
  });

  const trackConfig = TRACK_CONFIGS[trackId];

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(trackConfig.skyColorTop);
    scene.fog = new THREE.FogExp2(trackConfig.fogColor, 0.0035);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Environment Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(40, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    // Build racetrack
    const track: BuiltTrack = buildTrack(trackId);
    scene.add(track.group);

    // Player car
    const playerBuilt: BuiltCar = buildCar(playerCar);
    scene.add(playerBuilt.root);

    // AI rivals
    const rivalCars: { data: PlayerRivalData; built: BuiltCar; progress: number }[] = [];
    rivals.forEach((r, idx) => {
      const built = buildCar({
        modelId: r.carModel,
        paintColor: r.paintColor,
        finish: 'metallic',
        livery: 'clean',
        liveryColor: '#ffffff',
        spoiler: 'gt_wing',
        rimStyle: 'sport_5spoke',
        rimColor: '#e4e4e7',
        caliperColor: '#ef4444',
        underglowColor: r.underglow || 'none',
        neonPulse: false,
        tuning: { engine: 4, transmission: 4, tires: 4, nitroBoost: 4, aeroBrakes: 4 },
      });
      scene.add(built.root);

      const offsetProgress = 0.005 + (idx + 1) * 0.008;
      rivalCars.push({ data: r, built, progress: offsetProgress });
    });

    // Exhaust flame particle meshes
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0 });
    const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), flameMat);
    flameL.rotateX(-Math.PI / 2);
    const flameR = flameL.clone();
    playerBuilt.root.add(flameL, flameR);

    // Player Physics States
    let playerPos = track.startPosition.clone();
    let playerHeading = track.startRotationY;
    let playerSpeed = 0; // m/s
    let playerProgress = 0;
    let currentLap = 1;
    let lapStartTime = performance.now();
    let bestLapMs = 0;
    let currentDriftScore = 0;
    let nitroAmount = 100;
    let isRaceFinished = false;

    // Input States
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      soundManager.userGesture();
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Game loop timing
    let lastTime = performance.now();
    let animId: number;

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isRaceFinished) {
        // Controls
        const isUp = keys['KeyW'] || keys['ArrowUp'];
        const isDown = keys['KeyS'] || keys['ArrowDown'];
        const isLeft = keys['KeyA'] || keys['ArrowLeft'];
        const isRight = keys['KeyD'] || keys['ArrowRight'];
        const isSpace = keys['Space'];
        const isShift = keys['ShiftLeft'] || keys['ShiftRight'];

        const maxSpeed = 75; // ~270 km/h
        const accelRate = 18;
        const brakeRate = 32;

        let isNitroActive = false;
        if (isShift && nitroAmount > 0 && playerSpeed > 5) {
          isNitroActive = true;
          nitroAmount = Math.max(0, nitroAmount - dt * 25);
          playerSpeed = Math.min(maxSpeed * 1.3, playerSpeed + accelRate * 1.8 * dt);
        } else {
          nitroAmount = Math.min(100, nitroAmount + dt * 4);
        }

        if (isUp) {
          playerSpeed = Math.min(maxSpeed, playerSpeed + accelRate * dt);
        } else if (isDown) {
          playerSpeed = Math.max(-10, playerSpeed - brakeRate * dt);
        } else {
          playerSpeed *= 0.985;
        }

        // Steering & Drift
        let steerAngle = 0;
        if (isLeft) steerAngle += 0.35;
        if (isRight) steerAngle -= 0.35;

        const isDrifting = isSpace && Math.abs(playerSpeed) > 10;
        const turnSpeed = isDrifting ? 2.4 : 1.8;

        if (steerAngle !== 0) {
          playerHeading += steerAngle * turnSpeed * dt * Math.sign(playerSpeed);
        }

        if (isDrifting) {
          currentDriftScore += Math.abs(playerSpeed) * dt * 15;
          soundManager.setDrifting(true);
        } else {
          soundManager.setDrifting(false);
        }

        soundManager.setNitro(isNitroActive);

        // Update Position
        const forward = new THREE.Vector3(Math.sin(playerHeading), 0, Math.cos(playerHeading));
        playerPos.addScaledVector(forward, playerSpeed * dt);

        playerBuilt.root.position.copy(playerPos);
        playerBuilt.root.rotation.y = playerHeading;

        playerBuilt.updateSteering(steerAngle);
        playerBuilt.updateWheelRotation(playerSpeed * dt);

        // Exhaust Flames
        if (isNitroActive) {
          flameMat.opacity = 0.85 + Math.random() * 0.15;
          if (playerBuilt.exhaustPipes.length >= 2) {
            flameL.position.copy(playerBuilt.exhaustPipes[0]);
            flameR.position.copy(playerBuilt.exhaustPipes[1]);
          }
        } else {
          flameMat.opacity = 0;
        }

        // Track Progress & Laps
        playerProgress = track.getClosestProgress(playerPos);

        const currentLapTimeSec = (now - lapStartTime) / 1000;
        if (playerProgress > 0.95 && !keys['lap_flag']) {
          keys['lap_flag'] = true;
        } else if (playerProgress < 0.05 && keys['lap_flag']) {
          keys['lap_flag'] = false;
          const lapMs = (now - lapStartTime);
          if (bestLapMs === 0 || lapMs < bestLapMs) bestLapMs = lapMs;
          if (onLapCompleted) onLapCompleted(currentLap, lapMs);
          soundManager.playLapBeep(currentLap >= totalLaps);

          if (currentLap >= totalLaps) {
            isRaceFinished = true;
            if (onRaceFinished) {
              onRaceFinished(now - lapStartTime, currentDriftScore, 1);
            }
          } else {
            currentLap++;
            lapStartTime = now;
          }
        }

        // AI Rivals movement along racetrack spline
        rivalCars.forEach((r, idx) => {
          const aiBaseSpeed = 0.016 + (idx * 0.002);
          r.progress = (r.progress + aiBaseSpeed * dt) % 1.0;
          const trackPt = track.getTrackPoint(r.progress);

          const laneOffset = (idx % 2 === 0 ? 1 : -1) * 2.8;
          const targetPos = trackPt.position.clone().addScaledVector(trackPt.normal, laneOffset);
          r.built.root.position.copy(targetPos);

          const rotY = Math.atan2(trackPt.tangent.x, trackPt.tangent.z);
          r.built.root.rotation.y = rotY;
          r.built.updateWheelRotation(30 * dt);
        });

        // Compute Race Rank
        let rank = 1;
        rivalCars.forEach((r) => {
          if (r.progress > playerProgress) rank++;
        });

        // Telemetry update
        const speedKmh = Math.abs(playerSpeed) * 3.6;
        const rpm = Math.min(1.0, (speedKmh % 60) / 60 + 0.15);
        const gear = speedKmh < 10 ? 1 : Math.min(7, Math.floor(speedKmh / 40) + 1);

        soundManager.updateEngine(rpm, speedKmh, isUp);

        setTelemetry({
          speed: speedKmh,
          rpm,
          gear,
          nitro: nitroAmount,
          driftScore: currentDriftScore,
          currentLap,
          totalLaps,
          lapTime: currentLapTimeSec,
          bestLapTime: bestLapMs / 1000,
          position: rank,
          totalRacers: rivals.length + 1,
          driftMultiplier: isDrifting ? 1.5 : 1,
        });

        // Smooth Chase Camera
        const camDistance = 6.2;
        const camHeight = 2.4;
        const targetCamPos = playerPos
          .clone()
          .sub(forward.clone().multiplyScalar(camDistance))
          .add(new THREE.Vector3(0, camHeight, 0));

        camera.position.lerp(targetCamPos, 0.12);
        camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [trackId, playerCar, rivals, totalLaps]);

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      <HUD telemetry={telemetry} trackName={trackConfig.name} />
    </div>
  );
};
