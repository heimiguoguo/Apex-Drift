import * as THREE from 'three';
import { TrackConfig, TrackId } from '../types/game';

export const TRACK_CONFIGS: Record<TrackId, TrackConfig> = {
  cyber_neon: {
    id: 'cyber_neon',
    name: '赛博霓虹大都市 (Neo Tokyo)',
    subtitle: '雨夜反光沥青与全息流光隧道',
    difficulty: '入门',
    laps: 2,
    environment: 'cyberpunk_night',
    skyColorTop: '#050510',
    skyColorBottom: '#180033',
    fogColor: '#09081a',
    fogNear: 60,
    fogFar: 380,
    trackLength: 1250,
    turnsCount: 14,
  },
  red_rock: {
    id: 'red_rock',
    name: '赤岩峡谷巨石弯 (Red Rock Valley)',
    subtitle: '落日熔金悬崖、高速S弯与沙尘漫卷',
    difficulty: '中等',
    laps: 2,
    environment: 'desert_sunset',
    skyColorTop: '#4a1505',
    skyColorBottom: '#d97706',
    fogColor: '#78350f',
    fogNear: 80,
    fogFar: 420,
    trackLength: 1420,
    turnsCount: 18,
  },
  alpine_peak: {
    id: 'alpine_peak',
    name: '极峰阿尔卑斯 (Alpine Frost)',
    subtitle: '连续发卡弯、雪峰回响与极限下坡',
    difficulty: '大师',
    laps: 2,
    environment: 'snow_dusk',
    skyColorTop: '#0f172a',
    skyColorBottom: '#38bdf8',
    fogColor: '#1e293b',
    fogNear: 50,
    fogFar: 360,
    trackLength: 1680,
    turnsCount: 22,
  },
};

export interface BuiltTrack {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  checkpoints: THREE.Vector3[];
  startPosition: THREE.Vector3;
  startRotationY: number;
  trackWidth: number;
  getTrackPoint: (progress: number) => { position: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3 };
  getClosestProgress: (pos: THREE.Vector3) => number;
}

