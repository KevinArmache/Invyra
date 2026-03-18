'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const themeColors = {
  elegant: { primary: '#d4af37', secondary: '#c9a27e', accent: '#b8860b' },
  romantic: { primary: '#e8b4b8', secondary: '#d4a5a5', accent: '#c48b8b' },
  modern: { primary: '#8b9dc3', secondary: '#6b7aa1', accent: '#4a5568' },
  festive: { primary: '#ff6b6b', secondary: '#feca57', accent: '#48dbfb' },
  nature: { primary: '#6b8e6b', secondary: '#8fbc8f', accent: '#556b2f' },
  cosmic: { primary: '#9d4edd', secondary: '#7b2cbf', accent: '#5a189a' }
}

export default function InvitationParticles({ theme = 'elegant', count = 400, config }) {
  const mesh = useRef()
  
  const baseColors = themeColors[theme] || themeColors.elegant
  const colors = config?.colors ? {
    primary: config.colors.primary || baseColors.primary,
    secondary: config.colors.secondary || baseColors.secondary,
    accent: config.colors.accent || baseColors.accent,
  } : baseColors

  const actualCount = config?.particleCount || count
  const particleSpeed = config?.particleSpeed || 0.01
  const particleSize = config?.particleSize || 0.08
  const particleRadius = config?.particleRadius || 15 
  const particleOpacity = config?.particleOpacity ?? 0.8
  const particleShape = config?.particleShape || 'sphere'
  const particleBlending = config?.particleBlending === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending
  const metalness = config?.particleMetalness ?? 0.8
  const roughness = config?.particleRoughness ?? 0.2

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < actualCount; i++) {
      const radius = 2 + Math.random() * particleRadius
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      const speed = particleSpeed * 0.5 + Math.random() * particleSpeed
      const offset = Math.random() * Math.PI * 2
      
      const rotSpeedX = (Math.random() - 0.5) * 2
      const rotSpeedY = (Math.random() - 0.5) * 2
      const rotSpeedZ = (Math.random() - 0.5) * 2

      temp.push({ speed, offset, radius, theta, phi, rotSpeedX, rotSpeedY, rotSpeedZ })
    }
    return temp
  }, [actualCount, particleSpeed, particleRadius])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useMemo(() => new Float32Array(actualCount * 3), [actualCount])

  useEffect(() => {
    if (!mesh.current) return
    const primaryC = new THREE.Color(colors.primary)
    const secondaryC = new THREE.Color(colors.secondary)
    const accentC = new THREE.Color(colors.accent)
    
    for(let i=0; i < actualCount; i++) {
      const colorChoice = Math.random()
      let c = primaryC
      if (colorChoice > 0.8) c = accentC
      else if (colorChoice > 0.4) c = secondaryC
      
      c.toArray(colorArray, i * 3)
    }
    mesh.current.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3)
    mesh.current.instanceColor.needsUpdate = true
  }, [actualCount, colors, colorArray])

  useFrame((state) => {
    if (!mesh.current) return
    const time = state.clock.getElapsedTime()
    
    particles.forEach((particle, i) => {
      const newTheta = particle.theta + time * particle.speed
      const wobble = Math.sin(time * 0.5 + particle.offset) * 0.3
      
      const x = particle.radius * Math.sin(particle.phi + wobble) * Math.cos(newTheta)
      const y = particle.radius * Math.sin(particle.phi + wobble) * Math.sin(newTheta)
      const z = particle.radius * Math.cos(particle.phi) + Math.sin(time + particle.offset) * 0.5
      
      dummy.position.set(x, y, z)
      
      // Calculate continuous rotation based on time and the particle's base speed
      const totalRotSpeed = particle.speed * 50 // Scale up so it's visible based on movement speed
      dummy.rotation.x = time * totalRotSpeed * particle.rotSpeedX + particle.offset
      dummy.rotation.y = time * totalRotSpeed * particle.rotSpeedY + particle.offset
      dummy.rotation.z = time * totalRotSpeed * particle.rotSpeedZ + particle.offset
      
      dummy.updateMatrix()
      
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    
    mesh.current.instanceMatrix.needsUpdate = true
  })

  let geometry
  switch (particleShape) {
    case 'cube': geometry = <boxGeometry args={[particleSize, particleSize, particleSize]} />; break;
    case 'tetrahedron': geometry = <tetrahedronGeometry args={[particleSize]} />; break;
    case 'icosahedron': geometry = <icosahedronGeometry args={[particleSize, 0]} />; break;
    case 'octahedron': geometry = <octahedronGeometry args={[particleSize]} />; break;
    case 'dodecahedron': geometry = <dodecahedronGeometry args={[particleSize]} />; break;
    case 'torus': geometry = <torusGeometry args={[particleSize, particleSize*0.4, 8, 16]} />; break;
    case 'ring': geometry = <ringGeometry args={[particleSize*0.5, particleSize, 8]} />; break;
    case 'cone': geometry = <coneGeometry args={[particleSize, particleSize*2, 8]} />; break;
    case 'cylinder': geometry = <cylinderGeometry args={[particleSize, particleSize, particleSize*2, 8]} />; break;
    case 'sphere':
    default:
      geometry = <sphereGeometry args={[particleSize, 16, 16]} />; break;
  }

  return (
    <instancedMesh ref={mesh} args={[null, null, actualCount]}>
      {geometry}
      <meshStandardMaterial 
        transparent={particleOpacity < 1}
        opacity={particleOpacity}
        metalness={metalness}
        roughness={roughness}
        blending={particleBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
