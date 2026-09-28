import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CarCustomization, CarModelId } from '../types/game';

export interface RealCarInstance {
  model: THREE.Group;
  bodyMesh: THREE.Mesh;
  frontWheels: THREE.Object3D[];
  allWheels: THREE.Object3D[];
  exhaustPipes: THREE.Vector3[];
  wheelRadius: number;
}

const modelCache: Partial<Record<CarModelId, THREE.Group>> = {};
const loadingPromises: Partial<Record<CarModelId, Promise<THREE.Group>>> = {};
const listeners: Partial<Record<CarModelId, ((model: THREE.Group) => void)[]>> = {};

function getModelConfig(modelId: CarModelId): {
  url: string;
  targetLength: number;
  rotY: number;
  yOffset: number;
  paintMaterialNames: string[];
  rimMaterialNames: string[];
  caliperMaterialNames: string[];
  exhaustPipes: THREE.Vector3[];
  wheelRadius: number;
} | null {
  switch (modelId) {
    case 'ferrari_sf90':
      return {
        url: '/models/ferrari.glb',
        targetLength: 4.5,
        rotY: Math.PI,
        yOffset: 0.0,
        paintMaterialNames: ['Body_Color', 'Body'],
        rimMaterialNames: ['rim_fl', 'rim_fr', 'rim_rl', 'rim_rr', 'metal_chrome'],
        caliperMaterialNames: ['brakes', 'brake', 'Leather_red'],
        exhaustPipes: [new THREE.Vector3(-0.25, 0.58, -2.15), new THREE.Vector3(0.25, 0.58, -2.15)],
        wheelRadius: 0.36,
      };

    case 'lambo_urus':
    case 'lambo_revuelto':
      return {
        url: '/models/lamborghini.glb',
        targetLength: 4.75,
        rotY: Math.PI,
        yOffset: 0.72,
        paintMaterialNames: ['WhiteCar', 'Logo', 'Default_Material', 'Carpaint', 'body'],
        rimMaterialNames: ['Universal_Wheel', 'RimsChrome', 'Chrome', 'rim'],
        caliperMaterialNames: ['BreaksRedPaint', 'Universal_Caliper', 'caliper'],
        exhaustPipes: [
          new THREE.Vector3(-0.48, 0.52, -2.35),
          new THREE.Vector3(-0.35, 0.52, -2.35),
          new THREE.Vector3(0.35, 0.52, -2.35),
          new THREE.Vector3(0.48, 0.52, -2.35),
        ],
        wheelRadius: 0.38,
      };

    case 'pagani_zonda':
      return {
        url: '/models/pagani.glb',
        targetLength: 4.6,
        rotY: Math.PI,
        yOffset: 0.58,
        paintMaterialNames: ['Scene_-_Root', 'PaganiZonda__0', 'carpaint'],
        rimMaterialNames: ['rim'],
        caliperMaterialNames: ['caliper', 'brake'],
        exhaustPipes: [
          new THREE.Vector3(-0.08, 0.65, -2.25),
          new THREE.Vector3(0.08, 0.65, -2.25),
          new THREE.Vector3(-0.08, 0.55, -2.25),
          new THREE.Vector3(0.08, 0.55, -2.25),
        ],
        wheelRadius: 0.36,
      };

    case 'xiaomi_su7':
      return {
        url: '/models/su7.glb',
        targetLength: 4.7,
        rotY: 0,
        yOffset: 0.058,
        paintMaterialNames: ['untitledMAT_CarPaint_SU7_Base1', 'carpaint', 'body'],
        rimMaterialNames: ['untitledMAT_Tire_Hub_127', 'hub', 'rim'],
        caliperMaterialNames: ['untitledMAT_Tire_Brake_331', 'brake', 'caliper'],
        exhaustPipes: [new THREE.Vector3(-0.3, 0.45, -2.25), new THREE.Vector3(0.3, 0.45, -2.25)],
        wheelRadius: 0.36,
      };

    case 'apollo_ie':
      return {
        url: '/models/apollo_ie.glb',
        targetLength: 4.8,
        rotY: Math.PI,
        yOffset: 0.015,
        paintMaterialNames: ['aApollo_IntensaEmozioneOrangeDragon_2019Paint_Material1', 'carpaint', 'body'],
        rimMaterialNames: ['aApollo_IntensaEmozioneOrangeDragon_2019_Wheel1A_3D_3DWh_36da724', 'rim'],
        caliperMaterialNames: ['aApollo_IntensaEmozioneOrangeDragon_2019_CallipersCallip_ba9d355', 'caliper'],
        exhaustPipes: [
          new THREE.Vector3(0, 0.68, -2.3),
          new THREE.Vector3(-0.16, 0.58, -2.3),
          new THREE.Vector3(0.16, 0.58, -2.3),
        ],
        wheelRadius: 0.37,
      };

    default:
      return null;
  }
}

