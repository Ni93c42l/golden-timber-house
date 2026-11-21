import type React from "react";
import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

// Maße in Metern. Erdgeschoss 1 m erhöht, 3 Stockwerke à 2.6 m, Dach 3.2 m → First auf 12 m.
const W = 10, D = 8, BASE = 1, FLOOR = 2.6, FLOORS = 3, ROOF = 3.2, T = 0.18;
const TOP = BASE + FLOOR * FLOORS; // Traufhöhe
const CELLAR = -2; // Kellerboden
const GARDEN = 4; // Vorgarten-Tiefe
const FZ = D / 2; // Vorderseite
const C = {
  yellow: "#e6bf45", timber: "#3f2614", roof: "#3b2418", stone: "#8b8377",
  frame: "#d9cfb6", glass: "#4f6461", shutter: "#56664a", door: "#5a3a22",
  grass: "#6d8c45", lawn: "#7ea152", path: "#a59a86", hedge: "#3f5f2c", iron: "#2b2b2b",
};

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type V3 = [number, number, number];
function Beam({ a, b, depth = T, color = C.timber, thick = T }: { a: V3; b: V3; depth?: number; color?: string; thick?: number }) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <boxGeometry args={[thick, len + thick, depth]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function Box({ p, s, c, r = 0.9 }: { p: V3; s: V3; c: string; r?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={r} />
    </mesh>
  );
}

// Alte Sprossenfenster mit Rahmen, Sims und optional Fensterläden
function Window({ x, y, w, h, shutters, cols = 2, rows = 3 }: { x: number; y: number; w: number; h: number; shutters: boolean; cols?: number; rows?: number }) {
  const bars: React.ReactElement[] = [];
  for (let i = 1; i < cols; i++) bars.push(<Box key={"c" + i} p={[x - w / 2 + (i * w) / cols, y, 0.06]} s={[0.04, h, 0.03]} c={C.frame} />);
  for (let j = 1; j < rows; j++) bars.push(<Box key={"r" + j} p={[x, y - h / 2 + (j * h) / rows, 0.06]} s={[w, 0.04, 0.03]} c={C.frame} />);
  return (
    <group>
      <Box p={[x, y, 0.02]} s={[w + 0.14, h + 0.14, 0.06]} c={C.frame} />
      <mesh position={[x, y, 0.055]}>
        <boxGeometry args={[w, h, 0.02]} />
        <meshStandardMaterial color={C.glass} roughness={0.25} metalness={0.2} />
      </mesh>
      {bars}
      <Box p={[x, y - h / 2 - 0.1, 0.08]} s={[w + 0.3, 0.06, 0.16]} c={C.timber} />
      {shutters && [-1, 1].map((s) => (
        <group key={s}>
          <Box p={[x + s * (w / 2 + 0.07 + w / 4), y, 0.05]} s={[w / 2, h + 0.1, 0.04]} c={C.shutter} />
          {[-0.3, 0, 0.3].map((t) => <Box key={t} p={[x + s * (w / 2 + 0.07 + w / 4), y + t * h, 0.08]} s={[w / 2 - 0.06, 0.03, 0.02]} c={C.timber} />)}
        </group>
      ))}
    </group>
  );
}

function Door({ x, y, w = 1, h = 2.1 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <group>
      <Box p={[x, y + h / 2, 0.03]} s={[w + 0.16, h + 0.08, 0.06]} c={C.timber} />
      <Box p={[x, y + h / 2, 0.07]} s={[w, h, 0.05]} c={C.door} />
      {[-0.3, 0, 0.3].map((t) => <Box key={t} p={[x + t * w, y + h / 2, 0.1]} s={[0.02, h - 0.1, 0.02]} c={C.timber} />)}
      <Box p={[x + w * 0.35, y + h * 0.48, 0.12]} s={[0.05, 0.12, 0.04]} c={C.iron} />
    </group>
  );
}

type Cell = "w" | "D" | "b";
function Facade({ width, rows, seed }: { width: number; rows: Cell[][]; seed: number }) {
  const r = rng(seed);
  const items: React.ReactElement[] = [];
  const bays = rows[0]!.length, bw = width / bays, x0 = -width / 2;
  let k = 0;
  const beam = (a: V3, b: V3) => items.push(<Beam key={k++} a={a} b={b} />);
  for (let f = 0; f <= FLOORS; f++) beam([x0, BASE + f * FLOOR, 0], [-x0, BASE + f * FLOOR, 0]);
  rows.forEach((row, f) => {
    const y = BASE + f * FLOOR, yt = y + FLOOR;
    for (let i = 0; i <= bays; i++) beam([x0 + i * bw, y, 0], [x0 + i * bw, yt, 0]);
    row.forEach((cell, i) => {
      const xa = x0 + i * bw, xb = xa + bw, cx = (xa + xb) / 2;
      if (cell === "D") {
        beam([cx - 0.6, y, 0], [cx - 0.6, yt, 0]); beam([cx + 0.6, y, 0], [cx + 0.6, yt, 0]);
        beam([xa, y + 2.3, 0], [xb, y + 2.3, 0]);
        beam([xa, y, 0], [cx - 0.6, y + 1.2, 0]);
        items.push(<Door key={k++} x={cx} y={y} />);
      } else if (cell === "w") {
        const w = 0.8 + r() * 0.15, h = 1 + r() * 0.15;
        beam([xa, y + 0.85, 0], [xb, y + 0.85, 0]);
        beam([xa, y + 2.05, 0], [xb, y + 2.05, 0]);
        if (r() < 0.5) beam([xa, y, 0], [cx, y + 0.85, 0]);
        else beam([xb, y, 0], [cx, y + 0.85, 0]);
        items.push(<Window key={k++} x={cx} y={y + 1.45} w={w} h={h} shutters={r() < 0.55} />);
      } else {
        const t = r();
        const mid = y + FLOOR * (0.45 + r() * 0.15);
        if (t < 0.22) { beam([xa, y, 0], [xb, yt, 0]); beam([xb, y, 0], [xa, yt, 0]); }
        else if (t < 0.4) { beam([xa, y, 0], [xb, yt, 0]); }
        else if (t < 0.55) { beam([xb, y, 0], [xa, yt, 0]); beam([xa, mid, 0], [xb, mid, 0]); }
        else if (t < 0.75) { // "Wilder Mann"
          beam([cx, y, 0], [cx, yt, 0]);
          beam([xa, y + 0.3, 0], [cx, mid, 0]); beam([xb, y + 0.3, 0], [cx, mid, 0]);
          beam([xa, yt - 0.2, 0], [cx, mid, 0]); beam([xb, yt - 0.2, 0], [cx, mid, 0]);
        } else if (t < 0.88) { // Fußstreben
          beam([xa, mid, 0], [xb, mid, 0]);
          beam([xa, y + 0.9, 0], [xa + bw * 0.45, y, 0]); beam([xb, y + 0.9, 0], [xb - bw * 0.45, y, 0]);
        } else { beam([xa, mid, 0], [xb, mid, 0]); beam([xa, mid, 0], [cx, yt, 0]); }
      }
    });
  });
  return <group>{items}</group>;
}

function Gable({ side }: { side: 1 | -1 }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-D / 2, 0); s.lineTo(D / 2, 0); s.lineTo(0, ROOF); s.closePath();
    return s;
  }, []);
  const rf = (s: number) => ROOF * (1 - Math.abs(s) / (D / 2));
  return (
    <group position={[(side * W) / 2, TOP, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
      <mesh position={[0, 0, -0.06]} castShadow><shapeGeometry args={[shape]} /><meshStandardMaterial color={C.yellow} roughness={0.95} side={THREE.DoubleSide} /></mesh>
      <group position={[0, 0, 0.02]}>
        {[-2.7, -0.6, 0.6, 2.7].map((s) => <Beam key={s} a={[s, 0, 0]} b={[s, Math.min(rf(s), 1.65), 0]} />)}
        <Beam a={[-2, 1.65, 0]} b={[2, 1.65, 0]} />
        <Beam a={[0, 1.65, 0]} b={[0, ROOF, 0]} />
        <Beam a={[side > 0 ? -0.6 : 0.6, 0.2, 0]} b={[0, 1.65, 0]} />
        <Beam a={[-3.6, 0.2, 0]} b={[-2.7, 0.9, 0]} />
        <Beam a={[3.4, 0, 0]} b={[2.7, 0.7, 0]} />
        <Window x={-1.6} y={0.75} w={0.7} h={0.85} shutters={side > 0} />
        <Window x={1.6} y={0.75} w={0.7} h={0.85} shutters={side < 0} />
        <Window x={-0.5} y={2.2} w={0.4} h={0.45} shutters={false} cols={2} rows={2} />
      </group>
    </group>
  );
}

// Satteldach: beide Flächen treffen sich sauber am First
function Roof() {
  const o = 0.6, th = 0.25, h = D / 2, k = ROOF / h;
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-(h + o), -o * k); s.lineTo(0, ROOF); s.lineTo(h + o, -o * k);
    s.lineTo(h + o, -o * k + th); s.lineTo(0, ROOF + th); s.lineTo(-(h + o), -o * k + th); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: W + 2 * o, bevelEnabled: false });
  }, []);
  // Dachziegel-Reihen
  const rows: React.ReactElement[] = [];
  const slope = Math.hypot(h + o, ROOF + o * k), ang = Math.atan2(ROOF, h);
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    [1, -1].forEach((sd) => {
      const z = sd * (h + o) * (1 - t), y = TOP + ROOF - (ROOF + o * k) * (1 - t) + th + 0.01;
      rows.push(<mesh key={`${i}${sd}`} position={[0, y, z]} rotation={[sd * ang, 0, 0]}><boxGeometry args={[W + 2 * o, 0.03, 0.06]} /><meshStandardMaterial color="#2a1910" /></mesh>);
    });
  }
  void slope;
  return (
    <group>
      <mesh geometry={geo} position={[-(W / 2 + o), TOP, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.roof} roughness={0.85} />
      </mesh>
      {rows}
      <Box p={[0, TOP + ROOF + th + 0.05, 0]} s={[W + 2 * o, 0.14, 0.3]} c="#24150d" />
    </group>
  );
}

