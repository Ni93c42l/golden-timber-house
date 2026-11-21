import type React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Building2, Layers, RotateCcw, Flame, Fan, Server, Heater, Grid2X2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HouseDetails from '@/components/HouseDetails';
import HouseInterior, { Chimney, type InteriorPalette } from '@/components/HouseInterior';
import { HOUSE, LEVELS, HEATING_MODES, HEATING_SYSTEMS, liftedOffset, facadeOpacity, type HeatingMode, type HeatingSystem } from '@/lib/house-layout';

// Maße in Metern
const { width: W, depth: D, socle: SOCLE, storey: FLOOR, top: TOP, roof: ROOF } = HOUSE;
const FZ = D / 2;
const C = {
  plaster: "#f1efe9", ochre: "#e3b46a", ochreDark: "#c99550", roof: "#3a3532",
  glass: "#3f5566", frame: "#f7f7f4", door: "#7c2622", pipe: "#222222", stone: "#9b958c", green: "#4e6b35",
};
const BAYS = [-4.9, -2.45, 0, 2.3, 4.7]; // Fensterachsen (x)

type V3 = [number, number, number];
function Box({ p, s, c, r = 0.9, m }: { p: V3; s: V3; c: string; r?: number; m?: THREE.Texture }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      {m ? <meshStandardMaterial map={m} roughness={r} /> : <meshStandardMaterial color={c} roughness={r} />}
    </mesh>
  );
}

