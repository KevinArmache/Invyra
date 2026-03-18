'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, PerspectiveCamera, Stars, Sparkles, Cloud, Loader } from '@react-three/drei'
import { Play, Volume2, VolumeX } from 'lucide-react'
import InvitationParticles from './InvitationParticles'
import * as THREE from 'three'

const themeColors = {
  elegant: { primary: '#d4af37', secondary: '#c9a27e', bg: '#1a1a2e' },
  romantic: { primary: '#e8b4b8', secondary: '#d4a5a5', bg: '#2d1f2f' },
  modern: { primary: '#8b9dc3', secondary: '#6b7aa1', bg: '#1a1f2e' },
  festive: { primary: '#ff6b6b', secondary: '#feca57', bg: '#2e1a1a' },
  nature: { primary: '#6b8e6b', secondary: '#8fbc8f', bg: '#1a2e1a' },
  cosmic: { primary: '#9d4edd', secondary: '#7b2cbf', bg: '#1a1a2e' }
}

function DecorativeShapes({ theme, config }) {
  const shapeCount = config?.ringCount ?? 5
  if (shapeCount === 0) return null

  const baseColors = themeColors[theme] || themeColors.elegant
  const primary = config?.colors?.primary || baseColors.primary
  const secondary = config?.colors?.secondary || baseColors.secondary
  const group = useRef()
  const shapeType = config?.decorativeShape || 'ring'
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const speed = config?.cameraSpeed ?? 0.1
    group.current.rotation.y = time * speed
    group.current.rotation.z = Math.sin(time * 0.2) * 0.1
  })

  return (
    <group ref={group}>
      {Array.from({ length: shapeCount }, (_, i) => {
        const material = (
          <meshStandardMaterial
            color={i % 2 === 0 ? primary : secondary}
            metalness={config?.ringMetalness ?? 0.9}
            roughness={config?.ringRoughness ?? 0.1}
            emissive={i % 2 === 0 ? primary : secondary}
            emissiveIntensity={config?.ringEmissive ?? 0.3}
            transparent={config?.ringOpacity < 1}
            opacity={config?.ringOpacity ?? 1}
            wireframe={config?.wireframeShapes ?? false}
          />
        )

        let geometry
        const scale = 1 + i * 0.5
        
        switch (shapeType) {
          case 'tetrahedron': geometry = <tetrahedronGeometry args={[scale]} />; break;
          case 'icosahedron': geometry = <icosahedronGeometry args={[scale, 0]} />; break;
          case 'octahedron': geometry = <octahedronGeometry args={[scale]} />; break;
          case 'dodecahedron': geometry = <dodecahedronGeometry args={[scale]} />; break;
          case 'torusKnot': geometry = <torusKnotGeometry args={[scale * 0.8, 0.05, 100, 16]} />; break;
          case 'sphere': geometry = <sphereGeometry args={[scale, 32, 32]} />; break;
          case 'box': geometry = <boxGeometry args={[scale, scale, scale]} />; break;
          case 'cone': geometry = <coneGeometry args={[scale, scale * 2, 32]} />; break;
          case 'cylinder': geometry = <cylinderGeometry args={[scale, scale, scale * 2, 32]} />; break;
          case 'ring':
          default:
            geometry = <torusGeometry args={[scale, config?.ringThickness ?? 0.01, 16, 100]} />
            break
        }

        return (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.1, 0, i * 0.3]}>
            {geometry}
            {material}
          </mesh>
        )
      })}
    </group>
  )
}

function CameraAnimation({ started, config }) {
  const { camera } = useThree()
  // Allow AI/User to set final Z depth of the camera.
  const targetZ = started ? (config?.cameraTargetZ ?? 5) : 15
  const flySpeed = config?.cameraFlySpeed ?? 0.02
  const parallaxEnabled = config?.parallaxEnabled ?? true
  const parallaxIntensity = config?.parallaxIntensity ?? 1.5
  
  useFrame((state) => {
    // 1. Z-Depth animation
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, flySpeed)
    
    // 2. Smooth Parallax Effect based on pointer (Mouse/Touch)
    if (parallaxEnabled && started) {
      const targetX = state.pointer.x * parallaxIntensity
      const targetY = state.pointer.y * parallaxIntensity
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05)
      camera.lookAt(0, 0, 0)
    }
  })
  
  return null
}