function Chimney() {
  const x = -W / 2 + 1.5, z = -1.2;
  const yRoof = TOP + ROOF * (1 - Math.abs(z) / (D / 2));
  const top = TOP + ROOF + 1;
  return (
    <group>
      <Box p={[x, (yRoof - 0.4 + top) / 2, z]} s={[0.7, top - yRoof + 0.4, 0.7]} c="#7a4a3a" />
      <Box p={[x, top + 0.05, z]} s={[0.85, 0.12, 0.85]} c="#5e382b" />
    </group>
  );
}

// Positionen von Eingang und Kellerabgang
const ENTRY_X = 0, ENTRY_W = 1.4, CELLAR_X = 2.4, PIT_W = 1.2, PIT_L = 2.8;
const PIT = { x1: CELLAR_X - PIT_W / 2, x2: CELLAR_X + PIT_W / 2, z1: FZ + 0.05, z2: FZ + 0.05 + PIT_L };

function EntryStairs({ back = false }: { back?: boolean }) {
  const s = back ? -1 : 1, steps = 4, rise = BASE / steps;
  const items: React.ReactElement[] = [];
  const landing = 0.9, run = 0.3;
  for (let i = 0; i < steps; i++) {
    const top = BASE - i * rise;
    const depth = landing + (steps - 1 - i) * 0 + run * (steps - i - 1) + (i === 0 ? 0 : 0);
    void depth;
    const z0 = FZ + 0.05, z1 = FZ + 0.05 + landing + i * run;
    items.push(<Box key={i} p={[ENTRY_X, top / 2, s * (z0 + z1) / 2]} s={[ENTRY_W, top, z1 - z0]} c="#9a9184" />);
  }
  return <group>{items}</group>;
}

