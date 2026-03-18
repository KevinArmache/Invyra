'use server'

import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

export async function generateAnimationConfig(eventId, prompt, eventTitle, eventTheme) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com/')
    }

    if (!prompt) throw new Error('Prompt is required')

    let event = null
    if (eventId) {
      event = await prisma.event.findFirst({
        where: { id: eventId, userId: user.userId }
      })
      if (!event) throw new Error('Event not found')
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const systemPrompt = [
      'You are an AI that generates animation configurations for cinematic event invitations.',
      'Based on the description, generate a JSON object with exactly these fields:',
      '- particleCount: number between 100 and 1000',
      '- particleSize: number between 0.02 and 0.2',
      '- particleSpeed: number between 0.001 and 0.05',
      '- colors: object with primary, secondary, accent (hex color strings)',
      '- cameraSpeed: number between 0.01 and 0.1',
      '- lightIntensity: number between 0.5 and 2',
      '- ringCount: number between 3 and 8',
      '- backgroundGradient: array of exactly 2 hex color strings',
      '- backgroundImage: optional string URL (e.g., "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1920&auto=format&fit=crop" -> find a relevant unsplash image based on the event description, ONLY if it enhances the mood. Otherwise omit it).',
      '- showStars: boolean (true for cosmic/magical themes)',
      '- showSparkles: boolean (true for festive/magical themes)',
      '- showClouds: boolean (true for airy/dreamy themes)',
      '- overlayOpacity: number between 0 and 1 (how much to darken the background)',
      '- fontStyle: string, either "font-serif", "font-sans", or "font-mono"',
      '- ambientLight: number between 0 and 2',
      '- decorativeShape: string ("ring", "icosahedron", "torusKnot", "sphere", "box", "tetrahedron", "octahedron", "dodecahedron", "cone", "cylinder")',
      '- particleShape: string ("sphere", "cube", "tetrahedron", "icosahedron", "octahedron", "dodecahedron", "torus", "ring", "cone", "cylinder")',
      '- particleRadius: number between 5 and 50',
      '- particleOpacity: number between 0 and 1',
      '- particleMetalness: number between 0 and 1',
      '- particleRoughness: number between 0 and 1',
      '- particleBlending: string ("additive", "normal")',
      '- ringThickness: number between 0.01 and 1',
      '- ringMetalness: number between 0 and 1',
      '- ringRoughness: number between 0 and 1',
      '- ringEmissive: number between 0 and 2',
      '- ringOpacity: number between 0 and 1',
      '- wireframeShapes: boolean',
      '- environmentPreset: string ("night", "city", "dawn", "forest", "lobby", "park", "studio", "sunset", "warehouse", "apartment")',
      '- showEnvironmentBackground: boolean',
      '- contentBgColor: string hex color code',
      '- contentBgOpacity: number between 0 and 1 (opacity of the text container)',
      '- contentPadding: number between 0 and 120',
      '- contentMargin: number between 0 and 200',
      '- contentBorderColor: string hex color code',
      '- contentBorderSize: number between 0 and 20',
      '- contentBorderRadius: number between 0 and 100',
      '- audioUrl: string URL to a public .mp3 file, or empty string if not applicable',
      '- textBlockBgColor: string hex color code',
      '- textBlockBgOpacity: number between 0 and 1',
      '- textBlockPadding: number between 0 and 40',
      '- textBlockBorderColor: string hex color code',
      '- textBlockBorderSize: number between 0 and 20',
      '- textBlockBorderRadius: number between 0 and 100',
      '- animateBackground: boolean (true to slowly pan the background image)',
      '- parallaxEnabled: boolean (true to enable 3D mouse/gyro parallax)',
      '- parallaxIntensity: number between 0.5 and 5',
      '- cameraTargetZ: number between 0 and 20',
      '- loaderBgColor: string hex color code',
      '- loaderBarColor: string hex color code',
      '- loaderBarBg: string hex color code',
      '- loaderTextColor: string hex color code',
      'Return ONLY valid JSON with no explanation, no markdown, no code block.'
    ].join('\n')

    const userPrompt = [
      `Event: ${eventTitle || 'Special Event'}`,
      `Theme: ${eventTheme || 'elegant'}`,
      `Description: ${prompt}`,
      'Generate the animation config JSON.'
    ].join('\n')

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const responseText = completion.choices[0]?.message?.content || ''

    let config
    try {
      // Strip markdown code blocks if present
      const cleaned = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
      config = JSON.parse(cleaned)
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON')
    }

    const sanitizedConfig = {
      particleCount: Math.min(Math.max(Number(config.particleCount) || 300, 100), 1000),
      particleSize: Math.min(Math.max(Number(config.particleSize) || 0.05, 0.02), 0.2),
      particleSpeed: Math.min(Math.max(Number(config.particleSpeed) || 0.01, 0.001), 0.05),
      colors: {
        primary: config.colors?.primary || '#d4af37',
        secondary: config.colors?.secondary || '#c9a27e',
        accent: config.colors?.accent || '#b8860b'
      },
      cameraSpeed: Math.min(Math.max(Number(config.cameraSpeed) || 0.05, 0.01), 0.1),
      lightIntensity: Math.min(Math.max(Number(config.lightIntensity) || 1, 0.5), 2),
      ringCount: Math.min(Math.max(Number(config.ringCount) || 5, 3), 8),
      floatIntensity: Math.min(Math.max(Number(config.floatIntensity) || 0.3, 0.1), 1),
      backgroundGradient: Array.isArray(config.backgroundGradient) && config.backgroundGradient.length >= 2
        ? config.backgroundGradient.slice(0, 2)
        : ['#1a1a2e', '#0f0f1a'],
      backgroundImage: config.backgroundImage || '',
      showStars: Boolean(config.showStars),
      showSparkles: Boolean(config.showSparkles),
      showClouds: Boolean(config.showClouds),
      overlayOpacity: Math.min(Math.max(Number(config.overlayOpacity) || 0, 0), 1),
      fontStyle: ['font-serif', 'font-sans', 'font-mono'].includes(config.fontStyle) ? config.fontStyle : 'font-serif',
      ambientLight: Math.min(Math.max(Number(config.ambientLight) || 0.2, 0), 2),
      decorativeShape: ['ring', 'icosahedron', 'torusKnot', 'sphere', 'box', 'tetrahedron', 'octahedron', 'dodecahedron', 'cone', 'cylinder'].includes(config.decorativeShape) ? config.decorativeShape : 'ring',
      particleShape: ['sphere', 'cube', 'tetrahedron', 'icosahedron', 'octahedron', 'dodecahedron', 'torus', 'ring', 'cone', 'cylinder'].includes(config.particleShape) ? config.particleShape : 'sphere',
      particleRadius: Math.min(Math.max(Number(config.particleRadius) || 15, 5), 50),
      particleOpacity: Math.min(Math.max(Number(config.particleOpacity ?? 0.8), 0), 1),
      particleMetalness: Math.min(Math.max(Number(config.particleMetalness ?? 0.8), 0), 1),
      particleRoughness: Math.min(Math.max(Number(config.particleRoughness ?? 0.2), 0), 1),
      particleBlending: ['additive', 'normal'].includes(config.particleBlending) ? config.particleBlending : 'additive',
      ringThickness: Math.min(Math.max(Number(config.ringThickness) || 0.05, 0.01), 1),
      ringMetalness: Math.min(Math.max(Number(config.ringMetalness ?? 0.9), 0), 1),
      ringRoughness: Math.min(Math.max(Number(config.ringRoughness ?? 0.1), 0), 1),
      ringEmissive: Math.min(Math.max(Number(config.ringEmissive ?? 0.3), 0), 2),
      ringOpacity: Math.min(Math.max(Number(config.ringOpacity ?? 1), 0), 1),
      wireframeShapes: Boolean(config.wireframeShapes),
      environmentPreset: ['night', 'city', 'dawn', 'forest', 'lobby', 'park', 'studio', 'sunset', 'warehouse', 'apartment'].includes(config.environmentPreset) ? config.environmentPreset : 'night',
      showEnvironmentBackground: Boolean(config.showEnvironmentBackground),
      contentBgColor: config.contentBgColor || '#000000',
      contentBgOpacity: Math.min(Math.max(Number(config.contentBgOpacity) || 0, 0), 1),
      contentPadding: Math.min(Math.max(Number(config.contentPadding) ?? 48, 0), 120),
      contentMargin: Math.min(Math.max(Number(config.contentMargin) ?? 0, 0), 200),
      contentBorderColor: config.contentBorderColor || '#d4af37',
      contentBorderSize: Math.min(Math.max(Number(config.contentBorderSize) || 0, 0), 20),
      contentBorderRadius: Math.min(Math.max(Number(config.contentBorderRadius) || 0, 0), 100),
      audioUrl: config.audioUrl || '',
      textBlockBgColor: config.textBlockBgColor || '#000000',
      textBlockBgOpacity: Math.min(Math.max(Number(config.textBlockBgOpacity) || 0, 0), 1),
      textBlockPadding: Math.min(Math.max(Number(config.textBlockPadding) || 0, 0), 40),
      textBlockBorderColor: config.textBlockBorderColor || '#d4af37',
      textBlockBorderSize: Math.min(Math.max(Number(config.textBlockBorderSize) || 0, 0), 20),
      textBlockBorderRadius: Math.min(Math.max(Number(config.textBlockBorderRadius) || 0, 0), 100),
      animateBackground: Boolean(config.animateBackground),
      parallaxEnabled: config.parallaxEnabled ?? true,
      parallaxIntensity: Math.min(Math.max(Number(config.parallaxIntensity) || 1.5, 0), 5),
      cameraTargetZ: Math.min(Math.max(Number(config.cameraTargetZ) ?? 5, -10), 30),
      loaderBgColor: config.loaderBgColor || '#000000',
      loaderBarColor: config.loaderBarColor || '#d4af37',
      loaderBarBg: config.loaderBarBg || '#333333',
      loaderTextColor: config.loaderTextColor || '#ffffff',
    }

    if (eventId) {
      await prisma.event.update({
        where: { id: eventId },
        data: { animationConfig: sanitizedConfig }
      })
    }

    return {
      config: sanitizedConfig,
      message: 'Animation configuration generated successfully'
    }
  } catch (error) {
    console.error('AI animation generation error:', error)
    throw new Error(error.message || 'Failed to generate animation')
  }
}
