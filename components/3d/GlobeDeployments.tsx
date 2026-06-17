"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Deploy location data — in production, this would come from an API
interface DeployLocation {
  lat: number;
  lng: number;
  status: "READY" | "BUILDING" | "ERROR";
}

function latLngToVec3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function GlobeWireframe() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Ocean sphere */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.2} />
      </mesh>
      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.001, 32, 32]} />
        <meshBasicMaterial color="#1e293b" wireframe transparent opacity={0.15} />
      </mesh>
      {/* Equator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.99, 1.01, 128]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function DeployPulse({
  position,
  status,
}: {
  position: [number, number, number];
  status: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const phase = useRef(Math.random() * Math.PI * 2);

  const color = useMemo(() => {
    switch (status) {
      case "READY": return "#10b981";
      case "BUILDING": return "#f59e0b";
      case "ERROR": return "#ef4444";
      default: return "#6366f1";
    }
  }, [status]);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + phase.current) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      const s = 1 + ((state.clock.elapsedTime + phase.current) % 2) * 0.5;
      ringRef.current.scale.setScalar(s);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - ((state.clock.elapsedTime + phase.current) % 2) / 2) * 0.6;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.035, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function DeployArc({
  from,
  to,
  status,
}: {
  from: [number, number, number];
  to: [number, number, number];
  status: string;
}) {
  const progress = useRef(0);
  const materialRef = useRef<THREE.LineBasicMaterial>();

  const color = useMemo(() => {
    switch (status) {
      case "READY": return "#10b981";
      case "BUILDING": return "#f59e0b";
      case "ERROR": return "#ef4444";
      default: return "#6366f1";
    }
  }, [status]);

  const lineObj = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.4,
      (from[2] + to[2]) / 2,
    ];
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
    const points = curve.getPoints(50);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    return new THREE.Line(geo, mat);
  }, [from, to, color]);

  useFrame(() => {
    materialRef.current = lineObj.material as THREE.LineBasicMaterial;
  }, 0);

  useFrame((_, delta) => {
    progress.current += delta * 0.4;
    if (progress.current > 1) progress.current = 0;
    if (materialRef.current) {
      materialRef.current.opacity = Math.sin(progress.current * Math.PI) * 0.7;
    }
  });

  return <primitive object={lineObj} />;
}

function GlobeScene({ deployments }: { deployments: DeployLocation[] }) {
  const positions = useMemo(
    () => deployments.map((d) => ({ ...d, pos: latLngToVec3(d.lat, d.lng, 1.02) })),
    [deployments]
  );

  const arcs = useMemo(() => {
    if (positions.length < 2) return [];
    const result: Array<{
      from: [number, number, number];
      to: [number, number, number];
      status: string;
    }> = [];
    for (let i = 0; i < Math.min(positions.length - 1, 8); i++) {
      const from = positions[i];
      const to = positions[i + 1];
      result.push({ from: from.pos, to: to.pos, status: from.status });
    }
    return result;
  }, [positions]);

  return (
    <group>
      <GlobeWireframe />
      {positions.map((p, i) => (
        <DeployPulse key={i} position={p.pos} status={p.status} />
      ))}
      {arcs.map((arc, i) => (
        <DeployArc key={`arc-${i}`} {...arc} />
      ))}
    </group>
  );
}

// Default deployments for when no real data is available
const DEFAULT_DEPLOYMENTS: DeployLocation[] = [
  { lat: 37.7749, lng: -122.4194, status: "READY" },
  { lat: 40.7128, lng: -74.006, status: "READY" },
  { lat: 51.5074, lng: -0.1278, status: "BUILDING" },
  { lat: 35.6762, lng: 139.6503, status: "READY" },
  { lat: -33.8688, lng: 151.2093, status: "READY" },
  { lat: 52.52, lng: 13.405, status: "ERROR" },
  { lat: 48.8566, lng: 2.3522, status: "READY" },
  { lat: 1.3521, lng: 103.8198, status: "BUILDING" },
];

export default function GlobeDeployments({
  deployments,
}: {
  deployments?: DeployLocation[];
}) {
  const data = deployments && deployments.length > 0 ? deployments : DEFAULT_DEPLOYMENTS;

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.6} />
        <pointLight position={[-5, -3, -5]} intensity={0.2} color="#6366f1" />
        <GlobeScene deployments={data} />
      </Canvas>
    </div>
  );
}
