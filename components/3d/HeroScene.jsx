'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Text3D, Center, Environment, PerspectiveCamera } from '@react-three/drei'
import ParticleField from './ParticleField'

function FloatingRing({ position, scale, rotationSpeed, color }) {
  const mesh = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    mesh.current.rotation.x = time * rotationSpeed
    mesh.current.rotation.z = time * rotationSpeed * 0.5
  })
  
  return (
    <mesh ref={mesh} position={position} scale={scale}>
      <torusGeometry args={[1, 0.02, 16, 100]} />
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  )
}

function GlowingSphere({ position, scale, color }) {
  const mesh = useRef()
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    mesh.current.scale.setScalar(scale * (1 + Math.sin(time * 2) * 0.1))
  })
  
  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

function LogoText() {
  return (
    <Center>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
        <Text3D
          font="/fonts/Inter_Bold.json"
          size={0.8}
          height={0.15}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.01}
          bevelOffset={0}
          bevelSegments={5}
        >
          INVYRA
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.9}
            roughness={0.1}
            emissive="#d4af37"
            emissiveIntensity={0.15}
          />
        </Text3D>
      </Float>
    </Center>
  )
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#d4af37" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c9a27e" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        color="#d4af37"
      />
      
      <LogoText />
      
      <FloatingRing position={[0, 0, -2]} scale={2} rotationSpeed={0.3} color="#d4af37" />
      <FloatingRing position={[0, 0, -3]} scale={2.5} rotationSpeed={0.2} color="#c9a27e" />
      <FloatingRing position={[0, 0, -4]} scale={3} rotationSpeed={0.1} color="#b8860b" />
      
      <GlowingSphere position={[-3, 2, -1]} scale={1} color="#d4af37" />
      <GlowingSphere position={[3, -1.5, -2]} scale={0.8} color="#c9a27e" />
      <GlowingSphere position={[2.5, 2, -3]} scale={0.6} color="#b8860b" />
      <GlowingSphere position={[-2.5, -2, -2]} scale={0.7} color="#d4af37" />
      
      <ParticleField count={300} color="#d4af37" />
      
      <Environment preset="night" />
    </>
  )
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
