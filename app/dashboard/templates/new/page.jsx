'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveUserTemplate } from '@/app/actions/template'
import { ArrowLeft, Save, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InvitationPreview from '@/components/invitation/InvitationPreview'

const VARIABLE_TAGS = [
  { tag: '{{EVENT_NAME}}', desc: "Nom de l'événement" },
  { tag: '{{LOCATION}}', desc: "Lieu de l'événement" },
  { tag: '{{TIME}}', desc: "Heure de l'événement" },
  { tag: '{{DRESS_CODE}}', desc: 'Code vestimentaire' },
  { tag: '{{GUEST_NAME}}', desc: "Prénom & nom de l'invité" },
]

export default function NewTemplatePage() {
  const router = useRouter()
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [css, setCss] = useState(DEFAULT_CSS)

  // Build the template config object from current HTML/CSS
  const templateConfig = {
    type: 'code',
    html,
    css,
    primaryColor: '#d4af37',
    bgColor: '#111111',
  }

  async function handleSave() {
    if (!saveName.trim()) {
      alert('Veuillez donner un nom à votre modèle.')
      return
    }
    setSaving(true)
    try {
      await saveUserTemplate(saveName.trim(), templateConfig)
      router.push('/dashboard/templates')
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleApplyPreview() {
    // Force a re-render for the preview by creating a new object reference
    setHtml(h => h + ' ')
    setTimeout(() => setHtml(h => h.trimEnd()), 10)
  }

  const demoEvent = {
    title: 'Gala de Bienfaisance 2025',
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Château de Fontainebleau, Seine-et-Marne',
    time: '19h30',
    dressCode: 'Tenue de gala',
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/templates"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Créer un nouveau modèle</h1>
            <p className="text-xs text-muted-foreground">Concevez votre design en HTML / CSS pur</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Nom du modèle..."
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            className="w-full sm:w-52 bg-background"
          />
          <Button onClick={handleSave} disabled={saving || !saveName.trim()} className="gap-2 shrink-0">
            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[440px_1fr] gap-5 min-h-0">
        {/* Left: HTML/CSS Editor */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Éditeur HTML / CSS</span>
          </div>

          {/* Variables reference */}
          <div className="px-4 py-2 border-b border-border bg-muted/10 flex flex-wrap gap-1.5">
            {VARIABLE_TAGS.map(v => (
              <span key={v.tag} title={v.desc} className="bg-primary/10 text-primary text-[10px] font-mono px-1.5 py-0.5 rounded cursor-help border border-primary/20">
                {v.tag}
              </span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Structure HTML</Label>
              <Textarea
                value={html}
                onChange={e => setHtml(e.target.value)}
                className="font-mono text-xs bg-background leading-relaxed resize-none"
                style={{ minHeight: '280px' }}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Styles CSS</Label>
              <Textarea
                value={css}
                onChange={e => setCss(e.target.value)}
                className="font-mono text-xs bg-background leading-relaxed resize-none"
                style={{ minHeight: '280px' }}
              />
            </div>

            <Button onClick={handleApplyPreview} variant="secondary" className="w-full">
              Actualiser l'aperçu
            </Button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20 h-full shadow-inner flex items-center justify-center p-0">
          <div className="w-full h-full overflow-auto">
            <InvitationPreview
              template={templateConfig}
              event={demoEvent}
              guestName="Marie Dupont"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Default HTML Template (Long, detailed with RSVP form) ───────────────────
const DEFAULT_HTML = `<div class="page">
  <div class="card">

    <!-- En-tête décorative -->
    <div class="header-band">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
      <p class="overline">Invitation officielle</p>
      <h1 class="event-title">{{EVENT_NAME}}</h1>
      <p class="subtitle">Un événement d'exception</p>
    </div>

    <!-- Message de bienvenue -->
    <div class="section">
      <p class="greeting">Cher(e) <strong class="guest">{{GUEST_NAME}}</strong>,</p>
      <p class="body-text">
        C'est avec une immense joie et fierté que nous avons l'honneur de vous convier
        à cet événement exceptionnel. Votre présence illuminerait notre soirée et
        nous serait infiniment précieuse.
      </p>
    </div>

    <div class="divider">
      <span class="diamond">◆</span>
    </div>

    <!-- Détails de l'événement -->
    <div class="section">
      <h2 class="section-title">Détails de l'événement</h2>
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-icon">📍</div>
          <div>
            <div class="detail-label">Lieu</div>
            <div class="detail-value">{{LOCATION}}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">🕖</div>
          <div>
            <div class="detail-label">Heure d'accueil</div>
            <div class="detail-value">{{TIME}}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">👗</div>
          <div>
            <div class="detail-label">Tenue requise</div>
            <div class="detail-value">{{DRESS_CODE}}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">🍽️</div>
          <div>
            <div class="detail-label">Restauration</div>
            <div class="detail-value">Dîner assis, service à table</div>
          </div>
        </div>
      </div>
    </div>

    <div class="divider">
      <span class="diamond">◆</span>
    </div>

    <!-- Programme de la soirée -->
    <div class="section">
      <h2 class="section-title">Programme</h2>
      <div class="timeline">
        <div class="timeline-item">
          <span class="timeline-time">19h30</span>
          <span class="timeline-dot"></span>
          <span class="timeline-desc">Accueil des invités & cocktail de bienvenue</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-time">20h30</span>
          <span class="timeline-dot"></span>
          <span class="timeline-desc">Ouverture officielle & mot de bienvenue</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-time">21h00</span>
          <span class="timeline-dot"></span>
          <span class="timeline-desc">Dîner de gala</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-time">23h00</span>
          <span class="timeline-dot"></span>
          <span class="timeline-desc">Soirée dansante & animations</span>
        </div>
        <div class="timeline-item">
          <span class="timeline-time">02h00</span>
          <span class="timeline-dot"></span>
          <span class="timeline-desc">Clôture de la soirée</span>
        </div>
      </div>
    </div>

    <div class="divider">
      <span class="diamond">◆</span>
    </div>

    <!-- Informations pratiques -->
    <div class="section">
      <h2 class="section-title">Informations pratiques</h2>
      <div class="info-box">
        <p>🚗 <strong>Parking</strong> — Voiturier disponible sur place. Parking gratuit à 200m.</p>
        <p>🏨 <strong>Hébergement</strong> — Des chambres sont réservées à tarif préférentiel au Grand Hôtel du Château. Mentionnez le code <em>GALA2025</em>.</p>
        <p>🍷 <strong>Menu</strong> — Merci de signaler tout régime alimentaire particulier ou allergie dans votre réponse RSVP.</p>
        <p>📸 <strong>Photo</strong> — Un photographe professionnel sera présent tout au long de la soirée.</p>
      </div>
    </div>

    <div class="divider">
      <span class="diamond">◆</span>
    </div>

    <!-- Formulaire RSVP -->
    <div class="section rsvp-section">
      <h2 class="section-title rsvp-title">Confirmer votre présence</h2>
      <p class="rsvp-deadline">⏳ Merci de répondre avant le <strong>15 avril 2025</strong></p>

      <div class="rsvp-choice">
        <button class="btn-yes">✓ Je serai présent(e)</button>
        <button class="btn-no">✗ Je ne pourrai pas venir</button>
      </div>

      <div class="rsvp-form">
        <div class="form-group">
          <label class="form-label">Nombre d'accompagnants</label>
          <select class="form-input">
            <option>Je viens seul(e)</option>
            <option>1 accompagnant(e)</option>
            <option>2 accompagnants</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Régime alimentaire</label>
          <select class="form-input">
            <option>Aucun (standard)</option>
            <option>Végétarien</option>
            <option>Végan</option>
            <option>Halal</option>
            <option>Allergie — à préciser</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Message pour les organisateurs (optionnel)</label>
          <textarea class="form-input form-textarea" placeholder="Votre message..."></textarea>
        </div>
        <button class="btn-submit">Envoyer ma réponse</button>
      </div>
    </div>

    <!-- Pied de page -->
    <div class="footer">
      <p>Pour toute question, contactez-nous à <a href="mailto:contact@invyra.com" class="footer-link">contact@invyra.com</a></p>
      <p class="footer-sub">Invitation personnelle — non transmissible</p>
      <p class="footer-credit"><a href="https://github.com/KevinArmache" target="_blank" rel="noopener noreferrer" class="footer-credit-link">Developed by Kevin Armache</a></p>
    </div>

  </div>
</div>`

const DEFAULT_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }

.page {
  width: 100%;
  min-height: 100%;
  background: linear-gradient(160deg, #0e0c08, #1a1508);
  font-family: 'Cormorant Garamond', Georgia, serif;
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.card {
  width: 100%;
  max-width: 680px;
  background: transparent;
  color: #f5f0e8;
}

/* ─── Header ─────────────────────────────── */
.header-band {
  position: relative;
  text-align: center;
  border: 1px solid rgba(212,175,55,0.45);
  padding: 50px 40px 40px;
  margin-bottom: 40px;
}

.corner {
  position: absolute;
  width: 22px; height: 22px;
  border-color: #d4af37;
  border-style: solid;
  border-width: 0;
}
.tl { top: 6px; left: 6px;  border-top-width: 1.5px; border-left-width: 1.5px; }
.tr { top: 6px; right: 6px; border-top-width: 1.5px; border-right-width: 1.5px; }
.bl { bottom: 6px; left: 6px;  border-bottom-width: 1.5px; border-left-width: 1.5px; }
.br { bottom: 6px; right: 6px; border-bottom-width: 1.5px; border-right-width: 1.5px; }

.overline {
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.7);
  margin-bottom: 12px;
}

.event-title {
  font-size: 2.8em;
  color: #d4af37;
  line-height: 1.15;
  text-shadow: 0 4px 30px rgba(0,0,0,0.5);
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1em;
  color: rgba(245,240,232,0.5);
  font-style: italic;
  letter-spacing: 0.1em;
}

/* ─── Sections ───────────────────────────── */
.section {
  padding: 0 10px;
  margin-bottom: 36px;
}

.section-title {
  font-size: 0.72rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #d4af37;
  margin-bottom: 18px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212,175,55,0.2);
}

/* ─── Greeting ───────────────────────────── */
.greeting {
  font-size: 1.15em;
  color: rgba(245,240,232,0.85);
  margin-bottom: 12px;
}
.guest { color: #d4af37; }
.body-text {
  font-size: 1em;
  color: rgba(245,240,232,0.65);
  line-height: 1.8;
  font-style: italic;
}

/* ─── Divider ────────────────────────────── */
.divider {
  text-align: center;
  margin: 20px 0 36px;
  position: relative;
}
.divider::before, .divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 38%;
  height: 1px;
  background: rgba(212,175,55,0.2);
}
.divider::before { left: 0; }
.divider::after { right: 0; }
.diamond { color: #d4af37; font-size: 0.7em; }

/* ─── Details grid ───────────────────────── */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(212,175,55,0.04);
  border: 1px solid rgba(212,175,55,0.12);
  border-radius: 4px;
  padding: 14px;
}
.detail-icon { font-size: 1.3em; line-height: 1; margin-top: 2px; }
.detail-label { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,240,232,0.4); margin-bottom: 4px; }
.detail-value { font-size: 0.95em; color: rgba(245,240,232,0.85); }

/* ─── Timeline ───────────────────────────── */
.timeline { display: flex; flex-direction: column; gap: 12px; }
.timeline-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.95em;
  color: rgba(245,240,232,0.75);
}
.timeline-time {
  min-width: 54px;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: #d4af37;
  text-align: right;
}
.timeline-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #d4af37;
  flex-shrink: 0;
}
.timeline-desc { color: rgba(245,240,232,0.7); line-height: 1.5; }

/* ─── Info box ───────────────────────────── */
.info-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 2px solid rgba(212,175,55,0.3);
  padding-left: 16px;
}
.info-box p { font-size: 0.9em; color: rgba(245,240,232,0.7); line-height: 1.7; }
.info-box em { color: #d4af37; font-style: normal; font-weight: 600; }

/* ─── RSVP Section ───────────────────────── */
.rsvp-section {
  background: rgba(212,175,55,0.04);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 6px;
  padding: 32px;
}
.rsvp-title { color: #d4af37 !important; }
.rsvp-deadline {
  font-size: 0.88em;
  color: rgba(245,240,232,0.55);
  margin-bottom: 24px;
  font-style: italic;
}
.rsvp-choice {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 28px;
}
.btn-yes, .btn-no {
  padding: 10px 24px;
  font-size: 0.82em;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
  font-family: inherit;
}
.btn-yes { background: #d4af37; color: #0e0c08; }
.btn-no  { background: transparent; color: rgba(245,240,232,0.5); border: 1px solid rgba(245,240,232,0.2); }
.btn-yes:hover, .btn-no:hover { transform: scale(1.03); opacity: 0.9; }

/* ─── RSVP Form ──────────────────────────── */
.rsvp-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(245,240,232,0.5); }
.form-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 3px;
  padding: 10px 14px;
  color: #f5f0e8;
  font-family: inherit;
  font-size: 0.9em;
  outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: rgba(212,175,55,0.5); }
.form-textarea { resize: vertical; min-height: 80px; }
option { background: #1a1408; color: #f5f0e8; }

.btn-submit {
  margin-top: 8px;
  background: #d4af37;
  color: #0e0c08;
  border: none;
  padding: 12px;
  font-size: 0.85em;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border-radius: 2px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, transform 0.15s;
}
.btn-submit:hover { background: #c49a2e; transform: scale(1.01); }

/* ─── Footer ─────────────────────────────── */
.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(212,175,55,0.15);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.footer p { font-size: 0.8em; color: rgba(245,240,232,0.4); }
.footer-link { color: #d4af37; text-decoration: none; }
.footer-sub { font-style: italic; font-size: 0.72em !important; color: rgba(245,240,232,0.25) !important; }
.footer-credit { margin-top: 10px; }
.footer-credit-link { font-size: 0.65rem; color: rgba(212,175,55,0.35); text-decoration: none; letter-spacing: 0.15em; text-transform: uppercase; transition: color 0.2s; }
.footer-credit-link:hover { color: rgba(212,175,55,0.7); }`