export function preloadRealCarModel(modelId: CarModelId): Promise<THREE.Group> | null {
  if (modelCache[modelId]) return Promise.resolve(modelCache[modelId]!);
  if (loadingPromises[modelId]) return loadingPromises[modelId]!;

  const cfg = getModelConfig(modelId);
  if (!cfg) return null;

  const promise = new Promise<THREE.Group>((resolve, reject) => {
    try {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/gltf/');

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        cfg.url,
        (gltf) => {
          const root = (gltf.scene.children[0] as THREE.Group) || gltf.scene;

          if (cfg.rotY !== 0) {
            root.rotation.y = cfg.rotY;
          }
          root.updateMatrixWorld(true);

          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);
          const scaleFactor = cfg.targetLength / (size.z || 1);

          root.scale.set(scaleFactor, scaleFactor, scaleFactor);
          if (cfg.yOffset !== 0) {
            root.position.y = cfg.yOffset;
          }
          root.updateMatrixWorld(true);

          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          modelCache[modelId] = root;
          resolve(root);

          if (listeners[modelId]) {
            listeners[modelId]!.forEach((cb) => cb(root));
            listeners[modelId] = [];
          }
        },
        undefined,
        (err) => {
          console.warn(`Failed to load 3D model ${cfg.url}:`, err);
          reject(err);
        }
      );
    } catch (e) {
      console.warn(`DRACOLoader error for ${modelId}:`, e);
      reject(e);
    }
  });

  loadingPromises[modelId] = promise;
  return promise;
}

export function preloadAllRealCarModels() {
  const modelsToPreload: CarModelId[] = ['ferrari_sf90', 'lambo_urus', 'pagani_zonda', 'xiaomi_su7', 'apollo_ie'];
  modelsToPreload.forEach((id) => preloadRealCarModel(id));
}

export function onRealModelReady(modelId: CarModelId, cb: (model: THREE.Group) => void) {
  if (modelCache[modelId]) {
    cb(modelCache[modelId]!);
  } else {
    if (!listeners[modelId]) listeners[modelId] = [];
    listeners[modelId]!.push(cb);
    preloadRealCarModel(modelId);
  }
}

export function createCustomizedRealCarInstance(custom: CarCustomization): RealCarInstance | null {
  const cfg = getModelConfig(custom.modelId);
  if (!cfg) return null;

  const base = modelCache[custom.modelId];
  if (!base) return null;

  const clone = base.clone(true);

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

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(custom.rimColor || '#e4e4e7'),
    metalness: 0.92,
    roughness: 0.18,
  });

  const caliperMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(custom.caliperColor || '#ef4444'),
    metalness: 0.6,
    roughness: 0.25,
  });

  let mainBodyMesh: THREE.Mesh = new THREE.Mesh();
  const frontWheels: THREE.Object3D[] = [];
  const allWheels: THREE.Object3D[] = [];

  clone.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.material) {
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const matName = mat.name || '';
      const meshName = mesh.name || '';

      if (
        cfg.paintMaterialNames.some(
          (p) => matName.toLowerCase().includes(p.toLowerCase()) || meshName.toLowerCase().includes(p.toLowerCase())
        )
      ) {
        mesh.material = bodyMaterial;
        mainBodyMesh = mesh;
      } else if (
        cfg.rimMaterialNames.some(
          (r) => matName.toLowerCase().includes(r.toLowerCase()) || meshName.toLowerCase().includes(r.toLowerCase())
        )
      ) {
        mesh.material = rimMaterial;
      } else if (
        cfg.caliperMaterialNames.some(
          (c) => matName.toLowerCase().includes(c.toLowerCase()) || meshName.toLowerCase().includes(c.toLowerCase())
        )
      ) {
        mesh.material = caliperMaterial;
      }
    }

    const nodeName = child.name.toLowerCase();
    if (
      nodeName.includes('wheel_fl') ||
      nodeName.includes('wheel_fr') ||
      nodeName.includes('whl_hd_fl') ||
      nodeName.includes('sm_hub_l') ||
      nodeName.includes('sm_hub_r')
    ) {
      frontWheels.push(child);
      allWheels.push(child);
    } else if (
      nodeName.includes('wheel_rl') ||
      nodeName.includes('wheel_rr') ||
      nodeName.includes('whl_hd_rl') ||
      nodeName.includes('whl_hd_rr') ||
      nodeName.includes('tiresgum') ||
      nodeName.includes('wheel')
    ) {
      allWheels.push(child);
    }
  });

  return {
    model: clone,
    bodyMesh: mainBodyMesh,
    frontWheels,
    allWheels,
    exhaustPipes: cfg.exhaustPipes,
    wheelRadius: cfg.wheelRadius,
  };
}
