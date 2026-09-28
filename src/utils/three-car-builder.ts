import * as THREE from 'three';
import { CarCustomization } from '../types/game';
import {
  createCustomizedRealCarInstance,
  onRealModelReady,
  preloadAllRealCarModels,
} from './gltf-car-loader';

preloadAllRealCarModels();

export interface BuiltCar {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheels: {
    frontLeft: THREE.Group | THREE.Object3D;
    frontRight: THREE.Group | THREE.Object3D;
    rearLeft: THREE.Group | THREE.Object3D;
    rearRight: THREE.Group | THREE.Object3D;
  };
  underglowLight: THREE.PointLight | null;
  exhaustPipes: THREE.Vector3[];
  updateSteering: (steerAngle: number) => void;
  updateWheelRotation: (distanceTraveled: number) => void;
}

function createContactShadow(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 128, 20, 64, 128, 110);
  gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(0.85, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 256);

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(2.4, 4.8);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.015;
  return mesh;
}

function createDetailedWheel(
  radius: number,
  width: number,
  rimColor: string,
  caliperColor: string,
  isFormula: boolean = false
): { group: THREE.Group; wheelMesh: THREE.Group } {
  const group = new THREE.Group();
  const wheelMesh = new THREE.Group();

  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.92,
    metalness: 0.08,
  });
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheelMesh.add(tire);

  const rotorRadius = radius * 0.72;
  const rotorGeo = new THREE.CylinderGeometry(rotorRadius, rotorRadius, 0.03, 20);
  rotorGeo.rotateZ(Math.PI / 2);
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0xa1a1aa,
    metalness: 0.95,
    roughness: 0.22,
  });
  const rotor = new THREE.Mesh(rotorGeo, rotorMat);
  wheelMesh.add(rotor);

  const caliperGeo = new THREE.BoxGeometry(0.08, radius * 0.42, radius * 0.45);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(caliperColor),
    metalness: 0.7,
    roughness: 0.25,
  });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, radius * 0.35, 0);
  group.add(caliper);

  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimColor),
    metalness: 0.92,
    roughness: 0.18,
  });
  const rimBarrelGeo = new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, width * 0.98, 24);
  rimBarrelGeo.rotateZ(Math.PI / 2);
  const rimBarrel = new THREE.Mesh(rimBarrelGeo, rimMat);
  wheelMesh.add(rimBarrel);

  const numSpokes = isFormula ? 10 : 5;
  for (let i = 0; i < numSpokes; i++) {
    const angle = (i / numSpokes) * Math.PI * 2;
    const spokeGeo = new THREE.BoxGeometry(width * 0.96, radius * 0.65, 0.04);
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.position.y = Math.cos(angle) * (radius * 0.35);
    spoke.position.z = Math.sin(angle) * (radius * 0.35);
    spoke.rotation.x = -angle;
    wheelMesh.add(spoke);
  }

  group.add(wheelMesh);
  return { group, wheelMesh };
}

