"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

const STATUS_COLORS = {
  READY: "#10b981",
  BUILDING: "#f59e0b",
  ERROR: "#ef4444",
  QUEUED: "#6366f1",
  NEVER_DEPLOYED: "#94a3b8",
};

interface MeshMapNode {
  siteId: string;
  name: string;
  status: string;
}

function SiteNode({
  position,
  site,
  onClick,
}: {
  position: [number, number, number];
  site: MeshMapNode;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = STATUS_COLORS[site.status as keyof typeof STATUS_COLORS] || "#94a3b8";

  useFrame((state) => {
    if (!meshRef.current) return;
    if (site.status === "BUILDING" || site.status === "QUEUED") {
      // Pulse animation for building / queued state
      meshRef.current.scale.setScalar(
        1 + Math.sin(state.clock.elapsedTime * 4) * 0.15
      );
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.12}
        color="#f1f5f9"
        anchorX="center"
      >
        {site.name}
      </Text>
    </group>
  );
}

function PulseRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime();
    const cycle = 3; // 3 seconds cycle
    const progress = (t % cycle) / cycle;
    const scale = progress * 3.5;
    ringRef.current.scale.set(scale, scale, 1);
    
    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = (1 - progress) * 0.35;
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.22, 64]} />
      <meshBasicMaterial
        color="#6366f1"
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RootNode() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.8}
          wireframe
        />
      </mesh>
      <Text position={[0, -0.5, 0]} fontSize={0.14} color="#818cf8" anchorX="center">
        DeployForge
      </Text>
      <PulseRing />
    </group>
  );
}

export function MeshMap({ sites }: { sites: MeshMapNode[] }) {
  // Position site nodes in a circle around the root
  const positions = useMemo<[number, number, number][]>(() => {
    return sites.map((_, i) => {
      const angle = (i / sites.length) * Math.PI * 2;
      const radius = Math.max(2.2, sites.length * 0.4);
      return [
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 0.8,
        Math.sin(angle) * radius,
      ];
    });
  }, [sites]);

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden border border-white/5 bg-[#080810]/80 backdrop-blur-md">
      <Canvas camera={{ position: [0, 3.5, 5.5], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} color="#6366f1" intensity={2.5} />

        <RootNode />

        {sites.map((site, i) => (
          <group key={site.siteId}>
            {/* Edge line from root to site node */}
            <Line
              points={[[0, 0, 0], positions[i]]}
              color="#334155"
              lineWidth={1}
            />
            <SiteNode
              position={positions[i]}
              site={site}
              onClick={() => {
                window.location.href = `/projects/${site.siteId}`;
              }}
            />
          </group>
        ))}

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