function CellarStairs() {
  const items: React.ReactElement[] = [];
  const steps = 8, rise = -CELLAR / steps, run = 0.24, landingL = PIT_L - steps * run;
  for (let i = 0; i < steps; i++) {
    const top = -(i + 1) * rise;
    const zf = PIT.z2 - i * run;
    items.push(<Box key={i} p={[CELLAR_X, (top + CELLAR) / 2, zf - run / 2]} s={[PIT_W, top - CELLAR, run]} c="#8d867b" />);
  }
  // Boden, Wände und Geländer
  items.push(<Box key="floor" p={[CELLAR_X, CELLAR - 0.05, PIT.z1 + landingL / 2]} s={[PIT_W, 0.1, landingL]} c="#7d766b" />);
  [PIT.x1 - 0.1, PIT.x2 + 0.1].forEach((x, j) => items.push(<Box key={"w" + j} p={[x, CELLAR / 2 + 0.05, (PIT.z1 + PIT.z2) / 2]} s={[0.2, -CELLAR + 0.1, PIT_L]} c={C.stone} />));
  items.push(<Box key="wb" p={[CELLAR_X, CELLAR / 2, PIT.z2 + 0.1]} s={[PIT_W + 0.4, -CELLAR, 0.2]} c={C.stone} />);
  [PIT.x1 - 0.1, PIT.x2 + 0.1].forEach((x, j) => {
    items.push(<Beam key={"r" + j} a={[x, 0.95, PIT.z1 + 0.1]} b={[x, 0.95, PIT.z2]} color={C.iron} thick={0.05} depth={0.05} />);
    [PIT.z1 + 0.15, (PIT.z1 + PIT.z2) / 2, PIT.z2].forEach((z, n) => items.push(<Beam key={`p${j}${n}`} a={[x, 0.1, z]} b={[x, 0.95, z]} color={C.iron} thick={0.04} depth={0.04} />));
  });
  return <group>{items}</group>;
}

