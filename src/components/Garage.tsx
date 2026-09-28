import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Palette, Sparkles, Disc, Zap, Sliders, Volume2, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { CarCustomization, CarModelId, CarSpecs } from '../types/game';
import { buildCar, BuiltCar } from '../utils/three-car-builder';
import { soundManager } from '../utils/audio';

export const CAR_MODELS_DATA: CarSpecs[] = [
  {
    id: 'ferrari_sf90',
    name: '法拉利 SF90 Stradale',
    category: '跃马旗舰 • 真实车模',
    tagline: '马拉内罗巅峰混动超跑，千匹马力与极致空气动力学杰作',
    baseTopSpeed: 340,
    baseAcceleration: 2.5,
    baseHandling: 96,
    baseNitro: 95,
    description: '搭载 4.0L 双涡轮增压 V8 引擎与三电机混动系统，高精度真实 3D CAD 车模，矩阵车灯与中置双出排气。',
  },
  {
    id: 'lambo_urus',
    name: '兰博基尼 Urus 蛮牛超跑',
    category: '狂暴蛮牛 • 真实车模',
    tagline: '意大利圣亚加塔超级猛兽，极具侵略性的全套空气动力学大包围',
    baseTopSpeed: 345,
    baseAcceleration: 2.4,
    baseHandling: 95,
    baseNitro: 98,
    description: '4.0L 双涡轮增压狂暴动力，几何锋利进气格栅，高精度真实 3D 蛮牛车模与四出钛金排气。',
  },
  {
    id: 'pagani_zonda',
    name: '帕加尼 Zonda 幽灵之子',
    category: '意式艺术品 • 真实车模',
    tagline: '碳纤维手工雕琢的风之子，全钛合金标志性中置四出聚束排气',
    baseTopSpeed: 350,
    baseAcceleration: 2.3,
    baseHandling: 97,
    baseNitro: 92,
    description: '自然吸气 AMG 7.3L V12 绝唱声浪，轻量化全碳车身与高耸赛道尾翼，高精度真实 3D 车模。',
  },
  {
    id: 'xiaomi_su7',
    name: '小米 SU7 Ultra 巅峰性能版',
    category: '纽北量产纪录 • 真实车模',
    tagline: '1548 匹三电机狂暴动力，纽博格林北环量产车圈速统治者',
    baseTopSpeed: 355,
    baseAcceleration: 1.98,
    baseHandling: 98,
    baseNitro: 99,
    description: '全碳纤维空气动力学套件、超大前唇与扩散器，高精度真实 3D CAD 车模。',
  },
  {
    id: 'apollo_ie',
    name: '阿波罗 Apollo Intensa Emozione',
    category: '终极赛道神兽 • 真实车模',
    tagline: '全球限量10台的狂暴艺术品，外星异形碳纤维全宽背鳍尾翼',
    baseTopSpeed: 360,
    baseAcceleration: 2.1,
    baseHandling: 99,
    baseNitro: 94,
    description: '6.3L 自然吸气 V12 赛道猛兽，极度夸张的鲨鱼鳍与三叶草中置排气，高精度真实 3D 车模。',
  },
  {
    id: 'porsche_911_gt3',
    name: '保时捷 911 GT3 RS (992)',
    category: '赛道利刃 Track Weapon',
    tagline: '标志性水滴车体与蛙眼大灯，天鹅颈碳纤维巨幅尾翼与机盖导风孔',
    baseTopSpeed: 320,
    baseAcceleration: 2.9,
    baseHandling: 99,
    baseNitro: 88,
    description: '自然吸气水平对置六缸（Flat-6）高转自吸神机，9000转红线与极致过弯下压力。',
  },
  {
    id: 'monza_f1',
    name: 'Monza F1 蒙扎利刃',
    category: '方程式 Formula 1',
    tagline: '终极下压力与极致过弯G力的纯正赛道机器',
    baseTopSpeed: 355,
    baseAcceleration: 2.1,
    baseHandling: 99,
    baseNitro: 85,
    description: '开放式座舱单座赛车，贴地飞行的下压力保证高速弯角的绝对稳定性。',
  },
];

const PRESET_COLORS = [
  { name: '法拉利红', hex: '#dc2626' },
  { name: '赛博冰青', hex: '#00f0ff' },
  { name: '曜石酷黑', hex: '#18181b' },
  { name: '珍珠冷白', hex: '#f8fafc' },
  { name: '迈阿密紫', hex: '#a855f7' },
  { name: '柠檬毒绿', hex: '#84cc16' },
  { name: '落日熔金', hex: '#f59e0b' },
  { name: '皇家深蓝', hex: '#2563eb' },
];

