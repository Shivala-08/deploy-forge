"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0006;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.1, 48, 48]} />
      <meshStandardMaterial
        color="#312e81"
        wireframe
        transparent
        opacity={0.15}
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
      (start[1] + end[1]) / 2 + 0.4,
      (start[2] + end[2]) / 2,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    );
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(40), [curve]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame((_, delta) => {
    progress.current += delta * 0.25;
    if (progress.current > 1) progress.current = 0;

    if (materialRef.current) {
      const p = progress.current;
      materialRef.current.opacity = Math.sin(p * Math.PI) * 0.6;
    }
  });

  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    return new THREE.Line(geometry, mat);
  }, [geometry, color]);

  useFrame(() => {
    materialRef.current = lineObj.material as THREE.LineBasicMaterial;
  }, 0);

  return <primitive object={lineObj} />;
}

function Particles() {
  const count = 180;
  const mesh = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 5;
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
      arr[i + 1] += 0.0008;
      if (arr[i + 1] > 2.5) arr[i + 1] = -2.5;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        color="#818cf8"
        size={0.012}
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

// 3D Physics body properties
interface Body3D {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  size: number;
  type: "sphere" | "cube" | "torus" | "dodecahedron" | "cylinder";
  color: string;
  isDragging: boolean;
  hovered: boolean;
}

function FloatingObject({
  body,
  onDragStart,
  onDragEnd,
}: {
  body: Body3D;
  onDragStart: (id: number, ray: THREE.Ray) => void;
  onDragEnd: (id: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Sync positions to THREE mesh
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.copy(body.position);
    if (!body.isDragging) {
      ref.current.rotation.x += body.rotationSpeed.x;
      ref.current.rotation.y += body.rotationSpeed.y;
      ref.current.rotation.z += body.rotationSpeed.z;
    }
    body.hovered = hovered;
  });

  // Highlight and scale on hover
  const scale = hovered ? body.size * 1.25 : body.size;

  return (
    <mesh
      ref={ref}
      scale={[scale, scale, scale]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHover(false);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onDragStart(body.id, e.ray);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        onDragEnd(body.id);
      }}
    >
      {body.type === "sphere" && <sphereGeometry args={[0.2, 16, 16]} />}
      {body.type === "cube" && <boxGeometry args={[0.3, 0.3, 0.3]} />}
      {body.type === "torus" && <torusGeometry args={[0.18, 0.06, 8, 24]} />}
      {body.type === "dodecahedron" && <dodecahedronGeometry args={[0.22]} />}
      {body.type === "cylinder" && <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />}

      <meshStandardMaterial
        color={body.color}
        emissive={body.color}
        emissiveIntensity={hovered || body.isDragging ? 1.0 : 0.45}
        metalness={0.7}
        roughness={0.2}
      />
    </mesh>
  );
}

