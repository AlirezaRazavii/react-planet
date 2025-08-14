import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float } from "@react-three/drei";
import * as THREE from "three";

const noiseChunk = `
vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0/289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 =   v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a1.xy,h.y);
  vec3 p2 = vec3(a0.zw,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){
  float f = 0.0;
  float amp = 0.5;
  for(int i=0;i<6;i++){
    f += amp * snoise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return f;
}
`;

const planetVertex = `
uniform float uTime;
uniform float uElevation;
uniform float uDetail;
varying vec3 vPos;
varying float vHeight;
${noiseChunk}
void main(){
  vec3 p = position;
  float n = fbm(normalize(p) * uDetail + vec3(uTime*0.03,0.0,uTime*0.015));
  float h = n * uElevation;
  vec3 displaced = normalize(p) * (1.0 + h);
  vPos = displaced;
  vHeight = h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const planetFragment = `
precision highp float;
uniform vec3 uOceanColor;
uniform vec3 uLandLow;
uniform vec3 uLandHigh;
uniform float uOceanLevel;
uniform vec3 uLightDir;
varying vec3 vPos;
varying float vHeight;
float diffuse(vec3 n, vec3 l){return max(dot(n,l), 0.0);}
float rim(vec3 n, vec3 v){return pow(1.0 - max(dot(n, v), 0.0), 2.0);}
void main(){
  vec3 n = normalize(vPos);
  float h = vHeight;
  float water = step(h, uOceanLevel);
  vec3 landCol = mix(uLandLow, uLandHigh, smoothstep(uOceanLevel, 0.35, h));
  vec3 base = mix(landCol, uOceanColor, water);
  float d = diffuse(n, normalize(uLightDir));
  float r = rim(n, normalize(-cameraPosition));
  float night = smoothstep(-0.15, -0.02, d - 0.05);
  vec3 dayLit = base * (0.25 + 0.9 * d);
  vec3 nightLit = base * 0.1 + vec3(0.9,0.85,0.7) * pow(max(0.0, r), 2.0);
  vec3 col = mix(dayLit, nightLit, night);
  gl_FragColor = vec4(col, 1.0);
}
`;

const cloudVertex = `
uniform float uTime;
uniform float uDetail;
varying vec3 vPos;
varying float vFbm;
${noiseChunk}
void main(){
  vec3 p = position * 1.01;
  float f = fbm(normalize(p) * uDetail + vec3(uTime*0.01, 0.0, uTime*0.02));
  vFbm = f;
  vPos = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const cloudFragment = `
precision highp float;
uniform float uThreshold;
uniform vec3 uLightDir;
varying vec3 vPos;
varying float vFbm;
void main(){
  float m = smoothstep(uThreshold, uThreshold+0.2, vFbm);
  float lighting = max(dot(normalize(vPos), normalize(uLightDir)), 0.0);
  float alpha = m * (0.35 + 0.35 * lighting);
  gl_FragColor = vec4(vec3(1.0), alpha);
}
`;

const atmoVertex = `
varying vec3 vWorldPos;
void main(){
  vec4 wp = modelMatrix * vec4(position,1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const atmoFragment = `
precision highp float;
varying vec3 vWorldPos;
void main(){
  gl_FragColor = vec4(vec3(0.5,0.8,1.2)*0.6, 0.05);
}
`;

function Planet({ oceanLevel, lightDir, withRing }: { 
  oceanLevel: number; 
  lightDir: THREE.Vector3; 
  withRing: boolean; 
}) {
  const planetMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uElevation: { value: 0.22 },
      uDetail: { value: 3.0 },
      uOceanColor: { value: new THREE.Color("#2b66d5") },
      uLandLow: { value: new THREE.Color("#3c8f3c") },
      uLandHigh: { value: new THREE.Color("#c2b280") },
      uOceanLevel: { value: oceanLevel },
      uLightDir: { value: lightDir },
    },
    vertexShader: planetVertex,
    fragmentShader: planetFragment,
  }), []);
  
  const cloudMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDetail: { value: 2.5 },
      uThreshold: { value: 0.25 },
      uLightDir: { value: lightDir },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: cloudVertex,
    fragmentShader: cloudFragment,
  }), []);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    planetMat.uniforms.uTime.value = t;
    planetMat.uniforms.uOceanLevel.value = oceanLevel;
    planetMat.uniforms.uLightDir.value = lightDir;
    cloudMat.uniforms.uTime.value = t;
    cloudMat.uniforms.uLightDir.value = lightDir;
  });
  
  return (
    <group>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1, 6]} />
        <primitive object={planetMat} attach="material" />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.02, 6]} />
        <primitive object={cloudMat} attach="material" />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.08, 64, 64]} />
        <shaderMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexShader={atmoVertex}
          fragmentShader={atmoFragment}
        />
      </mesh>
      {withRing && (
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[1.35, 2.0, 128]} />
          <meshPhongMaterial
            side={THREE.DoubleSide}
            transparent
            opacity={0.35}
            color={new THREE.Color("#cfe8ff")}
            specular={new THREE.Color("#ffffff")}
            shininess={80}
          />
        </mesh>
      )}
    </group>
  );
}

function Moon() {
  const ref = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Vector3[]>([]);
  const lineRef = useRef<THREE.BufferGeometry>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.18, 4), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#d9d5cf", 
    roughness: 0.9, 
    metalness: 0.05 
  }), []);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const r = 2.7;
    const speed = 0.25;
    const x = Math.cos(t * speed) * r;
    const z = Math.sin(t * speed) * r;
    const y = Math.sin(t * speed * 0.7) * 0.3;
    
    if (ref.current) ref.current.position.set(x, y, z);
    
    trail.current.push(new THREE.Vector3(x, y, z));
    if (trail.current.length > 120) trail.current.shift();
    
    if (lineRef.current) {
      const arr = lineRef.current.attributes.position.array as Float32Array;
      for (let i = 0; i < 120; i++) {
        const p = trail.current[i] || trail.current[trail.current.length - 1] || new THREE.Vector3();
        arr[i * 3 + 0] = p.x;
        arr[i * 3 + 1] = p.y;
        arr[i * 3 + 2] = p.z;
      }
      lineRef.current.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <group>
      <mesh ref={ref} geometry={geo} material={mat} castShadow receiveShadow />
      <line>
        <bufferGeometry ref={lineRef}>
          <bufferAttribute
            attach="attributes-position"
            count={120}
            array={useMemo(() => new Float32Array(120 * 3), [])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial transparent opacity={0.5} />
      </line>
    </group>
  );
}

function ShootingStar() {
  const ref = useRef<THREE.Mesh>(null);
  const [ttl] = useState(() => 3 + Math.random() * 2);
  const [start] = useState(() => ({
    x: (Math.random() * 2 - 1) * 8,
    y: 3 + Math.random() * 2,
    z: -5 - Math.random() * 4,
  }));
  
  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() % ttl) / ttl;
    const x = start.x - t * 8;
    const y = start.y - t * 2;
    const z = start.z + t * 6;
    if (ref.current) ref.current.position.set(x, y, z);
  });
  
  return (
    <mesh ref={ref}>
      <coneGeometry args={[0.02, 0.2, 8]} />
      <meshBasicMaterial />
    </mesh>
  );
}

export default function MiniPlanetApp() {
  const [withRing, setWithRing] = useState(true);
  const lightDir = useMemo(() => new THREE.Vector3(1, 0.3, 0.8).normalize(), []);
  const [oceanLevel, setOceanLevel] = useState(0.05);
  
  const onFrame = (state: any) => {
    const t = state.clock.getElapsedTime();
    const sunX = Math.cos(t * 0.15) * 2.0;
    const sunY = Math.sin(t * 0.2) * 1.5;
    const sunZ = Math.sin(t * 0.1) * 2.0;
    lightDir.set(sunX, sunY, sunZ).normalize();
    setOceanLevel(0.03 + Math.sin(t * 0.1) * 0.02);
  };
  
  return (
    <div className="w-full h-screen bg-slate-900 text-slate-100">
      <div className="absolute z-10 left-4 top-4 p-3 rounded-2xl bg-slate-800/70 shadow-lg backdrop-blur">
        <h1 className="text-xl font-semibold">Procedural Mini-Planet</h1>
        <p className="text-xs opacity-80">کلیک کنید تا حلقهٔ سیاره خاموش/روشن شود. با ماوس بچرخانید و زوم کنید.</p>
        <div className="mt-2 text-xs grid gap-1">
          <div>🌊 Ocean level: <span className="font-mono">{oceanLevel.toFixed(3)}</span></div>
          <button 
            onClick={() => setWithRing(v => !v)} 
            className="px-3 py-1 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-xs"
          >
            Toggle Ring
          </button>
        </div>
      </div>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 1.8, 4.2], fov: 50 }}
        onCreated={(state) => { state.gl.setClearColor(new THREE.Color("#06121f")); }}
        shadows
        onPointerDown={() => setWithRing(v => !v)}
        onPointerMissed={() => {}}
        onAfterRender={onFrame}
      >
        <ambientLight intensity={0.05} />
        <directionalLight 
          castShadow 
          position={[5, 5, 5]} 
          intensity={1.2} 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <Stars radius={100} depth={40} count={6000} factor={4} fade />
        <Float speed={2} floatIntensity={0.5}>
          <ShootingStar />
        </Float>
        <group>
          <Planet oceanLevel={oceanLevel} lightDir={lightDir} withRing={withRing} />
          <Moon />
        </group>
        <OrbitControls enablePan={false} minDistance={2.5} maxDistance={8} />
      </Canvas>
      <div className="absolute z-10 right-4 bottom-4 p-3 rounded-2xl bg-slate-800/70 shadow-lg backdrop-blur text-xs">
        ساخته‌شده با React + @react-three/fiber + GLSL | نویسنده: شما ✨
      </div>
    </div>
  );
}