const UNDERGLOW_COLORS = [
  { name: '关闭', hex: 'none' },
  { name: '霓虹青', hex: '#00f0ff' },
  { name: '荧光粉', hex: '#ff0077' },
  { name: '电光紫', hex: '#a855f7' },
  { name: '毒液绿', hex: '#22c55e' },
  { name: '琥珀金', hex: '#f59e0b' },
];

interface GarageProps {
  customization: CarCustomization;
  onChange: (custom: CarCustomization) => void;
  onStartRace: () => void;
}

export const Garage: React.FC<GarageProps> = ({ customization, onChange, onStartRace }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<'model' | 'paint' | 'wheels' | 'neon' | 'tuning'>('model');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const builtCarRef = useRef<BuiltCar | null>(null);
  const carPivotRef = useRef<THREE.Group | null>(null);

  const activeCarSpecs = CAR_MODELS_DATA.find((c) => c.id === customization.modelId) || CAR_MODELS_DATA[0];

  // Initialize 3D Showroom Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.5, 2.2, 5.5);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Showroom Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xff0077, 1.2);
    fillLight.position.set(6, 2, -4);
    scene.add(fillLight);

    // Showroom Reflective Floor with Circular Grid
    const floorGeo = new THREE.CircleGeometry(16, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.25,
      metalness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Showroom Light Rings
    const ringGeo = new THREE.TorusGeometry(3.6, 0.03, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.02;
    scene.add(ringMesh);

    const ceilingRingGeo = new THREE.TorusGeometry(4.2, 0.06, 16, 64);
    const ceilingRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ceilingRing = new THREE.Mesh(ceilingRingGeo, ceilingRingMat);
    ceilingRing.rotation.x = Math.PI / 2;
    ceilingRing.position.y = 4.5;
    scene.add(ceilingRing);

    const carPivot = new THREE.Group();
    scene.add(carPivot);
    carPivotRef.current = carPivot;

    // Mouse drag rotation
    let isDragging = false;
    let prevMouseX = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !carPivotRef.current) return;
      const delta = e.clientX - prevMouseX;
      carPivotRef.current.rotation.y += delta * 0.008;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging && carPivotRef.current) {
        carPivotRef.current.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Car 3D Mesh when customization changes
  useEffect(() => {
    if (!carPivotRef.current) return;
    const pivot = carPivotRef.current;

    while (pivot.children.length > 0) {
      pivot.remove(pivot.children[0]);
    }

    const built = buildCar(customization);
    builtCarRef.current = built;
    pivot.add(built.root);
  }, [customization]);

  const updateCustom = (partial: Partial<CarCustomization>) => {
    soundManager.userGesture();
    onChange({ ...customization, ...partial });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black text-white overflow-hidden font-sans select-none">
      {/* 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Top Header */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center pointer-events-none">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              PRO GARAGE
            </span>
            <span className="text-xs text-zinc-400 tracking-wider">拖拽旋转 3D 视角</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-wider text-white mt-1 uppercase">
            {activeCarSpecs.name}
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mt-0.5">{activeCarSpecs.tagline}</p>
        </div>

        {/* Start Race CTA Button */}
        <button
          onClick={() => {
            soundManager.userGesture();
            onStartRace();
          }}
          className="pointer-events-auto flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-2xl font-black tracking-wider text-white shadow-xl shadow-cyan-500/30 transform hover:scale-105 transition-all cursor-pointer"
        >
          <span>进入赛道 RACE</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Customization Panel */}
      <div className="absolute bottom-6 left-8 right-8 bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-5 shadow-2xl pointer-events-auto max-w-4xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('model')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'model'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 真实车型 SELECT ({CAR_MODELS_DATA.length})
          </button>

          <button
            onClick={() => setActiveTab('paint')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'paint'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Palette className="w-4 h-4" /> 车漆质感 PAINT
          </button>

          <button
            onClick={() => setActiveTab('wheels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'wheels'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Disc className="w-4 h-4" /> 轮毂与卡钳 WHEELS
          </button>

          <button
            onClick={() => setActiveTab('neon')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'neon'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Zap className="w-4 h-4" /> 底盘霓虹 UNDERGLOW
          </button>

          <button
            onClick={() => setActiveTab('tuning')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tuning'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-4 h-4" /> 性能调校 TUNING
          </button>
        </div>

        {/* Tab 1: Car Models Selection */}
        {activeTab === 'model' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CAR_MODELS_DATA.map((car) => {
              const isSelected = customization.modelId === car.id;
              return (
                <div
                  key={car.id}
                  onClick={() => updateCustom({ modelId: car.id })}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-950/60 to-zinc-900 border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="text-[10px] text-cyan-400 font-bold tracking-wider">{car.category}</div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate">{car.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 font-mono">
                    <span>极速: {car.baseTopSpeed} km/h</span>
                    <span>0-100: {car.baseAcceleration}s</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Paint Colors and Finish */}
        {activeTab === 'paint' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-zinc-400 font-semibold mb-2">车身漆色 PAINT COLOR</div>
              <div className="flex flex-wrap gap-2.5 items-center">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => updateCustom({ paintColor: c.hex })}
                    className={`w-9 h-9 rounded-xl border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      customization.paintColor === c.hex
                        ? 'border-white scale-110 shadow-lg shadow-white/20'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {customization.paintColor === c.hex && (
                      <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-400 font-semibold mb-2">漆面工艺 FINISH</div>
              <div className="flex gap-2">
                {[
                  { id: 'metallic', name: '金属漆 (Metallic)' },
                  { id: 'matte', name: '哑光磨砂 (Matte)' },
                  { id: 'pearl', name: '珠光烤漆 (Pearl)' },
                  { id: 'gloss', name: '高光镜面 (Gloss)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateCustom({ finish: f.id as any })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      customization.finish === f.id
                        ? 'bg-zinc-800 text-cyan-400 border-cyan-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Wheels and Calipers */}
        {activeTab === 'wheels' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-zinc-400 font-semibold mb-2">轮毂配色 RIMS COLOR</div>
              <div className="flex gap-2">
                {[
                  { name: '银色镀铬', hex: '#e4e4e7' },
                  { name: '曜石枪灰', hex: '#27272a' },
                  { name: '古铜金', hex: '#d97706' },
                  { name: '法拉利红', hex: '#dc2626' },
                ].map((r) => (
                  <button
                    key={r.hex}
                    onClick={() => updateCustom({ rimColor: r.hex })}
                    className={`w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer ${
                      customization.rimColor === r.hex ? 'border-cyan-400 scale-110' : 'border-zinc-700'
                    }`}
                    style={{ backgroundColor: r.hex }}
                    title={r.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-400 font-semibold mb-2">制动卡钳 CALIPERS</div>
              <div className="flex gap-2">
                {[
                  { name: '竞技红', hex: '#ef4444' },
                  { name: '竞速黄', hex: '#eab308' },
                  { name: '赛博青', hex: '#06b6d4' },
                  { name: '毒液绿', hex: '#22c55e' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => updateCustom({ caliperColor: c.hex })}
                    className={`w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer ${
                      customization.caliperColor === c.hex ? 'border-cyan-400 scale-110' : 'border-zinc-700'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Underglow Neon */}
        {activeTab === 'neon' && (
          <div>
            <div className="text-xs text-zinc-400 font-semibold mb-2">车底霓虹氛围灯 UNDERGLOW LIGHTS</div>
            <div className="flex flex-wrap gap-2.5">
              {UNDERGLOW_COLORS.map((u) => (
                <button
                  key={u.hex}
                  onClick={() => updateCustom({ underglowColor: u.hex })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                    customization.underglowColor === u.hex
                      ? 'bg-zinc-800 text-white border-cyan-400 shadow-lg'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {u.hex !== 'none' && (
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: u.hex }} />
                  )}
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Performance Tuning */}
        {activeTab === 'tuning' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'engine', name: '引擎输出', level: customization.tuning.engine },
              { id: 'transmission', name: '双离合变速箱', level: customization.tuning.transmission },
              { id: 'tires', name: '热熔竞技轮胎', level: customization.tuning.tires },
              { id: 'nitroBoost', name: '氮气注压系统', level: customization.tuning.nitroBoost },
              { id: 'aeroBrakes', name: '碳陶制动与风翼', level: customization.tuning.aeroBrakes },
            ].map((t) => (
              <div key={t.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3">
                <div className="flex justify-between text-xs text-zinc-300 font-bold mb-1.5">
                  <span>{t.name}</span>
                  <span className="text-cyan-400 font-mono">Lv.{t.level} / 5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      onClick={() =>
                        updateCustom({
                          tuning: { ...customization.tuning, [t.id]: lvl },
                        })
                      }
                      className={`h-2 flex-1 rounded cursor-pointer transition-all ${
                        lvl <= t.level ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