// Weisser Putz mit horizontalen Nutfugen
function usePlaster(w: number, h: number) {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 512;
    const g = cv.getContext("2d");
    if (!g) return new THREE.CanvasTexture(cv);
    g.fillStyle = C.plaster; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(120,110,100,${Math.random() * 0.04})`; g.fillRect(Math.random() * 512, Math.random() * 512, 3, 3); }
    g.fillStyle = "rgba(110,105,100,0.45)";
    for (let y = 0; y < 512; y += 64) g.fillRect(0, y, 512, 4);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(w / 4, h / 0.42 / 8);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [w, h]);
}

function Louvres({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const n = Math.floor(h / 0.08), items: React.ReactElement[] = [];
  for (let i = 1; i < n; i++) items.push(<Box key={i} p={[x, y - h / 2 + i * (h / n), 0.04]} s={[w - 0.12, 0.025, 0.03]} c={C.ochreDark} />);
  return <group>{items}</group>;
}

// Ein Fensterladen (Lamellen oder geschlossene Füllung mit Rautenausschnitt)
function Shutter({ x, y, w, h, louvre }: { x: number; y: number; w: number; h: number; louvre: boolean }) {
  return (
    <group>
      <Box p={[x, y, 0]} s={[w, h, 0.05]} c={C.ochre} r={0.7} />
      {louvre ? <Louvres x={x} y={y} w={w} h={h} /> : (
        <group>
          <Box p={[x, y + h * 0.2, 0.03]} s={[w - 0.14, h * 0.45, 0.02]} c={C.ochreDark} />
          <Box p={[x, y - h * 0.27, 0.03]} s={[w - 0.14, h * 0.35, 0.02]} c={C.ochreDark} />
          <mesh position={[x, y + h * 0.36, 0.05]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.1, 0.1, 0.02]} /><meshStandardMaterial color="#3a2a1a" /></mesh>
        </group>
      )}
    </group>
  );
}

type Win = "closedPanel" | "closedLouvre" | "openLouvre" | "openPanel";
function Window({ x, y, kind, w = 1.25, h = 1.9 }: { x: number; y: number; kind: Win; w?: number; h?: number }) {
  const louvre = kind === "closedLouvre" || kind === "openLouvre";
  const open = kind === "openLouvre" || kind === "openPanel";
  return (
    <group>
      {/* Ocker-Gewände */}
      <Box p={[x, y, 0.02]} s={[w + 0.36, h + 0.36, 0.06]} c={C.ochre} />
      <Box p={[x, y - h / 2 - 0.22, 0.1]} s={[w + 0.55, 0.1, 0.2]} c={C.ochre} />
      <Box p={[x, y + h / 2 + 0.25, 0.08]} s={[w + 0.5, 0.12, 0.14]} c={C.ochre} />
      {/* Glas und Sprossen */}
      <Box p={[x, y, 0.04]} s={[w, h, 0.04]} c={C.glass} r={0.2} />
      <group position={[0, 0, 0.07]}>
        <Box p={[x, y, 0]} s={[0.06, h, 0.04]} c={C.frame} />
        <Box p={[x, y + h * 0.18, 0]} s={[w, 0.06, 0.04]} c={C.frame} />
        {[-1, 1].map((s) => <Box key={s} p={[x + (s * w) / 2, y, 0]} s={[0.07, h, 0.05]} c={C.frame} />)}
        {[-1, 1].map((s) => <Box key={"h" + s} p={[x, y + (s * h) / 2, 0]} s={[w, 0.07, 0.05]} c={C.frame} />)}
      </group>
      {open
        ? [-1, 1].map((s) => <group key={s} position={[0, 0, 0.08]}><Shutter x={x + s * (w / 2 + 0.2 + w / 4)} y={y} w={w / 2} h={h + 0.05} louvre={louvre} /></group>)
        : [-1, 1].map((s) => <group key={s} position={[0, 0, 0.1]}><Shutter x={x + (s * w) / 4} y={y} w={w / 2 - 0.01} h={h} louvre={louvre} /></group>)}
    </group>
  );
}

function Door({ x }: { x: number }) {
  const y0 = SOCLE - 0.05, w = 1.1, h = 2.6;
  return (
    <group>
      {/* Ocker-Portal */}
      <Box p={[x, y0 + h / 2 + 0.15, 0.04]} s={[w + 0.7, h + 0.6, 0.1]} c={C.ochre} />
      <Box p={[x, y0 + h + 0.5, 0.1]} s={[w + 0.9, 0.16, 0.2]} c={C.ochre} />
      <Box p={[x, y0 + h / 2, 0.06]} s={[w, h, 0.06]} c={C.door} r={0.6} />
      <Box p={[x, y0 + h - 0.35, 0.1]} s={[w - 0.12, 0.5, 0.03]} c={C.glass} r={0.2} />
      <Box p={[x, y0 + h - 0.62, 0.11]} s={[w, 0.08, 0.04]} c="#5d1b18" />
      <Box p={[x, y0 + 1.3, 0.11]} s={[0.4, 1.1, 0.02]} c="#1d1d1d" />
      {/* Hausnummer */}
      <Box p={[x, y0 + h + 0.25, 0.11]} s={[0.22, 0.14, 0.02]} c="#2d5b8a" />
      {/* Stufen */}
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} p={[x, (SOCLE - i * 0.32) / 2, FZ + 0.1 + 0.18 + i * 0.32 - FZ]} s={[1.6 + i * 0.1, SOCLE - i * 0.32, 0.36 + i * 0.64]} c={C.stone} />
      ))}
    </group>
  );
}

function CellarWindow({ x }: { x: number }) {
  const bars: React.ReactElement[] = [];
  for (let i = -2; i <= 2; i++) bars.push(<Box key={i} p={[x + i * 0.17, 0.5, 0.06]} s={[0.025, 0.55, 0.025]} c="#e8e8e8" />);
  return (
    <group>
      <Box p={[x, 0.48, 0.02]} s={[0.95, 0.55, 0.04]} c="#1b1b1b" />
      <mesh position={[x, 0.75, 0.03]}><circleGeometry args={[0.48, 20, 0, Math.PI]} /><meshStandardMaterial color="#1b1b1b" /></mesh>
      {bars}
      <Box p={[x, 0.55, 0.06]} s={[0.9, 0.025, 0.025]} c="#e8e8e8" />
    </group>
  );
}

function Roof() {
  const o = 0.45, th = 0.25, h = D / 2, k = ROOF / h;
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-(h + o), -o * k); s.lineTo(0, ROOF); s.lineTo(h + o, -o * k);
    s.lineTo(h + o, -o * k + th); s.lineTo(0, ROOF + th); s.lineTo(-(h + o), -o * k + th); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: W + 0.3, bevelEnabled: false });
  }, []);
  return (
    <mesh geometry={geo} position={[-(W + 0.3) / 2, TOP + 0.35, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={C.roof} roughness={0.85} />
    </mesh>
  );
}

// Gauben: aussen klein mit Bogen, Mitte gross mit Dreiecksgiebel
function Dormer({ x, big }: { x: number; big?: boolean }) {
  const z = FZ - 0.7, yBase = TOP + 0.35 + ROOF * (1 - z / (D / 2));
  const w = big ? 1.4 : 0.85, h = big ? 1.2 : 0.75, dep = 1.9;
  const cap = useMemo(() => {
    const sh = new THREE.Shape();
    if (big) { sh.moveTo(-w / 2 - 0.12, 0); sh.lineTo(w / 2 + 0.12, 0); sh.lineTo(0, 0.6); sh.closePath(); }
    else { const rr = w / 2 + 0.08; sh.moveTo(rr, 0); sh.absarc(0, 0, rr, 0, Math.PI, false); sh.closePath(); }
    return new THREE.ExtrudeGeometry(sh, { depth: dep + 0.1, bevelEnabled: false });
  }, [big, w]);
  // Keil: verbindet die Gaube mit dem Dach, damit sie nicht schwebt
  const wedge = useMemo(() => {
    const h2 = w / 2 + 0.14, dz = FZ - z + 0.1;
    const sh = new THREE.Shape();
    sh.moveTo(-h2, 0); sh.lineTo(h2, 0); sh.lineTo(0, dz); sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: yBase - 0.2, bevelEnabled: false });
  }, [w, z, yBase]);
  return (
    <group position={[x, yBase, z]}>
      <Box p={[0, h / 2 - 0.2, -dep / 2 + 0.05]} s={[w, h, dep]} c={C.ochre} />
      <Box p={[0, h / 2 - 0.15, 0.07]} s={[w - 0.3, h - 0.25, 0.04]} c={C.glass} r={0.2} />
      <Box p={[0, h / 2 - 0.15, 0.09]} s={[0.04, h - 0.25, 0.03]} c={C.frame} />
      <mesh geometry={cap} position={[0, h - 0.2, -dep + 0.2]} castShadow>
        <meshStandardMaterial color={big ? C.roof : C.ochre} roughness={0.7} />
      </mesh>
      <mesh geometry={wedge} position={[0, 0.05 - yBase, FZ - z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color={C.roof} roughness={0.85} />
      </mesh>
    </group>
  );
}

// Giebelwände: schliessen den Dachraum seitlich
function Gables() {
  const h = D / 2;
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-h, 0); s.lineTo(h, 0); s.lineTo(h, 0.35); s.lineTo(0, 0.35 + ROOF); s.lineTo(-h, 0.35); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false });
  }, [h]);
  return (
    <mesh geometry={geo} position={[-W / 2, TOP, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={C.plaster} roughness={0.95} />
    </mesh>
  );
}

function Antenna() {
  return (
    <group position={[1.2, TOP + 0.35 + ROOF, 0]}>
      <Box p={[0, 1.1, 0]} s={[0.05, 2.2, 0.05]} c="#777" />
      {[1.4, 1.75, 2.05].map((y, i) => <Box key={y} p={[0, y, 0]} s={[1.4 - i * 0.3, 0.03, 0.03]} c="#777" />)}
    </group>
  );
}

function House() {
  const front = usePlaster(W, TOP - SOCLE);
  const side = usePlaster(D, TOP - SOCLE);
  const y1 = SOCLE + 1.55, y2 = SOCLE + FLOOR + 1.6;
  const ground: (Win | "door")[] = ["closedPanel", "closedPanel", "door", "openPanel", "closedPanel"];
  const upper: Win[] = ["closedLouvre", "openLouvre", "closedLouvre", "closedLouvre", "closedLouvre"];
  return (
    <group>
      {/* Ocker-Sockel */}
      <Box p={[0, SOCLE / 2 - 0.5, 0]} s={[W + 0.12, SOCLE + 1, D + 0.12]} c={C.ochre} r={1} />
      {/* Putzfassade */}
      <mesh position={[0, (SOCLE + TOP) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, TOP - SOCLE, D]} />
        {[side, side, front, front, front, front].map((t, i) => <meshStandardMaterial key={i} attach={`material-${i}`} map={t} roughness={0.95} />)}
      </mesh>
      {/* Eckpilaster, Gurtgesims, Traufgesims */}
      {[-1, 1].map((s) => <Box key={s} p={[s * (W / 2 - 0.18), (SOCLE + TOP) / 2, FZ + 0.03]} s={[0.4, TOP - SOCLE, 0.08]} c={C.ochre} />)}
      <Box p={[0, SOCLE + FLOOR - 0.05, FZ + 0.05]} s={[W + 0.1, 0.22, 0.12]} c={C.ochre} />
      <Box p={[0, TOP + 0.05, FZ + 0.1]} s={[W + 0.3, 0.3, 0.22]} c={C.ochre} />
      <Box p={[0, TOP + 0.25, FZ + 0.2]} s={[W + 0.5, 0.18, 0.3]} c={C.ochreDark} />
      <Box p={[0, TOP + 0.05, -FZ - 0.1]} s={[W + 0.3, 0.3, 0.22]} c={C.ochre} />
      <group position={[0, 0, FZ + 0.01]}>
        {ground.map((k, i) => k === "door" ? <Door key={i} x={BAYS[i] ?? 0} /> : <Window key={i} x={BAYS[i] ?? 0} y={y1} kind={k} h={2.0} />)}
        {upper.map((k, i) => <Window key={"u" + i} x={BAYS[i] ?? 0} y={y2} kind={k} h={1.75} />)}
        <group position={[0, 0, 0.07]}>{[-5.3, -3.2, 1.4, 4.8].map((x) => <CellarWindow key={x} x={x} />)}</group>
      </group>
      {/* Rückseite: einfache Fenster */}
      <group position={[0, 0, -FZ - 0.01]} rotation={[0, Math.PI, 0]}>
        {BAYS.map((x, i) => i === 2 ? <Door key={i} x={x} /> : <Window key={i} x={x} y={y1} kind={i % 2 ? "openLouvre" : "closedLouvre"} h={2.0} />)}
        {BAYS.map((x, i) => <Window key={"u" + i} x={x} y={y2} kind="closedLouvre" h={1.75} />)}
      </group>
      {/* Linke Seite: je drei Fenster */}
      <group position={[-W / 2 - 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {[-2.8, 0, 2.8].map((x) => <Window key={x} x={x} y={y1} kind="closedPanel" h={2.0} />)}
        {[-2.8, 0, 2.8].map((x) => <Window key={"u" + x} x={x} y={y2} kind="closedLouvre" h={1.75} />)}
      </group>
      {/* Fallrohre */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box p={[s * (W / 2 + 0.12), (TOP + 0.3) / 2, FZ + 0.15]} s={[0.12, TOP + 0.3, 0.12]} c={C.pipe} r={0.4} />
        </group>
      ))}
      <Box p={[0, TOP + 0.45, FZ + 0.45]} s={[W + 0.4, 0.14, 0.16]} c={C.pipe} r={0.4} />
      <Roof />
      <Gables />
      {[-3.6, 0.6, 4.4].map((x) => <Dormer key={x} x={x} big={x === 0.6} />)}
      <Antenna />
    </group>
  );
}

function Street() {
  const items: React.ReactElement[] = [];
  // Geländer und Büsche vor dem Haus
  for (let x = -6; x <= 6; x += 2) items.push(<Box key={"p" + x} p={[x, 0.5, FZ + 3.4]} s={[0.06, 1, 0.06]} c="#888" r={0.4} />);
  items.push(<Box key="rail" p={[0, 1, FZ + 3.4]} s={[12, 0.06, 0.06]} c="#888" r={0.4} />);
  const shrubs: [number, number][] = [[-5.5, 0.9], [-1.7, 0.7], [3.2, 0.7], [6, 0.8]];
  shrubs.forEach(([x, s], i) => items.push(
    <group key={"b" + i}>
      <Box p={[x, 0.2, FZ + 0.7]} s={[0.5, 0.4, 0.5]} c="#a06a45" />
      <mesh position={[x, 0.4 + s * 0.6, FZ + 0.7]} castShadow><sphereGeometry args={[s * 0.6, 14, 12]} /><meshStandardMaterial color={C.green} roughness={1} /></mesh>
    </group>));
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#8d8a84" roughness={1} /></mesh>
      <Box p={[0, 0.01, FZ + 1.75]} s={[W + 4, 0.04, 3.5]} c="#b3aca0" />
      {/* Garten hinter dem Haus */}
      <Box p={[0, 0.02, -FZ - 5]} s={[W + 4, 0.04, 10]} c="#5f7d3e" r={1} />
      {items}
    </group>
  );
}

function HouseSlice({ layer, selected, colors, onSelect, ghost = false }: { layer: number; selected: number; colors: InteriorPalette; onSelect: (level: number) => void; ghost?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const invalidate = useThree(state => state.invalidate);
  const lower = (LEVELS.find(item => item.id === layer)?.y ?? -2) + 0.015;
  const upper = (LEVELS.find(item => item.id === layer + 1)?.y ?? 40) - 0.015;
  const planes = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 1, 0), -lower), new THREE.Plane(new THREE.Vector3(0, -1, 0), upper)], [lower, upper]);
  const target = ghost ? 0 : liftedOffset(layer, selected);
  useLayoutEffect(() => {
    ref.current?.traverse(node => {
      if (node instanceof THREE.Mesh) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(material => {
          material.clippingPlanes = planes; material.clipShadows = true;
          if (ghost) {
            material.transparent = true; material.depthWrite = false; material.side = THREE.DoubleSide;
            material.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
              shader.uniforms['nearOpacity'] = { value: facadeOpacity(1) };
              shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 facadePosition;\nvarying vec3 facadeNormal;').replace('#include <begin_vertex>', '#include <begin_vertex>\nfacadePosition = (modelMatrix * vec4(position, 1.0)).xyz;\nfacadeNormal = normalize(mat3(modelMatrix) * normal);');
              shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 facadePosition;\nvarying vec3 facadeNormal;\nuniform float nearOpacity;').replace('#include <opaque_fragment>', `vec3 wallNormal = abs(facadePosition.x) / 6.25 > abs(facadePosition.z) / 4.5 ? vec3(sign(facadePosition.x), 0.0, 0.0) : vec3(0.0, 0.0, sign(facadePosition.z));\nfloat facing = dot(wallNormal, normalize(cameraPosition - facadePosition));\ndiffuseColor.a *= facing > 0.0 ? nearOpacity : 1.0;\n${layer < 3 ? 'if (abs(facadeNormal.y) > 0.9) discard;' : 'if (abs(facadePosition.x) < 6.0) diffuseColor.a = 0.04;'}\n#include <opaque_fragment>`);
            };
            material.customProgramCacheKey = () => `selected-facade-${layer}`;
            node.castShadow = false;
          }
          material.needsUpdate = true;
        });
      }
    });
    invalidate();
  }, [planes, invalidate, ghost, layer]);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    group.position.y = reduced ? target : THREE.MathUtils.damp(group.position.y, target, 7, Math.min(delta, 0.05));
    if (Math.abs(group.position.y - target) < 0.02) group.position.y = target;
    planes[0]?.set(new THREE.Vector3(0, 1, 0), -lower - group.position.y);
    planes[1]?.set(new THREE.Vector3(0, -1, 0), upper + group.position.y);
    group.userData['lift'] = group.position.y;
    if (ghost) document.querySelector('[data-house-view]')?.setAttribute('data-facade-ready', String(layer));
    if (group.position.y !== target) invalidate();
  });
  return <group ref={ref} name={ghost ? `Durchsichtige-Fassade-${layer}` : `Haus-Stockwerk-${layer}`} onClick={event => {
    if (event.delta > 5) return;
    const localY = event.point.y - (ref.current?.position.y ?? 0);
    if (localY < lower || localY > upper) return;
    event.stopPropagation(); onSelect(layer);
  }}><House />{layer === 3 && !ghost && <Chimney colors={colors} />}</group>;
}

