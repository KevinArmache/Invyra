'use server'

import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/app/actions/auth'

import { TEMPLATE_PRESETS } from '@/lib/template-presets'

// ──────────────────────────────────────────────
// AI Template Generation
// ──────────────────────────────────────────────
export async function generateTemplateWithAI(eventId, prompt) {
  try {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY non configuré. Obtenez une clé gratuite sur https://console.groq.com/')
    }

    let event = null
    if (eventId) {
      event = await prisma.event.findFirst({
        where: { id: eventId, userId: user.userId }
      })
      if (!event) throw new Error('Event not found')
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const systemPrompt = `You are a professional event designer. Generate an invitation template JSON based on the description.
Return ONLY valid JSON with exactly these fields:
{
  "style": "elegant|romantic|modern|festive|nature|cosmic",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "bgColor": "#hexcode (dark, rich background)",
  "bgGradient": ["#hex1", "#hex2"],
  "bgImage": null or "https://images.unsplash.com/... (relevant photo URL)",
  "textColor": "#hexcode (light, readable)",
  "accentColor": "#hexcode",
  "fontFamily": "Google Font name, fallback",
  "headerFontSize": "3rem",
  "bodyFontSize": "1rem",
  "borderStyle": "solid|double|dashed|none",
  "borderColor": "#hexcode",
  "borderOpacity": 0.5,
  "cornerDecoration": true|false,
  "floral": true|false,
  "glitter": true|false,
  "headerText": "short invitation headline in the appropriate language",
  "subHeaderText": "short sub-headline in the appropriate language",
  "buttonLabel": "RSVP button text in the appropriate language",
  "buttonColor": "#hexcode",
  "buttonTextColor": "#hexcode"
}
Return ONLY the JSON. No markdown, no explanation.`

    const userPrompt = `Event: ${event?.title || 'Event'}
Type: ${event?.theme || 'elegant'}
Description: ${prompt}
Generate a beautiful, cohesive invitation template.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 800
    })

    const responseText = completion.choices[0]?.message?.content || ''
    let template
    try {
      const cleaned = responseText.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
      template = JSON.parse(cleaned)
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON')
    }

    // Sanitize
    const sanitized = {
      style: ['elegant', 'romantic', 'modern', 'festive', 'nature', 'cosmic'].includes(template.style) ? template.style : 'elegant',
      primaryColor: template.primaryColor || '#d4af37',
      secondaryColor: template.secondaryColor || '#c9a27e',
      bgColor: template.bgColor || '#0f0c08',
      bgGradient: Array.isArray(template.bgGradient) && template.bgGradient.length >= 2 ? template.bgGradient.slice(0, 2) : ['#1a1a2e', '#0f0f1a'],
      bgImage: template.bgImage || null,
      textColor: template.textColor || '#ffffff',
      accentColor: template.accentColor || template.primaryColor || '#d4af37',
      fontFamily: template.fontFamily || 'Georgia, serif',
      headerFontSize: template.headerFontSize || '3rem',
      bodyFontSize: template.bodyFontSize || '1rem',
      borderStyle: ['solid', 'double', 'dashed', 'none'].includes(template.borderStyle) ? template.borderStyle : 'solid',
      borderColor: template.borderColor || template.primaryColor || '#d4af37',
      borderOpacity: Math.min(Math.max(Number(template.borderOpacity) || 0.5, 0), 1),
      cornerDecoration: Boolean(template.cornerDecoration),
      floral: Boolean(template.floral),
      glitter: Boolean(template.glitter),
      headerText: template.headerText || 'You are Invited',
      subHeaderText: template.subHeaderText || 'to a special event',
      buttonLabel: template.buttonLabel || 'RSVP Now',
      buttonColor: template.buttonColor || template.primaryColor || '#d4af37',
      buttonTextColor: template.buttonTextColor || '#ffffff',
    }

    // Save to event
    if (eventId) {
      await prisma.event.update({
        where: { id: eventId },
        data: { invitationTemplate: sanitized }
      })
    }

    return { template: sanitized, message: 'Template généré avec succès' }
  } catch (error) {
    console.error('Template AI generation error:', error)
    throw new Error(error.message || 'Échec de la génération du template')
  }
}

// ──────────────────────────────────────────────
// Apply a preset
// ──────────────────────────────────────────────
export async function applyTemplatePreset(eventId, presetId) {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')

  const preset = TEMPLATE_PRESETS.find(p => p.id === presetId)
  if (!preset) throw new Error('Preset not found')

  await prisma.event.update({
    where: { id: eventId },
    data: { invitationTemplate: preset.template }
  })

  return { template: preset.template }
}

// ──────────────────────────────────────────────
// User Custom Templates (Reusable)
// ──────────────────────────────────────────────
export async function saveUserTemplate(name, templateConfig) {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')

  if (!name) throw new Error('Template name is required')

  const tmpl = await prisma.customTemplate.create({
    data: {
      userId: user.userId,
      name,
      config: templateConfig
    }
  })
  
  return tmpl
}

export async function getUserTemplates() {
  const user = await getSession()
  if (!user) return []

  const templates = await prisma.customTemplate.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' }
  })
  
  return templates
}

export async function deleteUserTemplate(templateId) {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')

  await prisma.customTemplate.deleteMany({
    where: { 
      id: templateId,
      userId: user.userId
    }
  })
  
  return { success: true }
}

// ──────────────────────────────────────────────
// Save a custom template to an event
// ──────────────────────────────────────────────
export async function saveTemplate(eventId, template) {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: user.userId }
  })
  if (!event) throw new Error('Event not found')

  await prisma.event.update({
    where: { id: eventId },
    data: { invitationTemplate: template }
  })

  return { success: true }
}
