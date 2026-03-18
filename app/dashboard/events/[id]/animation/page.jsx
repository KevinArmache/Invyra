'use client'

import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, Wand2, Sparkles, RefreshCw, Save, Eye, Settings2 } from 'lucide-react'
import { getEventById, updateEvent } from '@/app/actions/event'
import { generateAnimationConfig } from '@/app/actions/ai'
import { useTranslation } from '@/lib/i18n/Context'

const InvitationScene = dynamic(() => import('@/components/3d/InvitationScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
})

export default function Page({ params }) {
  const { id } = use(params)
  const { t } = useTranslation()
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewStarted, setPreviewStarted] = useState(true)
  const [event, setEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bgInputUrl, setBgInputUrl] = useState('')

  useEffect(() => {
    getEventById(id).then(data => { setEvent(data); setIsLoading(false) }).catch(() => setIsLoading(false))
  }, [id])

  const [config, setConfig] = useState(null)

  const currentConfig = config || event?.animationConfig || {
    particleCount: 300,
    particleSize: 0.05,
    particleSpeed: 0.01,
    colors: { primary: '#d4af37', secondary: '#c9a27e', accent: '#b8860b' },
    cameraSpeed: 0.05,
    lightIntensity: 1,
    ringCount: 5,
    floatIntensity: 0.3,
    bloomIntensity: 0.3,
    backgroundGradient: ['#1a1a2e', '#0f0f1a']
  }

  useEffect(() => {
    if (currentConfig.backgroundImage !== undefined) {
      setBgInputUrl(currentConfig.backgroundImage)
    }
  }, [currentConfig.backgroundImage])

  async function handleGenerateAI() {
    if (!aiPrompt.trim()) return
    
    setGenerating(true)
    
    try {
      const result = await generateAnimationConfig(id, aiPrompt, event?.title, event?.theme)
      setConfig(result.config)
      getEventById(id).then(data => setEvent(data))
    } catch (error) {
      console.error('Generation failed:', error)
      alert('Failed to generate animation')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    
    try {
      await updateEvent(id, { animation_config: currentConfig })
      getEventById(id).then(data => setEvent(data))
      setSaving('saved')
      setTimeout(() => setSaving(false), 2000)
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save animation')
    } finally {
      if (saving !== 'saved') setSaving(false)
    }
  }

  function updateConfig(key, value) {
    setConfig(prev => ({
      ...(prev || currentConfig),
      [key]: value
    }))
  }

  function updateColor(colorKey, value) {
    setConfig(prev => ({
      ...(prev || currentConfig),
      colors: {
        ...(prev?.colors || currentConfig.colors),
        [colorKey]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event && !isLoading) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('editor.title')}</h2>
        <Button asChild>
          <Link href="/dashboard/events">{t('editor.back_events')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/events/${id}`}>
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('editor.title')}</h1>
            <p className="text-muted-foreground">{event.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/events/${id}/preview`}>
              <Eye size={16} className="mr-2" />
              {t('editor.full_preview')}
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving === true}>
            <Save size={16} className="mr-2" />
            {saving === 'saved' ? t('editor.saved') : saving ? t('editor.saving') : t('editor.save_changes')}
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 gap-6">

        {/* Live Preview Container */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {t('editor.live_preview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-video">
              <InvitationScene 
                event={event}
                config={currentConfig}
                guestName="Guest"
                started={previewStarted}
                onStart={() => setPreviewStarted(true)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Controls Container */}
        <div className="space-y-6">
          {/* AI Generator */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              {t('ai.title')}
            </CardTitle>
            <CardDescription>
              {t('ai.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t('ai.placeholder')}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleGenerateAI} 
              disabled={generating || !aiPrompt.trim()}
              className="w-full"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('editor.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('editor.generate')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Controls */}
        <Card>
          <CardHeader>
            <CardTitle>{t('manual.title')}</CardTitle>
            <CardDescription>{t('manual.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Colors */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.colors_title')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-20">{t('manual.primary')}</label>
                    <Input
                      type="color"
                      value={currentConfig.colors?.primary || '#d4af37'}
                      onChange={(e) => updateColor('primary', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <span className="text-xs text-muted-foreground">{currentConfig.colors?.primary}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-20">{t('manual.secondary')}</label>
                    <Input
                      type="color"
                      value={currentConfig.colors?.secondary || '#c9a27e'}
                      onChange={(e) => updateColor('secondary', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <span className="text-xs text-muted-foreground">{currentConfig.colors?.secondary}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-20">{t('manual.accent')}</label>
                    <Input
                      type="color"
                      value={currentConfig.colors?.accent || '#b8860b'}
                      onChange={(e) => updateColor('accent', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <span className="text-xs text-muted-foreground">{currentConfig.colors?.accent}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <label className="text-sm text-muted-foreground w-20">{t('manual.text_color')}</label>
                    <Input
                      type="color"
                      value={currentConfig.colors?.text || '#ffffff'}
                      onChange={(e) => updateColor('text', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                    <span className="text-xs text-muted-foreground">{currentConfig.colors?.text || '#ffffff'}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-3">{t('manual.bg_image_title')}</h4>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground block">
                      URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={bgInputUrl}
                        onChange={(e) => setBgInputUrl(e.target.value)}
                        className="bg-background flex-1"
                      />
                      <Button 
                        variant="secondary" 
                        onClick={() => updateConfig('backgroundImage', bgInputUrl)}
                      >
                        {t('manual.apply')}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('manual.bg_image_desc')}
                    </p>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border mt-4">
                    <label className="text-sm text-foreground mb-3 font-medium block">
                      {t('manual.bg_audio_title')}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://example.com/music.mp3"
                        defaultValue={currentConfig.audioUrl || ''}
                        onBlur={(e) => updateConfig('audioUrl', e.target.value)}
                        className="bg-background flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('manual.bg_audio_desc')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                    <label className="text-sm text-muted-foreground">{t('manual.animate_bg')}</label>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={currentConfig.animateBackground || false}
                      onChange={e => updateConfig('animateBackground', e.target.checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Card Container */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.card_container')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-20">{t('manual.bg_color')}</label>
                    <Input
                      type="color"
                      value={currentConfig.contentBgColor || '#000000'}
                      onChange={(e) => updateConfig('contentBgColor', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.bg_opacity')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.contentBgOpacity ?? 0).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.contentBgOpacity ?? 0) * 100]}
                      onValueChange={([value]) => updateConfig('contentBgOpacity', value / 100)}
                      min={0} max={100} step={5}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-20">{t('manual.border_color')}</label>
                    <Input
                      type="color"
                      value={currentConfig.contentBorderColor || '#d4af37'}
                      onChange={(e) => updateConfig('contentBorderColor', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.border_size')}</label>
                      <span className="text-sm text-foreground">{currentConfig.contentBorderSize ?? 0}px</span>
                    </div>
                    <Slider
                      value={[currentConfig.contentBorderSize ?? 0]}
                      onValueChange={([value]) => updateConfig('contentBorderSize', value)}
                      min={0} max={20} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.border_radius')}</label>
                      <span className="text-sm text-foreground">{currentConfig.contentBorderRadius ?? 0}px</span>
                    </div>
                    <Slider
                      value={[currentConfig.contentBorderRadius ?? 0]}
                      onValueChange={([value]) => updateConfig('contentBorderRadius', value)}
                      min={0} max={100} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Padding X/Y</label>
                      <span className="text-sm text-foreground">{currentConfig.contentPadding ?? 48}px</span>
                    </div>
                    <Slider
                      value={[currentConfig.contentPadding ?? 48]}
                      onValueChange={([value]) => updateConfig('contentPadding', value)}
                      min={0} max={120} step={4}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Margin Top/Bottom</label>
                      <span className="text-sm text-foreground">{currentConfig.contentMargin ?? 0}px</span>
                    </div>
                    <Slider
                      value={[currentConfig.contentMargin ?? 0]}
                      onValueChange={([value]) => updateConfig('contentMargin', value)}
                      min={0} max={200} step={4}
                    />
                  </div>
                </div>
              </div>

              {/* Text Blocks Styles */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.text_blocks')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-20">{t('manual.bg_color')}</label>
                    <Input
                      type="color"
                      value={currentConfig.textBlockBgColor || '#000000'}
                      onChange={(e) => updateConfig('textBlockBgColor', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.bg_opacity')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.textBlockBgOpacity ?? 0).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.textBlockBgOpacity ?? 0) * 100]}
                      onValueChange={([value]) => updateConfig('textBlockBgOpacity', value / 100)}
                      min={0} max={100} step={5}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Padding</label>
                      <span className="text-sm text-foreground">{currentConfig.textBlockPadding ?? 0}px</span>
                    </div>
                    <Slider
                      value={[currentConfig.textBlockPadding ?? 0]}
                      onValueChange={([value]) => updateConfig('textBlockPadding', value)}
                      min={0} max={40} step={1}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-20">Border Color</label>
                    <Input
                      type="color"
                      value={currentConfig.textBlockBorderColor || currentConfig.colors?.primary || '#d4af37'}
                      onChange={(e) => updateConfig('textBlockBorderColor', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Border Size</label>
                      <span className="text-sm text-foreground">{currentConfig.textBlockBorderSize ?? 0}px</span>
                    </div>
                    <Slider
                      value={[currentConfig.textBlockBorderSize ?? 0]}
                      onValueChange={([value]) => updateConfig('textBlockBorderSize', value)}
                      min={0} max={20} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Border Radius</label>
                      <span className="text-sm text-foreground">{currentConfig.textBlockBorderRadius ?? 0}px</span>
                    </div>
                    <Slider
                      value={[currentConfig.textBlockBorderRadius ?? 0]}
                      onValueChange={([value]) => updateConfig('textBlockBorderRadius', value)}
                      min={0} max={100} step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Particles */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.particles')}</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.count')}</label>
                      <span className="text-sm text-foreground">{currentConfig.particleCount}</span>
                    </div>
                    <Slider
                      value={[currentConfig.particleCount || 300]}
                      onValueChange={([value]) => updateConfig('particleCount', value)}
                      min={100} max={2000} step={50}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.size')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.particleSize || 0.05).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.particleSize || 0.05) * 100]}
                      onValueChange={([value]) => updateConfig('particleSize', value / 100)}
                      min={2} max={50} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.speed')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.particleSpeed || 0.01).toFixed(3)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.particleSpeed || 0.01) * 1000]}
                      onValueChange={([value]) => updateConfig('particleSpeed', value / 1000)}
                      min={1} max={100} step={1}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm text-muted-foreground">{t('manual.shape')}</label>
                    <select 
                      className="bg-background border rounded px-2 py-1 text-sm text-foreground"
                      value={currentConfig.particleShape || 'sphere'}
                      onChange={e => updateConfig('particleShape', e.target.value)}
                    >
                      <option value="sphere">Sphere</option>
                      <option value="cube">Cube</option>
                      <option value="tetrahedron">Tetrahedron</option>
                      <option value="icosahedron">Icosahedron</option>
                      <option value="octahedron">Octahedron</option>
                      <option value="dodecahedron">Dodecahedron</option>
                      <option value="torus">Torus</option>
                      <option value="ring">Ring</option>
                      <option value="cone">Cone</option>
                      <option value="cylinder">Cylinder</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Spread Radius</label>
                      <span className="text-sm text-foreground">{currentConfig.particleRadius ?? 15}</span>
                    </div>
                    <Slider
                      value={[currentConfig.particleRadius ?? 15]}
                      onValueChange={([value]) => updateConfig('particleRadius', value)}
                      min={5} max={50} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.opacity')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.particleOpacity ?? 0.8).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.particleOpacity ?? 0.8) * 100]}
                      onValueChange={([value]) => updateConfig('particleOpacity', value / 100)}
                      min={0} max={100} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.metalness')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.particleMetalness ?? 0.8).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.particleMetalness ?? 0.8) * 100]}
                      onValueChange={([value]) => updateConfig('particleMetalness', value / 100)}
                      min={0} max={100} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.roughness')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.particleRoughness ?? 0.2).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.particleRoughness ?? 0.2) * 100]}
                      onValueChange={([value]) => updateConfig('particleRoughness', value / 100)}
                      min={0} max={100} step={1}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm text-muted-foreground">{t('manual.blending')}</label>
                    <select 
                      className="bg-background border rounded px-2 py-1 text-sm text-foreground"
                      value={currentConfig.particleBlending || 'additive'}
                      onChange={e => updateConfig('particleBlending', e.target.value)}
                    >
                      <option value="additive">Additive (Glowing)</option>
                      <option value="normal">Normal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Effects & Lighting */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.decorative_shapes')} & Lights</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Point Light Intensity</label>
                      <span className="text-sm text-foreground">{(currentConfig.lightIntensity || 1).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.lightIntensity || 1) * 10]}
                      onValueChange={([value]) => updateConfig('lightIntensity', value / 10)}
                      min={0} max={30} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Ambient Light</label>
                      <span className="text-sm text-foreground">{(currentConfig.ambientLight ?? 0.2).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.ambientLight ?? 0.2) * 10]}
                      onValueChange={([value]) => updateConfig('ambientLight', value / 10)}
                      min={0} max={20} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Shapes Count</label>
                      <span className="text-sm text-foreground">{currentConfig.ringCount ?? 5}</span>
                    </div>
                    <Slider
                      value={[currentConfig.ringCount ?? 5]}
                      onValueChange={([value]) => updateConfig('ringCount', value)}
                      min={0} max={20} step={1}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm text-muted-foreground">{t('manual.decorative_shapes')}</label>
                    <select 
                      className="bg-background border rounded px-2 py-1 text-sm text-foreground"
                      value={currentConfig.decorativeShape || 'ring'}
                      onChange={e => updateConfig('decorativeShape', e.target.value)}
                    >
                      <option value="ring">Rings</option>
                      <option value="icosahedron">Icosahedron</option>
                      <option value="torusKnot">Torus Knot</option>
                      <option value="sphere">Sphere</option>
                      <option value="box">Cube</option>
                      <option value="tetrahedron">Tetrahedron</option>
                      <option value="octahedron">Octahedron</option>
                      <option value="dodecahedron">Dodecahedron</option>
                      <option value="cone">Cone</option>
                      <option value="cylinder">Cylinder</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.metalness')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.ringMetalness ?? 0.9).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.ringMetalness ?? 0.9) * 100]}
                      onValueChange={([value]) => updateConfig('ringMetalness', value / 100)}
                      min={0} max={100} step={1}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.roughness')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.ringRoughness ?? 0.1).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.ringRoughness ?? 0.1) * 100]}
                      onValueChange={([value]) => updateConfig('ringRoughness', value / 100)}
                      min={0} max={100} step={1}
                    />
                  </div>
                   <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.emissive')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.ringEmissive ?? 0.3).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.ringEmissive ?? 0.3) * 100]}
                      onValueChange={([value]) => updateConfig('ringEmissive', value / 100)}
                      min={0} max={200} step={5}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.opacity')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.ringOpacity ?? 1).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.ringOpacity ?? 1) * 100]}
                      onValueChange={([value]) => updateConfig('ringOpacity', value / 100)}
                      min={0} max={100} step={1}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">{t('manual.wireframe')}</label>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={currentConfig.wireframeShapes || false}
                      onChange={e => updateConfig('wireframeShapes', e.target.checked)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Text Float Intensity</label>
                      <span className="text-sm text-foreground">{(currentConfig.floatIntensity || 0.3).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.floatIntensity || 0.3) * 10]}
                      onValueChange={([value]) => updateConfig('floatIntensity', value / 10)}
                      min={0} max={10} step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Camera & Parallax */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.camera_parallax')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">{t('manual.enable_parallax')}</label>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={currentConfig.parallaxEnabled ?? true}
                      onChange={e => updateConfig('parallaxEnabled', e.target.checked)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.intensity')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.parallaxIntensity ?? 1.5).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.parallaxIntensity ?? 1.5) * 10]}
                      onValueChange={([value]) => updateConfig('parallaxIntensity', value / 10)}
                      min={0} max={50} step={1}
                      disabled={!(currentConfig.parallaxEnabled ?? true)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.depth')}</label>
                      <span className="text-sm text-foreground">{currentConfig.cameraTargetZ ?? 5}</span>
                    </div>
                    <Slider
                      value={[currentConfig.cameraTargetZ ?? 5]}
                      onValueChange={([value]) => updateConfig('cameraTargetZ', value)}
                      min={-10} max={30} step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Loading Screen */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.loading_screen')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-24">{t('manual.bg_color')}</label>
                    <Input
                      type="color"
                      value={currentConfig.loaderBgColor || '#000000'}
                      onChange={(e) => updateConfig('loaderBgColor', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-24">{t('manual.bar_progress')}</label>
                    <Input
                      type="color"
                      value={currentConfig.loaderBarColor || currentConfig.colors?.primary || '#d4af37'}
                      onChange={(e) => updateConfig('loaderBarColor', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-24">{t('manual.bar_bg')}</label>
                    <Input
                      type="color"
                      value={currentConfig.loaderBarBg || '#333333'}
                      onChange={(e) => updateConfig('loaderBarBg', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-24">{t('manual.text_color')}</label>
                    <Input
                      type="color"
                      value={currentConfig.loaderTextColor || '#ffffff'}
                      onChange={(e) => updateConfig('loaderTextColor', e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Environment & Scenery */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">{t('manual.environment')}</h4>
                <div className="space-y-3">
                  <div className="pt-2">
                    <label className="text-sm text-muted-foreground block mb-2">{t('manual.hdri_preset')}</label>
                    <select 
                      className="w-full bg-background border rounded px-3 py-2 text-sm text-foreground"
                      value={currentConfig.environmentPreset || 'night'}
                      onChange={e => updateConfig('environmentPreset', e.target.value)}
                    >
                      {['night','city','dawn','forest','lobby','park','studio','sunset','warehouse','apartment'].map(preset => (
                        <option key={preset} value={preset}>{preset.charAt(0).toUpperCase() + preset.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label className="text-sm text-muted-foreground">{t('manual.show_panorama')}</label>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={currentConfig.showEnvironmentBackground || false}
                      onChange={e => updateConfig('showEnvironmentBackground', e.target.checked)}
                    />
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">{t('manual.stars')}</label>
                      <input 
                        type="checkbox" 
                        checked={currentConfig.showStars || false}
                        onChange={e => updateConfig('showStars', e.target.checked)}
                      />
                    </div>
                    {currentConfig.showStars && (
                      <div className="pl-4 space-y-3 mt-2 border-l border-border">
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Count</span><span>{currentConfig.starsCount ?? 5000}</span></label>
                          <Slider value={[currentConfig.starsCount ?? 5000]} onValueChange={v => updateConfig('starsCount', v[0])} min={100} max={10000} step={100} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Depth</span><span>{currentConfig.starsDepth ?? 50}</span></label>
                          <Slider value={[currentConfig.starsDepth ?? 50]} onValueChange={v => updateConfig('starsDepth', v[0])} min={10} max={200} step={10} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Size Factor</span><span>{currentConfig.starsFactor ?? 4}</span></label>
                          <Slider value={[currentConfig.starsFactor ?? 4]} onValueChange={v => updateConfig('starsFactor', v[0])} min={1} max={15} step={1} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Twinkle Speed</span><span>{currentConfig.starsSpeed ?? 1}</span></label>
                          <Slider value={[currentConfig.starsSpeed ?? 1]} onValueChange={v => updateConfig('starsSpeed', v[0])} min={0} max={5} step={0.1} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">{t('manual.sparkles')}</label>
                      <input 
                        type="checkbox" 
                        checked={currentConfig.showSparkles || false}
                        onChange={e => updateConfig('showSparkles', e.target.checked)}
                      />
                    </div>
                    {currentConfig.showSparkles && (
                      <div className="pl-4 space-y-3 mt-2 border-l border-border">
                         <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Count</span><span>{currentConfig.sparklesCount ?? 200}</span></label>
                          <Slider value={[currentConfig.sparklesCount ?? 200]} onValueChange={v => updateConfig('sparklesCount', v[0])} min={10} max={1000} step={10} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Scale</span><span>{currentConfig.sparklesScale ?? 12}</span></label>
                          <Slider value={[currentConfig.sparklesScale ?? 12]} onValueChange={v => updateConfig('sparklesScale', v[0])} min={1} max={50} step={1} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Particle Size</span><span>{currentConfig.sparklesSize ?? 2}</span></label>
                          <Slider value={[currentConfig.sparklesSize ?? 2]} onValueChange={v => updateConfig('sparklesSize', v[0])} min={1} max={20} step={1} />
                        </div>
                         <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Speed</span><span>{currentConfig.sparklesSpeed ?? 0.4}</span></label>
                           <Slider value={[(currentConfig.sparklesSpeed ?? 0.4) * 10]} onValueChange={v => updateConfig('sparklesSpeed', v[0]/10)} min={0} max={20} step={1} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">{t('manual.clouds')}</label>
                      <input 
                        type="checkbox" 
                        checked={currentConfig.showClouds || false}
                        onChange={e => updateConfig('showClouds', e.target.checked)}
                      />
                    </div>
                    {currentConfig.showClouds && (
                       <div className="pl-4 space-y-3 mt-2 border-l border-border">
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Opacity</span><span>{currentConfig.cloudOpacity ?? 0.5}</span></label>
                          <Slider value={[(currentConfig.cloudOpacity ?? 0.5) * 100]} onValueChange={v => updateConfig('cloudOpacity', v[0]/100)} min={0} max={100} step={1} />
                        </div>
                         <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Speed</span><span>{currentConfig.cloudSpeed ?? 0.2}</span></label>
                          <Slider value={[(currentConfig.cloudSpeed ?? 0.2) * 100]} onValueChange={v => updateConfig('cloudSpeed', v[0]/100)} min={0} max={100} step={1} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex justify-between"><span>Width Spread</span><span>{currentConfig.cloudWidth ?? 10}</span></label>
                          <Slider value={[currentConfig.cloudWidth ?? 10]} onValueChange={v => updateConfig('cloudWidth', v[0])} min={1} max={50} step={1} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border mt-3">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">{t('manual.darken_overlay')}</label>
                      <span className="text-sm text-foreground">{(currentConfig.overlayOpacity ?? 0).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[(currentConfig.overlayOpacity ?? 0) * 10]}
                      onValueChange={([value]) => updateConfig('overlayOpacity', value / 10)}
                      min={0} max={10} step={1}
                    />
                  </div>

                  <div className="pt-2">
                    <label className="text-sm text-muted-foreground block mb-2">{t('manual.font_style')}</label>
                    <select 
                      className="w-full bg-background border rounded px-3 py-2 text-sm text-foreground"
                      value={currentConfig.fontStyle || 'font-serif'}
                      onChange={e => updateConfig('fontStyle', e.target.value)}
                    >
                      <option value="font-serif">Serif (Elegant/Classic)</option>
                      <option value="font-sans">Sans-Serif (Modern/Clean)</option>
                      <option value="font-mono">Monospace (Tech/Retro)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
