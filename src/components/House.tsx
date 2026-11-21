import type React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Maße in Metern: 3 Stockwerke à 3 m + 3 m Dach = 12 m
const W = 10, D = 8, FLOOR = 3, FLOORS = 3, ROOF = 3, T = 0.2;
const WALL_H = FLOOR * FLOORS;
const YELLOW = "#e9c33f", TIMBER = "#4a2c17", ROOFC = "#8e3b26", GLASS = "#9fc4d8";

function Beam({ a, b, depth = T }: { a: [number, number, number]; b: [number, number, number]; depth?: number }) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <boxGeometry args={[T, len + T, depth]} />
      <meshStandardMaterial color={TIMBER} roughness={0.9} />
    </mesh>
  );
}

// Eine Fassadenseite im lokalen Raum (x entlang der Wand, z=0 Außenfläche)
function Facade({ width }: { width: number }) {
  const items: React.ReactElement[] = [];
  const bays = Math.round(width / 2.5);
  const bw = width / bays;
  const x0 = -width / 2;
  for (let f = 0; f <= FLOORS; f++) items.push(<Beam key={"h" + f} a={[x0, f * FLOOR, 0]} b={[-x0, f * FLOOR, 0]} />);
  for (let f = 0; f < FLOORS; f++) {
    const y = f * FLOOR;
    for (let i = 0; i <= bays; i++) items.push(<Beam key={`p${f}-${i}`} a={[x0 + i * bw, y, 0]} b={[x0 + i * bw, y + FLOOR, 0]} />);
    for (let i = 0; i < bays; i++) {
      const xa = x0 + i * bw, xb = xa + bw, cx = (xa + xb) / 2;
      const win = i % 2 === 1 || f > 0 ? (i !== 0 && i !== bays - 1) : false;
      if (f === 0 && i === Math.floor(bays / 2)) {
        // Tür
        items.push(<mesh key={`d${i}`} position={[cx, 1.1, 0.05]}><boxGeometry args={[1.1, 2.2, 0.1]} /><meshStandardMaterial color={TIMBER} /></mesh>);
      } else if (win) {
        items.push(<Beam key={`wr${f}${i}`} a={[xa, y + 1, 0]} b={[xb, y + 1, 0]} />);
        items.push(<Beam key={`wt${f}${i}`} a={[xa, y + 2.3, 0]} b={[xb, y + 2.3, 0]} />);
        items.push(<mesh key={`g${f}${i}`} position={[cx, y + 1.65, 0.02]}><boxGeometry args={[bw - 0.6, 1.1, 0.05]} /><meshStandardMaterial color={GLASS} metalness={0.3} roughness={0.1} /></mesh>);
        items.push(<Beam key={`wx${f}${i}`} a={[cx, y + 1.1, 0.04]} b={[cx, y + 2.2, 0.04]} depth={0.08} />);
      } else {
        // Andreaskreuz
        items.push(<Beam key={`x1${f}${i}`} a={[xa, y, 0]} b={[xb, y + FLOOR, 0]} />);
        items.push(<Beam key={`x2${f}${i}`} a={[xb, y, 0]} b={[xa, y + FLOOR, 0]} />);
      }
    }
  }
  return <group>{items}</group>;
}

function Gable() {
  const shape = new THREE.Shape();
  shape.moveTo(-D / 2, 0); shape.lineTo(D / 2, 0); shape.lineTo(0, ROOF); shape.closePath();
  return (
    <>
      {[1, -1].map((s) => (
        <group key={s} position={[(s * W) / 2, WALL_H, 0]} rotation={[0, s * Math.PI / 2, 0]}>
          <mesh position={[0, 0, -0.05]} castShadow><shapeGeometry args={[shape]} /><meshStandardMaterial color={YELLOW} side={THREE.DoubleSide} /></mesh>
          <group position={[0, 0, 0.06]}>
            <Beam a={[-D / 2, 0, 0]} b={[0, ROOF, 0]} />
            <Beam a={[D / 2, 0, 0]} b={[0, ROOF, 0]} />
            <Beam a={[0, 0, 0]} b={[0, ROOF, 0]} />
            <Beam a={[-D / 4, 0, 0]} b={[0, ROOF / 2, 0]} />
            <Beam a={[D / 4, 0, 0]} b={[0, ROOF / 2, 0]} />
          </group>
        </group>
      ))}
    </>
  );
}

function Roof() {
  const o = 0.5;
  const half = D / 2 + o;
  const slopeLen = Math.hypot(half, ROOF * (half / (D / 2)));
  const ang = Math.atan2(ROOF, D / 2);
  return (
    <>
      {[1, -1].map((s) => (
        <mesh key={s} castShadow position={[0, WALL_H + ROOF / 2 - (o * Math.tan(ang)) / 2 + 0.1, (s * (D / 2 - o)) / 2]} rotation={[s * ang, 0, 0]}>
          <boxGeometry args={[W + 2 * o, 0.15, slopeLen]} />
          <meshStandardMaterial color={ROOFC} roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

function House() {
  return (
    <group>
      <mesh position={[0, WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W - 0.1, WALL_H, D - 0.1]} />
        <meshStandardMaterial color={YELLOW} roughness={0.95} />
      </mesh>
      <group position={[0, 0, D / 2]}><Facade width={W} /></group>
      <group position={[0, 0, -D / 2]} rotation={[0, Math.PI, 0]}><Facade width={W} /></group>
      <group position={[W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}><Facade width={D} /></group>
      <group position={[-W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><Facade width={D} /></group>
      <Gable />
      <Roof />
      <mesh position={[2.5, WALL_H + ROOF - 0.5, 0]} castShadow><boxGeometry args={[0.8, 2.2, 0.8]} /><meshStandardMaterial color="#7a4a3a" /></mesh>
    </group>
  );
}

export default function HouseScene() {
  return (
    <div className="h-screen w-full bg-background" data-scene-ready>
      <Canvas shadows camera={{ position: [18, 10, 20], fov: 45 }}>
        <color attach="background" args={["#cfe3ee"]} />
        <hemisphereLight args={["#ffffff", "#7a8a5a", 0.6]} />
        <directionalLight position={[15, 25, 10]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} />
        <Environment>
          <Lightformer intensity={2} position={[0, 10, 0]} scale={[20, 20, 1]} />
          <Lightformer intensity={1} color="#bbd" position={[-10, 3, 0]} rotation-y={Math.PI / 2} scale={[20, 3, 1]} />
        </Environment>
        <House />
        <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[40, 48]} /><meshStandardMaterial color="#6f8f4a" roughness={1} /></mesh>
        <ContactShadows position={[0, 0.01, 0]} scale={30} opacity={0.4} blur={2} />
        <OrbitControls target={[0, 5, 0]} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-card/80 px-3 py-2 text-sm text-card-foreground">
        Fachwerkhaus · 3 Stockwerke · 12 m hoch — ziehen zum Drehen, scrollen zum Zoomen
      </div>
    </div>
  );
}