function InteractivePhysicsPlayground({ globalMode }: { globalMode: string }) {
  const { viewport, camera } = useThree();
  const mouse3D = useRef(new THREE.Vector3());
  const dragActiveRef = useRef<{ id: number; zDepth: number } | null>(null);

  // Spawns 3D shapes
  const bodies = useMemo<Body3D[]>(() => {
    const types: Array<Body3D["type"]> = ["sphere", "cube", "torus", "dodecahedron", "cylinder"];
    const colors = ["#6366f1", "#4f46e5", "#10b981", "#059669", "#a855f7", "#ec4899"];

    return Array.from({ length: 9 }, (_, i) => {
      const angle = (i / 9) * Math.PI * 2;
      const radius = 1.3 + Math.random() * 0.5;
      return {
        id: i,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 0.6
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.004
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        size: 0.7 + Math.random() * 0.4,
        type: types[i % types.length],
        color: colors[i % colors.length],
        isDragging: false,
        hovered: false,
      };
    });
  }, []);

  const handleDragStart = (id: number, ray: THREE.Ray) => {
    const body = bodies.find((b) => b.id === id);
    if (!body) return;
    body.isDragging = true;
    body.velocity.set(0, 0, 0);

    // Save initial Z depth relative to the camera
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    const zDepth = -body.position.clone().sub(camera.position).dot(cameraDir);

    dragActiveRef.current = { id, zDepth };
  };

  const handleDragEnd = (id: number) => {
    const body = bodies.find((b) => b.id === id);
    if (body) {
      body.isDragging = false;
    }
    dragActiveRef.current = null;
  };

  useFrame((state) => {
    // Project mouse coordinates into 3D space at Z=0
    mouse3D.current.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
      0
    );

    // Update drag position if active
    if (dragActiveRef.current) {
      const { id, zDepth } = dragActiveRef.current;
      const body = bodies.find((b) => b.id === id);
      if (body) {
        // Project ray onto plane at zDepth
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -zDepth);
        const intersection = new THREE.Vector3();
        state.raycaster.ray.intersectPlane(plane, intersection);

        // Store drag speed as velocity
        const prevPos = body.position.clone();
        body.position.copy(intersection);
        body.velocity.copy(body.position).sub(prevPos).multiplyScalar(0.75); // damping drag throwing
      }
    }

    const aspect = viewport.width / viewport.height;
    const boundX = (viewport.width / 2) * 1.05;
    const boundY = (viewport.height / 2) * 1.05;
    const boundZ = 0.8;

    bodies.forEach((body) => {
      if (body.isDragging) return;

      // Gravity force
      if (globalMode === "gravity") {
        body.velocity.y -= 0.003;
      }

      // Small zero-gravity drift
      if (globalMode === "antigravity") {
        body.velocity.x += (Math.random() - 0.5) * 0.0003;
        body.velocity.y += (Math.random() - 0.5) * 0.0003;
        body.velocity.z += (Math.random() - 0.5) * 0.0001;
      }

      // Mouse pointer repulsion
      const distToMouse = body.position.distanceTo(mouse3D.current);
      if (distToMouse < 1.6) {
        const force = (1.6 - distToMouse) * 0.004;
        const dir = body.position.clone().sub(mouse3D.current).normalize();
        body.velocity.addScaledVector(dir, force);
      }

      // Damping friction
      body.velocity.multiplyScalar(0.975);

      // Update position
      body.position.add(body.velocity);

      // Boundary Collisions (bounce)
      const restitution = 0.7;
      // X boundaries
      if (body.position.x > boundX) {
        body.position.x = boundX;
        body.velocity.x = -Math.abs(body.velocity.x) * restitution;
      } else if (body.position.x < -boundX) {
        body.position.x = -boundX;
        body.velocity.x = Math.abs(body.velocity.x) * restitution;
      }

      // Y boundaries
      if (body.position.y > boundY) {
        body.position.y = boundY;
        body.velocity.y = -Math.abs(body.velocity.y) * restitution;
      } else if (body.position.y < -boundY) {
        body.position.y = -boundY;
        body.velocity.y = Math.abs(body.velocity.y) * restitution;
      }

      // Z boundaries
      if (body.position.z > boundZ) {
        body.position.z = boundZ;
        body.velocity.z = -Math.abs(body.velocity.z) * restitution;
      } else if (body.position.z < -boundZ) {
        body.position.z = -boundZ;
        body.velocity.z = Math.abs(body.velocity.z) * restitution;
      }

      // Body-to-Body elastic collision approximation
      bodies.forEach((other) => {
        if (other.id === body.id) return;
        const dist = body.position.distanceTo(other.position);
        const minDist = 0.36; // combined radius
        if (dist < minDist) {
          const overlap = minDist - dist;
          const normal = body.position.clone().sub(other.position).normalize();
          
          // Separate overlapping shapes
          body.position.addScaledVector(normal, overlap * 0.5);
          other.position.addScaledVector(normal, -overlap * 0.5);

          // Elastic bounce
          const relativeVelocity = body.velocity.clone().sub(other.velocity);
          const velocityAlongNormal = relativeVelocity.dot(normal);

          if (velocityAlongNormal < 0) {
            const impulseScalar = -(1 + restitution) * velocityAlongNormal / 2;
            body.velocity.addScaledVector(normal, impulseScalar);
            other.velocity.addScaledVector(normal, -impulseScalar);
          }
        }
      });
    });
  });

  return (
    <>
      {bodies.map((body) => (
        <FloatingObject
          key={body.id}
          body={body}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      ))}
    </>
  );
}

export default function HeroScene({ mode = "antigravity" }: { mode?: string }) {
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
    return Array.from({ length: 10 }, () => {
      const i = Math.floor(Math.random() * cities.length);
      let j = Math.floor(Math.random() * cities.length);
      while (j === i) j = Math.floor(Math.random() * cities.length);
      return {
        start: cities[i],
        end: cities[j],
        color: Math.random() > 0.55 ? "#6366f1" : "#10b981",
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 z-0 select-none">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 0, 0]} color="#818cf8" intensity={1.8} distance={6} />
        <directionalLight position={[4, 5, 4]} intensity={0.65} />
        
        <Globe />
        
        {arcs.map((arc, i) => (
          <Arc key={i} {...arc} />
        ))}
        
        <Particles />
        
        <InteractivePhysicsPlayground globalMode={mode} />
      </Canvas>
    </div>
  );
}