function groundWithHole(x1: number, x2: number, z1: number, z2: number, hole: boolean) {
  const s = new THREE.Shape();
  s.moveTo(x1, -z2); s.lineTo(x2, -z2); s.lineTo(x2, -z1); s.lineTo(x1, -z1); s.closePath();
  if (hole) {
    const h = new THREE.Path();
    h.moveTo(PIT.x1, -PIT.z2); h.lineTo(PIT.x1, -PIT.z1); h.lineTo(PIT.x2, -PIT.z1); h.lineTo(PIT.x2, -PIT.z2); h.closePath();
    s.holes.push(h);
  }
  return new THREE.ShapeGeometry(s);
}

function Garden() {
  const gz1 = FZ, gz2 = FZ + GARDEN;
  const lawn = useMemo(() => groundWithHole(-W / 2, W / 2, gz1, gz2, true), []);
  const items: React.ReactElement[] = [];
  // Zaun mit Tor-Öffnung
  for (let x = -W / 2; x <= W / 2 + 0.01; x += 0.25) {
    if (Math.abs(x - ENTRY_X) < 0.6) continue;
    items.push(<Box key={"f" + x} p={[x, 0.45, gz2]} s={[0.07, 0.9, 0.03]} c="#e8e0cc" />);
  }
  [0.25, 0.7].forEach((y) => {
    items.push(<Box key={"fl" + y} p={[(-W / 2 + ENTRY_X - 0.6) / 2, y, gz2 - 0.03]} s={[W / 2 - 0.6, 0.06, 0.03]} c="#e8e0cc" />);
    items.push(<Box key={"fr" + y} p={[(W / 2 + ENTRY_X + 0.6) / 2, y, gz2 - 0.03]} s={[W / 2 - 0.6, 0.06, 0.03]} c="#e8e0cc" />);
  });
  // Seitliche Hecken
  [-1, 1].forEach((s) => items.push(<Box key={"h" + s} p={[s * (W / 2 - 0.25), 0.4, (gz1 + gz2) / 2]} s={[0.5, 0.8, GARDEN]} c={C.hedge} r={1} />));
  // Weg zum Eingang
  items.push(<Box key="path" p={[ENTRY_X, 0.02, (FZ + 0.05 + 0.9 + 0.9 + gz2) / 2]} s={[1.1, 0.04, gz2 - (FZ + 1.85)]} c={C.path} />);
  // Büsche und Blumen
  const r = rng(7);
  [[-3.6, 6.2], [-2.2, 7.3], [-3.2, 7.6], [4, 7.4]].forEach(([x, z], i) => items.push(
    <mesh key={"b" + i} position={[x!, 0.35, z!]} castShadow><sphereGeometry args={[0.45 + r() * 0.2, 12, 10]} /><meshStandardMaterial color={C.hedge} roughness={1} /></mesh>));
  for (let i = 0; i < 26; i++) {
    const x = -4.2 + r() * 2.8, z = gz1 + 0.8 + r() * 2.8;
    items.push(<mesh key={"fl" + i} position={[x, 0.12, z]}><sphereGeometry args={[0.07, 6, 6]} /><meshStandardMaterial color={["#c44d3d", "#e8d24a", "#f0f0ea", "#9b5fa8"][i % 4]!} /></mesh>);
  }
  return (
    <group>
      <mesh geometry={lawn} rotation-x={-Math.PI / 2} position-y={0.015} receiveShadow><meshStandardMaterial color={C.lawn} roughness={1} /></mesh>
      {items}
    </group>
  );
}

