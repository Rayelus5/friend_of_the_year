import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Sparkles } from "@react-three/drei";
import { Mesh } from "three";

// Componente principal exportado. Colócalo dentro de tu mockup visual
// en lugar del bloque de contenido actual.
// Ejemplo: <AwardMockup3D className="w-full h-full" />

export default function AwardMockup3D({ className = "w-full h-full" }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            {/* Canvas 3D dentro del mockup */}
            <Canvas shadows camera={{ position: [0, 1.8, 4], fov: 40 }}>
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>

            {/* Sobreposición 2D ligera para dar sensación de UI/vidrio */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
    );
}

// Escena: trofeo central, escenario, focos y chispas (sparkles) como confeti.
function Scene() {
    return (
        <>
            {/* Luces principales */}
            <ambientLight intensity={0.35} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

            {/* Luz de relleno cálida desde atrás */}
            <pointLight position={[-6, 2, -3]} intensity={0.6} />

            {/* Entorno para reflejos suaves */}
            <Environment preset="city" />

            {/* Suelo reflectante sutil */}
            <group position={[0, -1.05, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[20, 20]} />
                    <meshStandardMaterial metalness={0.2} roughness={0.6} color={"#0b1220"} opacity={0.85} transparent />
                </mesh>
            </group>

            {/* Escenario (plataforma) */}
            <mesh position={[0, -0.8, 0]} castShadow>
                <cylinderGeometry args={[1.2, 1.5, 0.4, 64]} />
                <meshStandardMaterial color={'#0f1724'} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Trofeo animado */}
            <Trophy position={[0, 0.05, 0]} />

            {/* Sparkles como confeti/partículas festivas */}
            <Sparkles count={60} scale={2.5} size={7} speed={0.6} noise={0.6} />

            {/* Controles suaves (útiles en desarrollo; se pueden quitar en producción) */}
            <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.2} />
        </>
    );
}

// Trofeo simple construido combinando geometrías
function Trophy({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
    const group = useRef<Mesh>(null!);

    // Rotación lenta y oscilación vertical
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (group.current) {
            group.current.rotation.y = Math.sin(t * 0.4) * 0.25; // giro lento
            group.current.position.y = Math.abs(Math.sin(t * 1.2)) * 0.03 + 0.02; // pulso sutil
        }
    });

    return (
        <group ref={group} position={position}>
            {/* Base del trofeo */}
            <mesh position={[0, -0.25, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.5, 0.25, 48]} />
                <meshStandardMaterial color={'#111827'} metalness={0.9} roughness={0.25} />
            </mesh>

            {/* Columnita */}
            <mesh position={[0, -0.02, 0]} castShadow>
                <cylinderGeometry args={[0.12, 0.12, 0.28, 32]} />
                <meshStandardMaterial color={'#f59e0b'} metalness={1} roughness={0.15} />
            </mesh>

            {/* Copa principal */}
            <mesh position={[0, 0.45, 0]} castShadow>
                <cylinderGeometry args={[0.28, 0.42, 0.5, 48, 1, false]} />
                <meshStandardMaterial color={'#f59e0b'} metalness={1} roughness={0.08} envMapIntensity={1} />
            </mesh>

            {/* Asa izquierda */}
            <mesh position={[-0.4, 0.45, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
                <torusGeometry args={[0.28, 0.06, 16, 60]} />
                <meshStandardMaterial color={'#f59e0b'} metalness={1} roughness={0.08} />
            </mesh>

            {/* Asa derecha */}
            <mesh position={[0.4, 0.45, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
                <torusGeometry args={[0.28, 0.06, 16, 60]} />
                <meshStandardMaterial color={'#f59e0b'} metalness={1} roughness={0.08} />
            </mesh>

            {/* Placa frontal con número (puedes mapear textura aquí) */}
            <mesh position={[0, -0.05, 0.42]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.24, 0.14, 0.02]} />
                <meshStandardMaterial color={'#111827'} metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Pequeño glow/emisión debajo */}
            <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, 0.9, 64]} />
                <meshBasicMaterial toneMapped={false} transparent opacity={0.12} />
            </mesh>
        </group>
    );
}

/*
Instrucciones de uso:
1. Asegúrate de tener instaladas las dependencias:
   npm install three @react-three/fiber @react-three/drei

2. Importa y usa el componente en tu mockup original.
   Reemplaza el bloque de elementos falsos por:

   <AwardMockup3D className="w-full h-full max-w-2xl mx-auto" />

3. Ajusta camera / luces / número de sparkles según necesites.
4. Si quieres más efectos (confeti físico, partículas con gravedad,
   o un modelo 3D real de trofeo), puedo añadir carga de GLTF y animaciones.
*/