function OpeningHouse({ selected, colors, onSelect, heatingMode, heatingSystem }: { selected: number | null; colors: InteriorPalette; onSelect: (level: number) => void; heatingMode: HeatingMode; heatingSystem: HeatingSystem }) {
  const clickClosedHouse = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return;
    event.stopPropagation();
    const level = event.point.y < SOCLE ? 0 : event.point.y < SOCLE + FLOOR ? 1 : event.point.y < TOP ? 2 : 3;
    onSelect(level);
  };
  if (selected === null) return <group onClick={clickClosedHouse}><House /><Chimney colors={colors} /></group>;
  return <group name="Aufgeklapptes-Haus">
    {LEVELS.filter(item => item.id !== selected || item.id === 3).map(item => <HouseSlice key={item.id} layer={item.id} selected={selected} colors={colors} onSelect={onSelect} />)}
    <HouseSlice key={`facade-${selected}`} layer={selected} selected={selected} colors={colors} onSelect={onSelect} ghost />
    <HouseInterior key={selected} level={selected} colors={colors} heatingMode={heatingMode} heatingSystem={heatingSystem} />
  </group>;
}

function ViewCamera({ interior, level, reset }: { interior: boolean; level: number; reset: number }) {
  const { camera, invalidate, size } = useThree();
  const y = LEVELS.find(item => item.id === level)?.y ?? SOCLE;
  const distanceScale = Math.max(1, 0.82 / (size.width / size.height));
  useEffect(() => {
    const targetY = interior ? (level === 0 ? 12 : level === 1 ? 12 : 11) : 5;
    const offset: V3 = interior ? [22, 12, 32] : [-9, -1, 18];
    camera.position.set(offset[0] * distanceScale, targetY + offset[1] * distanceScale, offset[2] * distanceScale);
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, invalidate, interior, y, reset, distanceScale]);
  useFrame(() => { document.querySelector('[data-house-view]')?.setAttribute('data-scene-ready', 'true'); });
  return <OrbitControls key={`${interior}-${level}-${reset}`} target={[0, interior ? (level < 2 ? 12 : 11) : 5, 0]} minDistance={5} maxDistance={100} maxPolarAngle={Math.PI / 2.05} />;
}

