import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Farm Model Component
function FarmModel() {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF("/models/farm/scene.gltf");

    // Slow auto-rotation
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            <primitive
                object={scene}
                scale={0.015}
                position={[0, -1.5, 0]}
            />
        </group>
    );
}

// Loading Fallback
function LoadingFallback() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hsl(152, 50%, 50%)" wireframe />
        </mesh>
    );
}

// Main 3D Farm Scene Component
export const Farm3DScene: React.FC<{ className?: string }> = ({ className = "" }) => {
    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                camera={{ position: [8, 6, 8], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
            >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[10, 15, 10]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <directionalLight
                    position={[-5, 10, -5]}
                    intensity={0.4}
                />

                {/* Sky gradient background */}
                <color attach="background" args={["#e8f4fc"]} />

                {/* Environment for reflections */}
                <Environment preset="sunset" />

                {/* Farm Model */}
                <Suspense fallback={<LoadingFallback />}>
                    <FarmModel />
                </Suspense>

                {/* Ground shadow */}
                <ContactShadows
                    position={[0, -1.5, 0]}
                    opacity={0.4}
                    scale={20}
                    blur={2}
                />

                {/* Camera controls */}
                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={5}
                    maxDistance={20}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 2.2}
                    autoRotate={false}
                    target={[0, 0, 0]}
                />
            </Canvas>
        </div>
    );
};

// Preload the model
useGLTF.preload("/models/farm/scene.gltf");
