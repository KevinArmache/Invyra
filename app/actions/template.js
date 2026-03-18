'use server'

import Groq from 'groq-sdk'
import { prisma } from '@/utils/prisma'
import { getSession } from '@/app/actions/auth'

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

    const systemPrompt = `You are a professional web designer. Generate an invitation template (HTML and CSS) based on the user's description.
The design MUST BE absolutely stunning, cohesive, modern, and responsive.
Return ONLY valid JSON with exactly these fields:
{
  "type": "code",
  "html": "<div class='invitation-container'>...</div>",
  "css": ".invitation-container { ... }"
}
Important:
- Use these exact variables in your HTML text: {{EVENT_TITLE}}, {{GUEST_NAME}}, {{EVENT_LOCATION}}, {{EVENT_DATE}}, {{DRESS_CODE}}.
- The HTML MUST include an RSVP form. The form should have buttons or inputs with name="rsvp_status" (values "confirmed", "maybe", "declined"), name="dietary_restrictions", name="plus_one", name="notes".
- Or you can just put buttons with data-rsvp="confirmed" / data-rsvp="declined" attributes.
- Your CSS should be contained in the "css" string. Do not put <style> tags inside the HTML string.
- Return ONLY the JSON object. No markdown formatting, no explanations.`

    const userPrompt = `Event: ${event?.title || 'Event'}
Description: ${prompt}
Generate a beautiful, cohesive invitation template.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
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
      type: 'code',
      html: template.html || '<div style="padding:4rem;text-align:center;"><h1>{{EVENT_TITLE}}</h1><p>Invité: {{GUEST_NAME}}</p></div>',
      css: template.css || 'body { background: #111; color: #fff; font-family: sans-serif; }',
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
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true }
      }
    }
  })

  return templates
}

export async function deleteUserTemplate(templateId) {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')

  if (user.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent supprimer un modèle')
  }

  await prisma.customTemplate.deleteMany({
    where: {
      id: templateId
    }
  })

  return { success: true }
}

export async function getUserTemplateById(templateId) {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')

  const tmpl = await prisma.customTemplate.findFirst({
    where: { id: templateId }
  })

  if (!tmpl) throw new Error('Modèle non trouvé')
  return tmpl
}

export async function updateUserTemplate(templateId, name, templateConfig) {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')

  if (user.role !== 'admin') {
    throw new Error('Seuls les administrateurs peuvent modifier un modèle')
  }

  if (!name) throw new Error('Le nom du modèle est requis')

  const existing = await prisma.customTemplate.findFirst({
    where: { id: templateId }
  })
  if (!existing) throw new Error('Modèle non trouvé')

  const tmpl = await prisma.customTemplate.update({
    where: { id: templateId },
    data: {
      name,
      config: templateConfig
    }
  })

  return tmpl
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