export default function StadthausScene() {
  const [interior, setInterior] = useState(false);
  const [level, setLevel] = useState(1);
  const [heatingMode, setHeatingMode] = useState<HeatingMode>('gas');
  const [heatingSystem, setHeatingSystem] = useState<HeatingSystem>('radiators');
  const [reset, setReset] = useState(0);
  const [colors, setColors] = useState<InteriorPalette | null>(null);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const palette = Object.fromEntries(['wall', 'wood', 'seam', 'tile', 'grout', 'rug', 'metal', 'brick', 'cap'].map(name => [name, css.getPropertyValue(`--house-${name}`).trim()])) as InteriorPalette;
    setColors(palette);
  }, []);
  const current = LEVELS.find(item => item.id === level) ?? LEVELS[1];
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background" data-house-view={interior ? 'interior' : 'exterior'}>
      <Canvas shadows frameloop="demand" onCreated={({ gl }) => { gl.localClippingEnabled = true; }} camera={{ position: [-9, 4, 18], fov: 50 }}>
        <color attach="background" args={["#a9c8e8"]} />
        <hemisphereLight args={["#ffffff", "#8a8070", 0.7]} />
        <directionalLight position={[-10, 22, 16]} intensity={2.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
        <Environment>
          <Lightformer intensity={2} position={[0, 10, 0]} scale={[20, 20, 1]} />
          <Lightformer intensity={1} color="#cde" position={[-10, 3, 5]} rotation-y={Math.PI / 2} scale={[20, 3, 1]} />
        </Environment>
        {colors && <OpeningHouse selected={interior ? level : null} colors={colors} heatingMode={heatingMode} heatingSystem={heatingSystem} onSelect={selected => { setLevel(selected); setInterior(true); }} />}
        {(!interior || level > 0) && <Street />}
        <ViewCamera interior={interior} level={level} reset={reset} />
      </Canvas>
      <header className="absolute inset-x-3 top-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card/95 p-3 text-card-foreground sm:inset-x-4 sm:top-4">
        <h1 className="text-lg font-semibold">Stadthaus</h1>
        <div className="flex items-center gap-1" role="group" aria-label="Hausansicht">
          <Button size="sm" variant={interior ? 'ghost' : 'default'} aria-pressed={!interior} onClick={() => setInterior(false)}><Building2 />Aussen</Button>
          <Button size="sm" variant={interior ? 'default' : 'ghost'} aria-pressed={interior} onClick={() => setInterior(true)}><Layers />Innen</Button>
          <Button size="icon" variant="ghost" title="Ansicht zurücksetzen" aria-label="Ansicht zurücksetzen" onClick={() => setReset(value => value + 1)}><RotateCcw /></Button>
        </div>
        {interior && <div className="flex w-full flex-wrap gap-1 border-t border-border pt-2" role="group" aria-label="Stockwerk">
          {LEVELS.map(item => <Button key={item.id} size="sm" variant={item.id === level ? 'secondary' : 'ghost'} aria-pressed={item.id === level} onClick={() => setLevel(item.id)}>{item.name}</Button>)}
        </div>}
        {interior && level === 0 && <div className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-2">
          <h3 className="text-xs font-semibold">Heizung</h3>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Heizungsart">
            {HEATING_MODES.map(mode => {
              const Icon = mode.id === 'gas' ? Flame : mode.id === 'heat-pump' ? Fan : Server;
              return <Button key={mode.id} size="sm" variant={heatingMode === mode.id ? 'default' : 'ghost'} aria-pressed={heatingMode === mode.id} onClick={() => setHeatingMode(mode.id)}><Icon />{mode.name}</Button>;
            })}
          </div>
        </div>}
        {interior && <div className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-2">
          <h3 className="text-xs font-semibold">Heizsystem</h3>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Heizsystem">
            {HEATING_SYSTEMS.map(system => {
              const Icon = system.id === 'radiators' ? Heater : Grid2X2;
              return <Button key={system.id} size="sm" variant={heatingSystem === system.id ? 'default' : 'ghost'} aria-pressed={heatingSystem === system.id} onClick={() => setHeatingSystem(system.id)}><Icon />{system.name}</Button>;
            })}
          </div>
        </div>}
        <details open={!interior} className="w-full border-t border-border pt-2">
          <summary className="cursor-pointer text-xs font-semibold">Hausangaben</summary>
          <div className="mt-2"><HouseDetails exterior={!interior} /></div>
        </details>
      </header>
      {interior && <div className="pointer-events-none absolute inset-x-3 bottom-4 rounded-md border border-border bg-card/95 px-4 py-3 text-card-foreground sm:inset-x-auto sm:left-4 sm:max-w-lg">
        <h2 className="mb-1 text-sm font-semibold">{current.name}</h2>
        <p className="text-xs leading-5 text-muted-foreground">{current.rooms.join(' · ')}</p>
        {level === 0 && heatingMode === 'server' && <p className="mt-1 text-xs text-muted-foreground">Serverrack · 1 m × 1 m × 2 m</p>}
      </div>}
    </div>
  );
}
