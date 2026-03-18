'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function YoRHaSatelliteRings({ color = '#000000' }) {
  const ringsRef = useRef()
  const innerRingRef = useRef()
  const outerRingRef = useRef()
  const particlesRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (innerRingRef.current) {
      innerRingRef.current.rotation.x = time * 0.2
      innerRingRef.current.rotation.y = time * 0.3
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x = time * -0.1
      outerRingRef.current.rotation.y = time * -0.2
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y = time * 0.05
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.02
      particlesRef.current.rotation.x = time * 0.01
    }
  })

  // Create particles
  const particleCount = 200
  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15
      sizes[i] = Math.random() * 0.05
    }
    return [positions, sizes]
  }, [particleCount])

  return (
    <group ref={ringsRef}>
      {/* Inner Ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
      </mesh>
      
      {/* Outer Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[4, 0.01, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* Floating Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={particleCount} array={sizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial 
          color={color} 
          size={0.05} 
          sizeAttenuation 
          transparent 
          opacity={0.4} 
        />
      </points>

      {/* Central Core (Optional glowing point) */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}