function Ground() {
  const geo = useMemo(() => groundWithHole(-40, 40, -40, 40, true), []);
  return <mesh geometry={geo} rotation-x={-Math.PI / 2} receiveShadow><meshStandardMaterial color={C.grass} roughness={1} /></mesh>;
}

const FRONT: Cell[][] = [["w", "b", "D", "w", "b"], ["b", "w", "w", "b", "w"], ["w", "b", "w", "w", "b"]];
const BACK: Cell[][] = [["b", "w", "D", "b", "w"], ["w", "b", "w", "b", "w"], ["b", "w", "b", "w", "w"]];
const LEFT: Cell[][] = [["b", "w", "b", "b"], ["w", "b", "b", "w"], ["b", "w", "w", "b"]];
const RIGHT: Cell[][] = [["b", "b", "w", "b"], ["b", "w", "b", "w"], ["w", "b", "b", "w"]];

function House() {
  return (
    <group>
      {/* Steinsockel mit Kellergeschoss */}
      <Box p={[0, (BASE + CELLAR - 0.2) / 2, 0]} s={[W + 0.1, BASE - CELLAR + 0.2, D + 0.1]} c={C.stone} r={1} />
      {[[-3, -0.3], [3.5, -0.3], [-3.6, 4.2]].map(([x], i) => i < 2 ? <Box key={i} p={[x!, 0.5, FZ + 0.07]} s={[0.6, 0.35, 0.04]} c="#2f2f2a" /> : null)}
      <group position={[0, 0, FZ + 0.05]}><Door x={CELLAR_X} y={CELLAR} w={0.9} h={1.85} /></group>
      {/* Wände */}
      <Box p={[0, (BASE + TOP) / 2, 0]} s={[W - 0.1, TOP - BASE, D - 0.1]} c={C.yellow} r={0.95} />
      <group position={[0, 0, FZ]}><Facade width={W} rows={FRONT} seed={11} /></group>
      <group position={[0, 0, -FZ]} rotation={[0, Math.PI, 0]}><Facade width={W} rows={BACK} seed={23} /></group>
      <group position={[W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Facade width={D} rows={RIGHT} seed={5} /></group>
      <group position={[-W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><Facade width={D} rows={LEFT} seed={42} /></group>
      <Gable side={1} />
      <Gable side={-1} />
      <Roof />
      <Chimney />
      <EntryStairs />
      <EntryStairs back />
      <CellarStairs />
    </group>
  );
}

export default function HouseScene() {
  return (
    <div className="relative h-screen w-full bg-background" data-scene-ready>
      <Canvas shadows camera={{ position: [13, 7, 24], fov: 45 }}>
        <color attach="background" args={["#cfe3ee"]} />
        <hemisphereLight args={["#ffffff", "#7a8a5a", 0.6]} />
        <directionalLight position={[12, 25, 18]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
        <Environment>
          <Lightformer intensity={2} position={[0, 10, 0]} scale={[20, 20, 1]} />
          <Lightformer intensity={1} color="#bbd" position={[-10, 3, 0]} rotation-y={Math.PI / 2} scale={[20, 3, 1]} />
        </Environment>
        <House />
        <Garden />
        <Ground />
        <OrbitControls target={[0, 5, 2]} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-card/80 px-3 py-2 text-sm text-card-foreground">
        Fachwerkhaus · Keller + 3 Stockwerke + Dachstock · 12 m hoch
      </div>
    </div>
  );
}
