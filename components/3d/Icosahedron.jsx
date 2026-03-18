'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Icosahedron({ color = '#d4af37' }) {
  const meshRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.2
      meshRef.current.rotation.y = time * 0.3
    }
  })

  return (
    <mesh ref={meshRef} scale={1.5}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color={color} 
        wireframe={true} 
        transparent 
        opacity={0.3} 
      />
    </mesh>
  )
}
