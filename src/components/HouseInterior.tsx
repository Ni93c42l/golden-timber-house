import { Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVELS, stairBetween } from '@/lib/house-layout';

export type InteriorPalette = Record<'wall' | 'wood' | 'seam' | 'tile' | 'grout' | 'rug' | 'metal' | 'brick' | 'cap', string>;
type V3 = [number, number, number];
const pointers = import.meta.glob<{ default: { url: string } }>('../assets/models/*.glb.asset.json', { eager: true });
function modelUrl(name: string) {
  const pointer = pointers[`../assets/models/${name}.glb.asset.json`];
  if (!pointer) throw new Error(`Möbelmodell fehlt: ${name}`);
  return pointer.default.url;
}
function Solid({ p, s, color, map }: { p: V3; s: V3; color: string; map?: THREE.Texture }) {
  return <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={color} map={map ?? null} roughness={0.85} /></mesh>;
}
function Furniture({ name, p, width, angle = 0 }: { name: string; p: V3; width: number; angle?: number }) {
  const invalidate = useThree(state => state.invalidate);
  const { scene } = useGLTF(modelUrl(name));
  useEffect(() => { invalidate(); }, [invalidate, scene]);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = width / Math.max(size.x, 0.01);
    const center = box.getCenter(new THREE.Vector3());
    clone.scale.multiplyScalar(scale);
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    clone.traverse(node => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true; } });
    return clone;
  }, [scene, width]);
  return <group name={name} position={p} rotation-y={angle}><primitive object={object} /></group>;
}
function useFloorTexture(colors: InteriorPalette, tiled: boolean) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = tiled ? colors.tile : colors.wood; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = tiled ? colors.grout : colors.seam;
      ctx.lineWidth = tiled ? 2 : 1;
      for (let y = 0; y < 256; y += tiled ? 64 : 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
        for (let x = (y % 64 === 0 ? 0 : 64); x < 256; x += tiled ? 64 : 128) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + (tiled ? 64 : 32)); ctx.stroke();
        }
      }
      if (!tiled) {
        ctx.globalAlpha = 0.18;
        for (let i = 0; i < 500; i++) { const x = (i * 73) % 256, y = (i * 31) % 256; ctx.fillStyle = colors.seam; ctx.fillRect(x, y, 9 + i % 30, 0.5); }
      }
    }
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
    return t;
  }, [colors, tiled]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