export function buildTrack(trackId: TrackId): BuiltTrack {
  const group = new THREE.Group();

  let rawPoints: [number, number, number][] = [];
  if (trackId === 'cyber_neon') {
    rawPoints = [
      [0, 0, 0],
      [0, 0, -120],
      [-40, 0, -220],
      [-120, 0, -280],
      [-240, 0, -260],
      [-290, 0, -180],
      [-260, 0, -80],
      [-160, 0, -40],
      [-120, 0, 60],
      [-80, 0, 160],
      [-20, 0, 240],
      [80, 0, 280],
      [180, 0, 240],
      [240, 0, 140],
      [220, 0, 20],
      [140, 0, -40],
      [50, 0, -20],
    ];
  } else if (trackId === 'red_rock') {
    rawPoints = [
      [0, 0, 0],
      [20, 0, -140],
      [100, 2, -260],
      [220, 5, -290],
      [310, 8, -200],
      [290, 6, -60],
      [190, 3, 30],
      [120, 0, 160],
      [50, -2, 260],
      [-80, -3, 310],
      [-210, 0, 260],
      [-280, 4, 140],
      [-250, 6, -20],
      [-160, 3, -120],
      [-60, 0, -60],
    ];
  } else {
    // Alpine Frost
    rawPoints = [
      [0, 0, 0],
      [-30, 0, -100],
      [-100, 4, -180],
      [-80, 8, -280],
      [20, 14, -320],
      [140, 18, -270],
      [180, 15, -160],
      [100, 10, -80],
      [40, 6, 20],
      [120, 4, 140],
      [160, 0, 240],
      [80, -3, 310],
      [-40, -4, 280],
      [-140, -2, 180],
      [-180, 0, 80],
      [-120, 0, 10],
    ];
  }

  const vPoints = rawPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(vPoints, true, 'catmullrom', 0.5);

  const trackWidth = 14;
  const segments = 320;
  const points = curve.getSpacedPoints(segments);

  // Build high-traction road ribbon geometry
  const roadGeom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const p = points[i % segments];
    const nextP = points[(i + 1) % segments];
    const tangent = new THREE.Vector3().subVectors(nextP, p).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const leftEdge = p.clone().addScaledVector(right, -trackWidth / 2);
    const rightEdge = p.clone().addScaledVector(right, trackWidth / 2);

    positions.push(leftEdge.x, leftEdge.y, leftEdge.z);
    positions.push(rightEdge.x, rightEdge.y, rightEdge.z);

    uvs.push(0, i * 0.2);
    uvs.push(1, i * 0.2);

    normals.push(0, 1, 0, 0, 1, 0);
  }

  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
    const i2 = i * 2;
    indices.push(i2, i2 + 1, i2 + 2);
    indices.push(i2 + 1, i2 + 3, i2 + 2);
  }

  roadGeom.setIndex(indices);
  roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

  // Procedural asphalt canvas texture
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 512;
  const ctx = roadCanvas.getContext('2d')!;
  ctx.fillStyle = trackId === 'alpine_peak' ? '#182028' : '#141416';
  ctx.fillRect(0, 0, 512, 512);

  // Rumble curbs (red & white edges)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 32, 512);
  ctx.fillRect(480, 0, 32, 512);
  ctx.fillStyle = '#f8fafc';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(0, y, 32, 32);
    ctx.fillRect(480, y, 32, 32);
  }

  // Dash lines in center
  ctx.fillStyle = '#e2e8f0';
  for (let y = 0; y < 512; y += 80) {
    ctx.fillRect(250, y, 12, 44);
  }

  const roadTex = new THREE.CanvasTexture(roadCanvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, segments / 4);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.75,
    metalness: 0.15,
  });

  const roadMesh = new THREE.Mesh(roadGeom, roadMat);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Start / Finish Line Banner Gantry
  const gantryP0 = points[0];
  const gantryP1 = points[1];
  const gantryTangent = new THREE.Vector3().subVectors(gantryP1, gantryP0).normalize();
  const gantryRight = new THREE.Vector3().crossVectors(gantryTangent, new THREE.Vector3(0, 1, 0)).normalize();

  const gantry = new THREE.Group();
  gantry.position.copy(gantryP0);

  const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
  const trussGeo = new THREE.BoxGeometry(trackWidth + 4, 1.2, 0.8);
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const postL = new THREE.Mesh(postGeo, gantryMat);
  postL.position.set(-gantryRight.x * (trackWidth / 2 + 1.5), 4, -gantryRight.z * (trackWidth / 2 + 1.5));
  const postR = new THREE.Mesh(postGeo, gantryMat);
  postR.position.set(gantryRight.x * (trackWidth / 2 + 1.5), 4, gantryRight.z * (trackWidth / 2 + 1.5));

  const crossbar = new THREE.Mesh(trussGeo, gantryMat);
  crossbar.position.set(0, 7.5, 0);
  crossbar.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), gantryRight);

  const neonBar = new THREE.Mesh(new THREE.BoxGeometry(trackWidth, 0.2, 0.2), neonMat);
  neonBar.position.set(0, 6.8, 0);
  neonBar.quaternion.copy(crossbar.quaternion);

  gantry.add(postL, postR, crossbar, neonBar);
  group.add(gantry);

  // Environment elements: Buildings, Rocks, or Snow Pines
  if (trackId === 'cyber_neon') {
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6, metalness: 0.4 });
    const windowMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const windowMatPink = new THREE.MeshBasicMaterial({ color: 0xff0077 });

    for (let i = 0; i < 40; i++) {
      const idx = Math.floor((i / 40) * segments);
      const p = points[idx];
      const side = i % 2 === 0 ? 1 : -1;
      const t = curve.getTangent(idx / segments);
      const r = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 1, 0)).normalize();

      const dist = trackWidth / 2 + 12 + Math.random() * 25;
      const bPos = p.clone().addScaledVector(r, side * dist);

      const h = 25 + Math.random() * 55;
      const w = 14 + Math.random() * 16;
      const bGeo = new THREE.BoxGeometry(w, h, w);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      bMesh.position.set(bPos.x, h / 2, bPos.z);
      group.add(bMesh);

      // Hologram billboard
      if (i % 3 === 0) {
        const signGeo = new THREE.PlaneGeometry(8, 4);
        const signMesh = new THREE.Mesh(signGeo, i % 2 === 0 ? windowMatCyan : windowMatPink);
        signMesh.position.set(bPos.x, 12, bPos.z);
        signMesh.lookAt(p.x, 12, p.z);
        group.add(signMesh);
      }
    }
  }

  // Checkpoints for lap tracking (16 evenly spaced points along curve)
  const checkpointsCount = 16;
  const checkpoints: THREE.Vector3[] = [];
  for (let i = 0; i < checkpointsCount; i++) {
    checkpoints.push(curve.getPoint(i / checkpointsCount));
  }

  const p0 = points[0];
  const p1 = points[1];
  const dir = new THREE.Vector3().subVectors(p1, p0).normalize();
  const startRotY = Math.atan2(dir.x, dir.z);

  return {
    group,
    curve,
    checkpoints,
    startPosition: p0.clone().setY(0.42),
    startRotationY: startRotY,
    trackWidth,
    getTrackPoint: (progress: number) => {
      const u = ((progress % 1) + 1) % 1;
      const pos = curve.getPoint(u);
      const tan = curve.getTangent(u);
      const norm = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      return { position: pos, tangent: tan, normal: norm };
    },
    getClosestProgress: (pos: THREE.Vector3) => {
      let minDst = Infinity;
      let bestU = 0;
      const sampleCount = 60;
      for (let i = 0; i < sampleCount; i++) {
        const u = i / sampleCount;
        const pt = curve.getPoint(u);
        const dst = pt.distanceToSquared(pos);
        if (dst < minDst) {
          minDst = dst;
          bestU = u;
        }
      }
      return bestU;
    },
  };
}