function WebGLScene({ event, started, config }) {
  const baseColors = themeColors[event?.theme] || themeColors.elegant
  const primary = config?.colors?.primary || baseColors.primary
  const secondary = config?.colors?.secondary || baseColors.secondary
  const lightIntensity = config?.lightIntensity ?? 1
  const showStars = config?.showStars ?? false
  const showSparkles = config?.showSparkles ?? false
  const showClouds = config?.showClouds ?? false
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
      <CameraAnimation started={started} config={config} />
      
      <ambientLight intensity={config?.ambientLight ?? 0.2} />
      <pointLight 
        position={[10, 10, 10]} 
        intensity={lightIntensity} 
        color={primary} 
      />
      <pointLight 
        position={[-10, -10, -10]} 
        intensity={lightIntensity * 0.5} 
        color={secondary} 
      />
      
      {/* Optional Additions for cosmic/nature themes */}
      {showStars && <Stars radius={config?.starsRadius ?? 100} depth={config?.starsDepth ?? 50} count={config?.starsCount ?? 5000} factor={config?.starsFactor ?? 4} saturation={0} fade speed={config?.starsSpeed ?? 1} />}
      {showSparkles && <Sparkles count={config?.sparklesCount ?? 200} scale={config?.sparklesScale ?? 12} size={config?.sparklesSize ?? 2} speed={config?.sparklesSpeed ?? 0.4} color={primary} noise={config?.sparklesNoise ?? 1} />}
      {showClouds && <Cloud position={[0, 0, -10]} speed={config?.cloudSpeed ?? 0.2} opacity={config?.cloudOpacity ?? 0.5} width={config?.cloudWidth ?? 10} depth={config?.cloudDepth ?? 1.5} segments={config?.cloudSegments ?? 20} color={secondary} />}
      
      <DecorativeShapes theme={event?.theme} config={config} />
      <InvitationParticles theme={event?.theme} config={config} />
      
      <Environment preset={config?.environmentPreset ?? "night"} background={config?.showEnvironmentBackground ?? false} />
    </>
  )
}

