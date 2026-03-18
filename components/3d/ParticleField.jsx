'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField({ count = 500, color = '#d4af37' }) {
  const mesh = useRef()
  const light = useRef()
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20
      const y = (Math.random() - 0.5) * 20
      const z = (Math.random() - 0.5) * 20
      const speed = 0.01 + Math.random() * 0.02
      const offset = Math.random() * Math.PI * 2
      temp.push({ x, y, z, speed, offset })
    }
    return temp
  }, [count])

  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    particles.forEach((particle, i) => {
      positions[i * 3] = particle.x
      positions[i * 3 + 1] = particle.y
      positions[i * 3 + 2] = particle.z
      sizes[i] = 0.02 + Math.random() * 0.03
    })
    
    return [positions, sizes]
  }, [particles, count])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    if (mesh.current) {
      const positionsAttr = mesh.current.geometry.attributes.position
      
      particles.forEach((particle, i) => {
        const i3 = i * 3
        positionsAttr.array[i3] = particle.x + Math.sin(time * particle.speed + particle.offset) * 0.5
        positionsAttr.array[i3 + 1] = particle.y + Math.cos(time * particle.speed + particle.offset) * 0.3
        positionsAttr.array[i3 + 2] = particle.z + Math.sin(time * particle.speed * 0.5 + particle.offset) * 0.4
      })
      
      positionsAttr.needsUpdate = true
      mesh.current.rotation.y = time * 0.02
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