export function buildCar(custom: CarCustomization): BuiltCar {
  const root = new THREE.Group();

  let underglowLight: THREE.PointLight | null = null;
  if (custom.underglowColor && custom.underglowColor !== 'none') {
    const neonColor = new THREE.Color(custom.underglowColor);
    underglowLight = new THREE.PointLight(neonColor, 4.5, 5.5);
    underglowLight.position.set(0, 0.15, 0);
    root.add(underglowLight);

    const stripGeo = new THREE.BoxGeometry(1.4, 0.02, 2.8);
    const stripMat = new THREE.MeshBasicMaterial({ color: neonColor });
    const stripMesh = new THREE.Mesh(stripGeo, stripMat);
    stripMesh.position.set(0, 0.1, 0);
    root.add(stripMesh);
  }

  root.add(createContactShadow());

  let activeSteerHandler: (steerAngle: number) => void = () => {};
  let activeWheelRotationHandler: (distanceDelta: number) => void = () => {};

  // 1. If authentic real model is ready in cache, mount immediately
  const realCarInstance = createCustomizedRealCarInstance(custom);
  if (realCarInstance) {
    root.add(realCarInstance.model);

    activeSteerHandler = (steerAngle: number) => {
      for (const w of realCarInstance.frontWheels) {
        w.rotation.y = steerAngle;
      }
    };

    activeWheelRotationHandler = (distanceDelta: number) => {
      const rot = distanceDelta / realCarInstance.wheelRadius;
      for (const w of realCarInstance.allWheels) {
        w.rotation.x += rot;
      }
    };

    return {
      root,
      bodyMesh: realCarInstance.bodyMesh,
      wheels: {
        frontLeft: realCarInstance.frontWheels[0] || new THREE.Group(),
        frontRight: realCarInstance.frontWheels[1] || new THREE.Group(),
        rearLeft: realCarInstance.allWheels[2] || new THREE.Group(),
        rearRight: realCarInstance.allWheels[3] || new THREE.Group(),
      },
      underglowLight,
      exhaustPipes: realCarInstance.exhaustPipes,
      updateSteering: (a) => activeSteerHandler(a),
      updateWheelRotation: (d) => activeWheelRotationHandler(d),
    };
  }

  // 2. Procedural car placeholder while real model GLB streams in
  const metalness = custom.finish === 'metallic' ? 0.88 : custom.finish === 'matte' ? 0.12 : 0.45;
  const roughness = custom.finish === 'metallic' ? 0.22 : custom.finish === 'matte' ? 0.88 : 0.15;
  const clearcoat = custom.finish === 'pearl' ? 1.0 : custom.finish === 'gloss' ? 0.9 : 0.25;

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(custom.paintColor),
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness: 0.08,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x111827,
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.75,
    transparent: true,
    opacity: 0.85,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.4,
    metalness: 0.6,
  });

  const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0033 });

  let mainBodyMesh: THREE.Mesh = new THREE.Mesh();
  const exhaustPipes: THREE.Vector3[] = [];

  const wheelRadius = custom.modelId === 'monza_f1' ? 0.38 : 0.36;
  const wheelWidth = custom.modelId === 'monza_f1' ? 0.36 : 0.28;
  const rimColor = custom.rimColor || '#e4e4e7';
  const caliperColor = custom.caliperColor || '#ef4444';

  const wFL = createDetailedWheel(wheelRadius, wheelWidth, rimColor, caliperColor, custom.modelId === 'monza_f1');
  const wFR = createDetailedWheel(wheelRadius, wheelWidth, rimColor, caliperColor, custom.modelId === 'monza_f1');
  const wRL = createDetailedWheel(wheelRadius, wheelWidth, rimColor, caliperColor, custom.modelId === 'monza_f1');
  const wRR = createDetailedWheel(wheelRadius, wheelWidth, rimColor, caliperColor, custom.modelId === 'monza_f1');

  switch (custom.modelId) {
    case 'porsche_911_gt3': {
      const bodyGeo = new THREE.BoxGeometry(1.86, 0.48, 4.4);
      mainBodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
      mainBodyMesh.position.y = 0.42;
      mainBodyMesh.castShadow = true;
      root.add(mainBodyMesh);

      const hoodGeo = new THREE.CylinderGeometry(0.92, 0.94, 1.4, 16);
      hoodGeo.rotateX(Math.PI / 2);
      hoodGeo.scale(1.9, 0.32, 1.0);
      const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
      hood.position.set(0, 0.38, 1.85);
      hood.castShadow = true;
      root.add(hood);

      const greenhouseGeo = new THREE.SphereGeometry(1.15, 16, 12);
      greenhouseGeo.scale(0.98, 0.42, 1.7);
      const greenhouse = new THREE.Mesh(greenhouseGeo, glassMaterial);
      greenhouse.position.set(0, 0.72, -0.2);
      root.add(greenhouse);

      const pHeadL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16), headlightMaterial);
      pHeadL.rotateX(Math.PI / 2);
      pHeadL.position.set(-0.64, 0.55, 2.12);
      const pHeadR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16), headlightMaterial);
      pHeadR.rotateX(Math.PI / 2);
      pHeadR.position.set(0.64, 0.55, 2.12);
      root.add(pHeadL, pHeadR);

      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.06, 0.48), carbonMaterial);
      wing.position.set(0, 1.35, -2.05);
      const swanL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), carbonMaterial);
      swanL.position.set(-0.48, 1.05, -2.0);
      const swanR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), carbonMaterial);
      swanR.position.set(0.48, 1.05, -2.0);
      root.add(wing, swanL, swanR);

      exhaustPipes.push(new THREE.Vector3(-0.12, 0.38, -2.25));
      exhaustPipes.push(new THREE.Vector3(0.12, 0.38, -2.25));
      break;
    }

    case 'monza_f1': {
      const f1ChassisGeo = new THREE.BoxGeometry(0.85, 0.42, 4.6);
      mainBodyMesh = new THREE.Mesh(f1ChassisGeo, bodyMaterial);
      mainBodyMesh.position.y = 0.32;
      mainBodyMesh.castShadow = true;
      root.add(mainBodyMesh);

      const noseGeo = new THREE.ConeGeometry(0.42, 1.8, 8);
      noseGeo.rotateX(Math.PI / 2);
      noseGeo.scale(1.0, 0.36, 1.0);
      const f1Nose = new THREE.Mesh(noseGeo, bodyMaterial);
      f1Nose.position.set(0, 0.28, 2.45);
      root.add(f1Nose);

      const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.55), carbonMaterial);
      frontWing.position.set(0, 0.15, 2.9);
      root.add(frontWing);

      const haloTorus = new THREE.TorusGeometry(0.28, 0.04, 8, 16, Math.PI);
      haloTorus.rotateX(Math.PI / 2);
      const halo = new THREE.Mesh(haloTorus, carbonMaterial);
      halo.position.set(0, 0.65, 0.1);
      root.add(halo);

      const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.4), carbonMaterial);
      rearWing.position.set(0, 1.05, -2.2);
      root.add(rearWing);

      exhaustPipes.push(new THREE.Vector3(0, 0.55, -2.1));
      break;
    }

    default: {
      const chassisGeo = new THREE.BoxGeometry(1.9, 0.46, 4.4);
      mainBodyMesh = new THREE.Mesh(chassisGeo, bodyMaterial);
      mainBodyMesh.position.y = 0.38;
      root.add(mainBodyMesh);

      const cabinGeo = new THREE.BoxGeometry(1.36, 0.44, 1.9);
      const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
      cabin.position.set(0, 0.74, -0.15);
      root.add(cabin);

      exhaustPipes.push(new THREE.Vector3(-0.25, 0.55, -2.25));
      exhaustPipes.push(new THREE.Vector3(0.25, 0.55, -2.25));
      break;
    }
  }

  const trackWidth = custom.modelId === 'monza_f1' ? 1.95 : 1.78;
  const wheelBase = custom.modelId === 'monza_f1' ? 2.8 : 2.65;

  wFL.group.position.set(-trackWidth / 2, wheelRadius, wheelBase / 2);
  wFR.group.position.set(trackWidth / 2, wheelRadius, wheelBase / 2);
  wRL.group.position.set(-trackWidth / 2, wheelRadius, -wheelBase / 2);
  wRR.group.position.set(trackWidth / 2, wheelRadius, -wheelBase / 2);

  root.add(wFL.group, wFR.group, wRL.group, wRR.group);

  activeSteerHandler = (steerAngle: number) => {
    wFL.group.rotation.y = steerAngle;
    wFR.group.rotation.y = steerAngle;
  };

  activeWheelRotationHandler = (distanceDelta: number) => {
    const rot = distanceDelta / wheelRadius;
    wFL.wheelMesh.rotation.x += rot;
    wFR.wheelMesh.rotation.x += rot;
    wRL.wheelMesh.rotation.x += rot;
    wRR.wheelMesh.rotation.x += rot;
  };

  // 3. Listen for real model ready -> hot swap in-place
  onRealModelReady(custom.modelId, () => {
    const realCar = createCustomizedRealCarInstance(custom);
    if (realCar) {
      while (root.children.length > 0) {
        root.remove(root.children[0]);
      }
      root.add(createContactShadow());
      root.add(realCar.model);
      if (underglowLight) root.add(underglowLight);

      activeSteerHandler = (steerAngle: number) => {
        for (const w of realCar.frontWheels) {
          w.rotation.y = steerAngle;
        }
      };

      activeWheelRotationHandler = (distanceDelta: number) => {
        const rot = distanceDelta / realCar.wheelRadius;
        for (const w of realCar.allWheels) {
          w.rotation.x += rot;
        }
      };
    }
  });

  return {
    root,
    bodyMesh: mainBodyMesh,
    wheels: {
      frontLeft: wFL.group,
      frontRight: wFR.group,
      rearLeft: wRL.group,
      rearRight: wRR.group,
    },
    underglowLight,
    exhaustPipes,
    updateSteering: (a) => activeSteerHandler(a),
    updateWheelRotation: (d) => activeWheelRotationHandler(d),
  };
}