export default function InvitationScene({ event, guestName, started, config }) {
  const [mounted, setMounted] = useState(false)
  
  const activeConfig = config || event?.animationConfig || null
  const baseColors = themeColors[event?.theme] || themeColors.elegant
  
  const bgColors = activeConfig?.backgroundGradient || [baseColors.bg, '#0f0f1a']
  const bgImage = activeConfig?.backgroundImage
  
  const primaryColor = activeConfig?.colors?.primary || baseColors.primary
  const textColor = activeConfig?.colors?.text || '#ffffff'
  const fontStyle = activeConfig?.fontStyle || 'font-serif' // 'font-serif', 'font-sans', 'font-mono'
  const overlayOpacity = activeConfig?.overlayOpacity ?? 0 // For darkening background image

  // Audio references
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(false)
  
  const audioUrl = activeConfig?.audioUrl || null
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Attempt auto-play when sequence is started
    if (started && audioUrl && audioRef.current) {
      audioRef.current.volume = 0.5; // Set volume here
      audioRef.current.play().catch(e => {
        // Modern browsers block autoplay without interaction. 
        // User may need to manually trigger via un-muting or a global action.
        console.log("Autoplay blocked by browser. User interaction required.");
        setMuted(true); 
      })
    }
  }, [started, audioUrl])

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted
      setMuted(!muted)
    }
  }

  if (!mounted) return null

  const formattedDate = event?.eventDate 
    ? new Date(event.eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null

  return (
    <div className="relative z-0 overflow-hidden w-full h-full rounded-md shadow-inner">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: bgImage 
            ? `url(${bgImage}) center/cover no-repeat`
            : `linear-gradient(135deg, ${bgColors[0]}, ${bgColors[1]})`,
          animation: activeConfig?.animateBackground ? 'slowPan 30s ease-in-out infinite alternate' : 'none',
          backgroundSize: activeConfig?.animateBackground ? '120% 120%' : 'cover',
          backgroundPosition: activeConfig?.animateBackground ? '0% 0%' : 'center'
        }}
      />
      <style>{`
        @keyframes slowPan {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
      
      {/* Darken Overlay for better text legibility on white images */}
      {bgImage && overlayOpacity > 0 && (
        <div 
          className="absolute inset-0 w-full h-full bg-black pointer-events-none" 
          style={{ opacity: overlayOpacity }} 
        />
      )}

      {/* WebGL Canvas Layer */}
      <div className="absolute inset-0 w-full h-full mix-blend-screen pointer-events-none">
        <Canvas
          gl={{ antialias: true, alpha: true }} 
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <WebGLScene 
              event={event} 
              started={started}
              config={activeConfig}
            />
          </Suspense>
        </Canvas>
      </div>

      <Loader
        containerStyles={{ 
          background: activeConfig?.loaderBgColor || bgColors[0],
          zIndex: 50 
        }}
        innerStyles={{
          backgroundColor: activeConfig?.loaderBarBg || 'rgba(255, 255, 255, 0.1)',
          width: '300px',
          borderRadius: '4px'
        }}
        barStyles={{
          backgroundColor: activeConfig?.loaderBarColor || primaryColor,
          borderRadius: '4px'
        }}
        dataStyles={{
          color: activeConfig?.loaderTextColor || textColor,
          fontFamily: 'inherit',
          fontSize: '14px',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}
        dataInterpolation={(p) => `${p.toFixed(0)}%`}
      />

      {/* Background Audio */}
      {audioUrl && (
        <audio 
          ref={audioRef}
          src={audioUrl}
          loop
          preload="auto"
        />
      )}

      {/* HTML Overlay Layer */}
      {started && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 sm:p-12 md:p-24 overflow-y-auto pointer-events-auto transition-opacity duration-1000">
          
          {/* Audio Controls */}
          {audioUrl && (
            <button
              onClick={toggleMute}
              className="absolute top-6 right-6 z-50 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 transition-all shadow-lg"
              title={muted ? "Unmute audio" : "Mute audio"}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}

          <div 
            className={`w-full max-w-2xl text-center space-y-8 duration-1000 ${fontStyle} transition-all opacity-100 translate-y-0`}
            style={{ 
              padding: activeConfig?.contentPadding !== undefined ? `${activeConfig.contentPadding}px` : '48px',
              margin: activeConfig?.contentMargin !== undefined ? `${activeConfig.contentMargin}px auto` : '0px auto',
              textShadow: activeConfig?.textShadow ?? '0 4px 12px rgba(0,0,0,0.5)',
              animationName: 'float',
              animationDuration: `${3 / (activeConfig?.floatIntensity || 0.3)}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
              // Card physical properties
              backgroundColor: activeConfig?.contentBgOpacity > 0 && activeConfig?.contentBgColor
                ? `${activeConfig.contentBgColor}${Math.round((activeConfig?.contentBgOpacity ?? 0) * 255).toString(16).padStart(2, '0')}` // hex + alpha
                : 'transparent',
              border: activeConfig?.contentBorderSize > 0 && activeConfig?.contentBorderColor
                ? `${activeConfig.contentBorderSize}px solid ${activeConfig.contentBorderColor}`
                : 'none',
              borderRadius: activeConfig?.contentBorderRadius !== undefined 
                ? `${activeConfig.contentBorderRadius}px` 
                : '0px',
              backdropFilter: activeConfig?.contentBgOpacity > 0 ? 'blur(8px)' : 'none',
              boxShadow: activeConfig?.contentBorderSize > 0 ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : 'none'
            }}
          >
            <style>{`
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0px); }
              }
              
              /* Sequential Stagger Animations */
              .animate-stagger-1 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; }
              .animate-stagger-2 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; }
              .animate-stagger-3 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards; }
              .animate-stagger-4 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards; }
              .animate-stagger-5 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards; }
              
              @keyframes fadeInSlideUp {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0px); }
              }
              .fill-mode-forwards { animation-fill-mode: forwards; }
            `}</style>
            
            {/* Title */}
            <h1 
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight block w-fit mx-auto animate-stagger-1 opacity-0 fill-mode-forwards"
              style={{ 
                color: primaryColor,
                backgroundColor: activeConfig?.textBlockBgColor 
                  ? `${activeConfig.textBlockBgColor}${Math.round((activeConfig?.textBlockBgOpacity ?? 0) * 255).toString(16).padStart(2, '0')}` 
                  : 'transparent',
                padding: activeConfig?.textBlockPadding ? `${activeConfig.textBlockPadding}px` : '0px',
                border: activeConfig?.textBlockBorderSize > 0 && activeConfig?.textBlockBorderColor
                  ? `${activeConfig.textBlockBorderSize}px solid ${activeConfig.textBlockBorderColor}`
                  : 'none',
                borderRadius: activeConfig?.textBlockBorderRadius ? `${activeConfig.textBlockBorderRadius}px` : '0px',
              }}
            >
              {event?.title || 'You are Invited'}
            </h1>
            
            {/* Guest Name */}
            {guestName && (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light w-fit mx-auto animate-stagger-2 opacity-0 fill-mode-forwards" style={{ 
                color: `${textColor}e6`,
                backgroundColor: activeConfig?.textBlockBgColor 
                  ? `${activeConfig.textBlockBgColor}${Math.round((activeConfig?.textBlockBgOpacity ?? 0) * 255).toString(16).padStart(2, '0')}` 
                  : 'transparent',
                padding: activeConfig?.textBlockPadding ? `${activeConfig.textBlockPadding}px` : '0px',
                border: activeConfig?.textBlockBorderSize > 0 && activeConfig?.textBlockBorderColor
                  ? `${activeConfig.textBlockBorderSize}px solid ${activeConfig.textBlockBorderColor}`
                  : 'none',
                borderRadius: activeConfig?.textBlockBorderRadius ? `${activeConfig.textBlockBorderRadius}px` : '0px',
              }}>
                Dear {guestName}
              </h2>
            )}

            {/* Separator */}
            {activeConfig?.showSeparator !== false && (
              <div 
                className="w-16 h-[1px] mx-auto my-8 animate-stagger-3 opacity-0 fill-mode-forwards" 
                style={{ backgroundColor: `${textColor}4d` }} 
              />
            )}

            {/* Custom Message */}
            {event?.customMessage && (
              <p className="text-lg sm:text-xl leading-relaxed font-light whitespace-pre-line max-w-md mx-auto w-fit animate-stagger-4 opacity-0 fill-mode-forwards" style={{ 
                color: `${textColor}cc`,
                backgroundColor: activeConfig?.textBlockBgColor 
                  ? `${activeConfig.textBlockBgColor}${Math.round((activeConfig?.textBlockBgOpacity ?? 0) * 255).toString(16).padStart(2, '0')}` 
                  : 'transparent',
                padding: activeConfig?.textBlockPadding ? `${activeConfig.textBlockPadding}px` : '0px',
                border: activeConfig?.textBlockBorderSize > 0 && activeConfig?.textBlockBorderColor
                  ? `${activeConfig.textBlockBorderSize}px solid ${activeConfig.textBlockBorderColor}`
                  : 'none',
                borderRadius: activeConfig?.textBlockBorderRadius ? `${activeConfig.textBlockBorderRadius}px` : '0px',
              }}>
                {event.customMessage}
              </p>
            )}

            {/* Details */}
            <div className="space-y-4 mt-8 pt-8 border-t inline-block px-12 animate-stagger-5 opacity-0 fill-mode-forwards" style={{ borderColor: `${textColor}1a` }}>
              {formattedDate && (
                <div className="text-lg sm:text-xl font-medium flex flex-col items-center" style={{ color: `${textColor}e6` }}>
                  <span className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: `${textColor}80` }}>When</span>
                  {formattedDate}
                </div>
              )}
              {event?.location && (
                <div className="text-base sm:text-lg flex flex-col items-center mt-6" style={{ color: `${textColor}b3` }}>
                  <span className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: `${textColor}80` }}>Where</span>
                  {event.location}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
