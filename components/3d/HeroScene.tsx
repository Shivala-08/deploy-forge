"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#0f172a"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

function Arc({
  start,
  end,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const progress = useRef(0);
  const materialRef = useRef<THREE.LineBasicMaterial>();

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.5,
      (start[2] + end[2]) / 2,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    );
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(50), [curve]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  useFrame((_, delta) => {
    progress.current += delta * 0.3;
    if (progress.current > 1) progress.current = 0;

    if (materialRef.current) {
      const p = progress.current;
      materialRef.current.opacity = Math.sin(p * Math.PI) * 0.8;
    }
  });

  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    return new THREE.Line(geometry, mat);
  }, [geometry, color]);

  // Update the material ref so the first useFrame callback can animate opacity
  useFrame(() => {
    materialRef.current = lineObj.material as THREE.LineBasicMaterial;
  }, 0);

  return <primitive object={lineObj} />;
}

function Particles() {
  const count = 200;
  const mesh = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame(() => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += 0.001;
      if (arr[i + 1] > 2) arr[i + 1] = -2;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        color="#818cf8"
        size={0.01}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

export default function HeroScene() {
  const arcs: Array<{
    start: [number, number, number];
    end: [number, number, number];
    color: string;
  }> = useMemo(() => {
    const cities: [number, number, number][] = [
      [0.8, 0.6, 0],
      [-0.5, 0.8, 0.3],
      [0.3, -0.7, 0.6],
      [-0.8, 0.2, 0.5],
      [0.6, 0.3, -0.7],
      [-0.3, -0.8, 0.2],
      [0.9, 0.1, 0.4],
      [-0.7, 0.5, -0.3],
      [0.2, 0.9, 0.1],
      [-0.6, -0.4, 0.8],
    ];
    return Array.from({ length: 12 }, () => {
      const i = Math.floor(Math.random() * cities.length);
      let j = Math.floor(Math.random() * cities.length);
      while (j === i) j = Math.floor(Math.random() * cities.length);
      return {
        start: cities[i],
        end: cities[j],
        color: Math.random() > 0.5 ? "#6366f1" : "#10b981",
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 3, 5]} intensity={0.5} />
        <Globe />
        {arcs.map((arc, i) => (
          <Arc key={i} {...arc} />
        ))}
        <Particles />
      </Canvas>
    </div>
  );
}