function Staircase({ level, colors }: { level: number; colors: InteriorPalette }) {
  const stair = stairBetween(level);
  if (!stair) return null;
  const stepH = stair.rise / stair.steps, stepD = stair.run / stair.steps;
  return <group name={`Treppe-${level}-${level + 1}`}>
    {Array.from({ length: stair.steps }, (_, i) => {
      const z = 0.4 - (i + 0.5) * stepD, y = (i + 1) * stepH;
      return <group key={i}>
        <Solid p={[0, y - 0.045, z]} s={[stair.width, 0.09, stepD + 0.03]} color={colors.wood} />
        <Solid p={[0, y - stepH / 2, z + stepD / 2]} s={[stair.width, stepH, 0.04]} color={colors.seam} />
        {i % 3 === 0 && [-1, 1].map(sign => <Solid key={sign} p={[sign * 0.76, y + 0.43, z]} s={[0.045, 0.86, 0.045]} color={colors.metal} />)}
      </group>;
    })}
    {[-1, 1].map(sign => <mesh key={sign} position={[sign * 0.76, stair.rise / 2 + 0.88, -1.6]} rotation-x={Math.atan2(stair.rise, stair.run)} castShadow>
      <boxGeometry args={[0.07, 0.07, Math.hypot(stair.rise, stair.run)]} /><meshStandardMaterial color={colors.wood} />
    </mesh>)}
  </group>;
}
function FurnishedRooms({ level, colors }: { level: number; colors: InteriorPalette }) {
  const f = (name: string, x: number, z: number, width: number, angle = 0, y = 0.03) => <Furniture key={`${name}-${x}-${z}`} name={name} p={[x, y, z]} width={width} angle={angle} />;
  const objects = level === 1 ? [
    f('loungeSofa', -4.8, 2.3, 2.8, Math.PI / 2), f('loungeChair', -2, 3.1, 1.05, -Math.PI / 2),
    f('tableCoffee', -3.4, 2.1, 1.25), f('cabinetTelevision', -1.75, 0.8, 1.6, -Math.PI / 2),
    f('televisionModern', -1.75, 0.8, 1.15, -Math.PI / 2, 0.63), f('lampRoundFloor', -5.35, 0.8, 0.45),
    f('pottedPlant', -5.35, 3.6, 0.7),
    f('kitchenFridge', -5.25, -2.8, 0.9), f('kitchenSink', -3.95, -3.5, 1),
    f('kitchenCabinet', -2.95, -3.5, 1), f('kitchenStove', -1.95, -3.5, 1),
    f('kitchenCabinet', -5.3, -1.6, 1, Math.PI / 2),
    f('table', 3.65, 2.2, 2), ...[2.55, 4.65].flatMap(x => [f('chair', x, 1.35, 0.45), f('chair', x, 3.05, 0.45, Math.PI)]),
    f('bookcaseOpen', 5.6, 0.85, 1.1, -Math.PI / 2), f('pottedPlant', 5.4, 3.7, 0.65),
    f('toilet', 4.8, -3.5, 0.55), f('bathroomSink', 2.7, -3.5, 0.8),
  ] : level === 2 ? [
    f('bedDouble', -3.7, 2.2, 1.9), f('cabinetBed', -5.1, 2.9, 0.7), f('cabinetBed', -2.35, 2.9, 0.7),
    f('bookcaseOpen', -5.55, 0.8, 1.2, Math.PI / 2), f('pottedPlant', -5.4, 3.65, 0.6),
    f('bedSingle', -4.7, -2.4, 1.1), f('desk', -2.6, -3.6, 1.5), f('chairDesk', -2.6, -2.7, 0.6),
    f('bookcaseOpen', -1.8, -1.3, 1), f('desk', 3.6, 0.9, 1.8), f('chairDesk', 3.6, 1.9, 0.65, Math.PI),
    f('computerScreen', 3.6, 0.9, 0.6, 0, 0.97), f('bookcaseOpen', 5.5, 2.9, 1.4, -Math.PI / 2),
    f('bathtub', 4.65, -3.45, 2.1), f('toilet', 2.1, -3.5, 0.55), f('bathroomSink', 4.8, -1.2, 0.9, Math.PI),
  ] : level === 3 ? [
    f('bedDouble', -3.7, 1.4, 1.8), f('cabinetBed', -5, 2, 0.7), f('loungeChair', 3.1, 1.5, 1.05),
    f('tableCoffee', 4.6, 1.5, 0.9), f('bookcaseOpen', 5.4, -0.6, 1.4, -Math.PI / 2),
    f('lampRoundFloor', 2, 0.8, 0.45), f('cardboardBoxClosed', -3.5, -2.8, 0.8),
    f('cardboardBoxClosed', -4.6, -2.9, 0.7), f('cardboardBoxClosed', 3.2, -2.9, 0.7),
  ] : [
    f('washer', -4.8, -3.3, 0.8), f('dryer', -3.7, -3.3, 0.8), f('bathroomSink', -2.5, -3.4, 0.8),
    f('desk', -3.6, 1.2, 2.4), f('chair', -3.6, 2.3, 0.5), f('bookcaseOpen', -5.3, 2.9, 1.6, Math.PI / 2),
    f('bookcaseOpen', 5.4, -2.3, 1.6, -Math.PI / 2), f('bookcaseOpen', 3, -3.65, 1.6),
    f('cardboardBoxClosed', 3, 2, 0.8), f('cardboardBoxClosed', 4.2, 2, 0.9), f('cardboardBoxClosed', 3.1, 3, 0.7),
  ];
  useFrame(() => { document.querySelector('[data-house-view]')?.setAttribute('data-interior-ready', String(level)); });
  useEffect(() => () => { document.querySelector('[data-house-view]')?.removeAttribute('data-interior-ready'); }, [level]);
  return <group name={`Möbel-Geschoss-${level}`}>{objects}
    {(level === 1 || level === 2) && <Solid p={[-3.65, 0.012, 2.1]} s={[3.9, 0.02, 2.9]} color={colors.rug} />}
  </group>;
}
export default function HouseInterior({ level, colors }: { level: number; colors: InteriorPalette }) {
  const wood = useFloorTexture(colors, false), tile = useFloorTexture(colors, true);
  const y = LEVELS.find(item => item.id === level)?.y ?? 1.3;
  const floorMap = level === 0 ? tile : wood;
  return <group position={[0, y, 0]} name="Innenräume">
    {/* Vier Platten lassen den Treppenschacht tatsächlich offen. */}
    <Solid p={[-3.625, -0.09, 0]} s={[5.25, 0.18, 9]} color={colors.wall} map={floorMap} />
    <Solid p={[3.625, -0.09, 0]} s={[5.25, 0.18, 9]} color={colors.wall} map={floorMap} />
    <Solid p={[0, -0.09, 2.5]} s={[2, 0.18, 4]} color={colors.wall} map={floorMap} />
    <Solid p={[0, -0.09, -4.05]} s={[2, 0.18, 0.9]} color={colors.wall} map={floorMap} />
    {level > 0 && <Solid p={[3.6, 0.005, -2.3]} s={[5, 0.015, 4.2]} color={colors.wall} map={tile} />}
    {/* Niedrige Schnittkanten statt verdeckender Vorderwände. */}
    {[-1, 1].map(sign => <group key={sign}>
      <Solid p={[sign * 6.1, 0.45, 0]} s={[0.3, 0.9, 9]} color={colors.wall} />
      <Solid p={[sign * 3.6, 0.45, -0.2]} s={[5, 0.9, 0.16]} color={colors.wall} />
      {/* Türen zum Flur: echte Lücken in den Trennwänden. */}
      {[[3.6, 1.6], [1.4, 0.8], [-0.65, 0.8], [-3.25, 2.5]].map(([z, length], i) => z !== undefined && length !== undefined &&
        <Solid key={i} p={[sign, 0.45, z]} s={[0.16, 0.9, length]} color={colors.wall} />)}
    </group>)}
    <Solid p={[0, 0.65, -4.35]} s={[12.5, 1.3, 0.3]} color={colors.wall} />
    <Solid p={[0, 0.12, 4.35]} s={[12.5, 0.24, 0.3]} color={colors.wall} />
    {level === 0 && <Solid p={[0, -0.09, -1.6]} s={[2, 0.18, 4]} color={colors.wall} map={tile} />}
    <Staircase level={level} colors={colors} />
    {level > 0 && <group position={[0, (LEVELS.find(item => item.id === level - 1)?.y ?? y) - y, 0]}><Staircase level={level - 1} colors={colors} /></group>}
    {level > 0 && [-1, 1].map(sign => <Solid key={sign} p={[sign * 0.8, 0.45, -1.6]} s={[0.045, 0.9, 4]} color={colors.metal} />)}
    {level === 3 && [-2.8, 2.8].map(z => <mesh key={z} position={[0, 1.6, z]} rotation-x={z < 0 ? 0.67 : -0.67}>
      <boxGeometry args={[12.1, 0.14, 0.18]} /><meshStandardMaterial color={colors.wood} />
    </mesh>)}
    <Suspense fallback={null}><FurnishedRooms level={level} colors={colors} /></Suspense>
  </group>;
}

export function Chimney({ colors }: { colors: InteriorPalette }) {
  return <group name="Kamin-hintere-Dachseite" position={[-2.5, 9.15, -2.1]}>
    <Solid p={[0, 1.25, 0]} s={[0.8, 2.5, 0.8]} color={colors.brick} />
    {[0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1].map(y => <Solid key={y} p={[0, y, 0]} s={[0.815, 0.025, 0.815]} color={colors.grout} />)}
    <Solid p={[0, 2.53, 0]} s={[1, 0.15, 1]} color={colors.cap} />
    <Solid p={[0, 2.62, 0]} s={[0.48, 0.035, 0.48]} color={colors.metal} />
  </group>;
}