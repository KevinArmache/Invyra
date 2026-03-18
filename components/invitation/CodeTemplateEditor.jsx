'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Code, Palette, Zap, Copy, Check, RotateCcw } from 'lucide-react'

const DEFAULT_HTML = `<div class="invitation-wrapper">
  <div class="invitation-card">
    <div class="header-decoration"></div>
    
    <div class="content">
      <p class="eyebrow">Invitation Exclusive</p>
      <h1 class="event-title">{{EVENT_TITLE}}</h1>
      <div class="divider"></div>
      
      <p class="guest-name">Cher(e) <strong>{{GUEST_NAME}}</strong>,</p>
      <p class="description">Nous avons l'honneur de vous inviter à cet événement exceptionnel.</p>
      
      <div class="details">
        <div class="detail-item">
          <span class="icon">📅</span>
          <span>{{EVENT_DATE}}</span>
        </div>
        <div class="detail-item">
          <span class="icon">📍</span>
          <span>{{EVENT_LOCATION}}</span>
        </div>
      </div>
    </div>

    <!-- RSVP Section -->
    <div class="rsvp-section">
      <h3 class="rsvp-title">Confirmer votre présence</h3>
      
      <div id="rsvp-form">
        <div class="rsvp-buttons">
          <button class="rsvp-btn confirm-btn" data-rsvp="confirmed">✓ Oui, je viens</button>
          <button class="rsvp-btn maybe-btn" data-rsvp="maybe">? Peut-être</button>
          <button class="rsvp-btn decline-btn" data-rsvp="declined">✗ Je ne pourrai pas</button>
        </div>
      </div>
      
      <div id="rsvp-success" class="rsvp-success" style="display:none">
        <p id="rsvp-status-msg">🎉 Merci pour votre réponse !</p>
        <button id="rsvp-edit-btn" class="rsvp-edit-btn" style="margin-top:1rem;background:transparent;border:1px solid #d4af37;color:#d4af37;padding:0.5rem 1rem;border-radius:0.5rem;cursor:pointer;font-size:0.8rem">Modifier ma réponse</button>
      </div>
    </div>

    <div class="footer">
      <p>Developed by Kevin Armache</p>
    </div>
  </div>
</div>`

const DEFAULT_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  padding: 2rem;
}

.invitation-wrapper {
  width: 100%;
  max-width: 480px;
}

.invitation-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
}

.header-decoration {
  height: 4px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}

.content {
  padding: 2.5rem 2rem 1.5rem;
  text-align: center;
}

.eyebrow {
  color: #d4af37;
  font-size: 0.65rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  opacity: 0.8;
}

.event-title {
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.25rem;
}

.divider {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
  margin: 0 auto 1.5rem;
}

.guest-name {
  color: rgba(255,255,255,0.7);
  font-size: 1rem;
  margin-bottom: 0.75rem;
  font-style: italic;
}

.guest-name strong {
  color: #d4af37;
}

.description {
  color: rgba(255,255,255,0.45);
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 0.75rem;
  color: rgba(255,255,255,0.7);
  font-size: 0.85rem;
  text-align: left;
}

.icon { font-size: 1rem; }

/* RSVP */
.rsvp-section {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.rsvp-title {
  text-align: center;
  color: rgba(255,255,255,0.5);
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 1.25rem;
}

.rsvp-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.rsvp-btn {
  padding: 0.75rem 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.6);
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.3;
}

.rsvp-btn:hover { transform: translateY(-2px); }

.confirm-btn:hover {
  background: rgba(74,222,128,0.15);
  border-color: rgba(74,222,128,0.5);
  color: #4ade80;
}

.maybe-btn:hover {
  background: rgba(250,204,21,0.1);
  border-color: rgba(250,204,21,0.4);
  color: #facc15;
}

.decline-btn:hover {
  background: rgba(248,113,113,0.1);
  border-color: rgba(248,113,113,0.4);
  color: #f87171;
}

.confirm-btn.active {
  background: rgba(74,222,128,0.2);
  border-color: #4ade80;
  color: #4ade80;
}

.rsvp-success {
  text-align: center;
  padding: 1rem;
  color: #4ade80;
  font-size: 0.9rem;
}

.footer {
  padding: 1rem 2rem;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.04);
}

.footer p {
  color: rgba(255,255,255,0.15);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}`

const DEFAULT_JS = `// Ce script est injecté et gère la communication (RSVP via postMessage).
document.addEventListener('DOMContentLoaded', function() {
  var formSection = document.getElementById('rsvp-form');
  var successSection = document.getElementById('rsvp-success');
  var statusMsg = document.getElementById('rsvp-status-msg');
  var editBtn = document.getElementById('rsvp-edit-btn');
  
  // Vérifier si l'invité a déjà répondu (données injectées par la plateforme)
  if (window.GUEST_DATA && window.GUEST_DATA.rsvp_status) {
    if (formSection) formSection.style.display = 'none';
    if (successSection) successSection.style.display = 'block';
    
    if (statusMsg) {
      var s = window.GUEST_DATA.rsvp_status;
      if (s === 'confirmed') statusMsg.innerHTML = '🎉 Présence confirmée !';
      else if (s === 'declined') statusMsg.innerHTML = '😔 Vous avez décliné.';
      else statusMsg.innerHTML = '🤔 Réponse en attente (Peut-être).';
    }
    
    // Marquer le bon bouton comme actif
    document.querySelectorAll('[data-rsvp]').forEach(function(b) {
      if (b.getAttribute('data-rsvp') === window.GUEST_DATA.rsvp_status) {
        b.classList.add('active');
      }
    });
  }

  // Gérer le clic sur "Modifier ma réponse"
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      if (formSection) formSection.style.display = 'block';
      if (successSection) successSection.style.display = 'none';
    });
  }
  
  // Gestion clics sur les boutons RSVP rapides
  document.querySelectorAll('[data-rsvp]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var status = this.getAttribute('data-rsvp');
      
      document.querySelectorAll('[data-rsvp]').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      
      window.parent.postMessage({
        type: 'RSVP_SUBMIT',
        data: { rsvp_status: status, dietary_restrictions: '', plus_one: false, notes: '' }
      }, '*');
      
      setTimeout(function() {
        if (formSection) formSection.style.display = 'none';
        if (successSection) successSection.style.display = 'block';
        if (statusMsg) {
          if (status === 'confirmed') statusMsg.innerHTML = '🎉 Présence confirmée !';
          else if (status === 'declined') statusMsg.innerHTML = '😔 Vous avez décliné.';
          else statusMsg.innerHTML = '🤔 Réponse : Peut-être.';
        }
      }, 500);
    });
  });
  // Gestion des formulaires classiques (Bouton Envoyer ma réponse)
  document.addEventListener('submit', function(e) {
    if (e.target.tagName.toLowerCase() === 'form') {
      e.preventDefault();
      var formData = new FormData(e.target);
      var rStatus = formData.get('rsvp_status') || 'confirmed';
      
      // Update btn state visually
      var submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = 'Enregistrement...';
        submitBtn.style.opacity = '0.7';
      }

      window.parent.postMessage({
        type: 'RSVP_SUBMIT',
        data: {
          rsvp_status: rStatus,
          dietary_restrictions: formData.get('dietary_restrictions') || '',
          plus_one: formData.get('plus_one') === 'on',
          notes: formData.get('notes') || ''
        }
      }, '*');

      setTimeout(function() {
        if (formSection) formSection.style.display = 'none';
        if (successSection) successSection.style.display = 'block';
        if (statusMsg) {
          if (rStatus === 'confirmed') statusMsg.innerHTML = '🎉 Présence confirmée !';
          else if (rStatus === 'declined') statusMsg.innerHTML = '😔 Vous avez décliné.';
          else statusMsg.innerHTML = '🤔 Réponse : Peut-être.';
        }
        
        // Mettre à jour les couleurs des boutons radio customs si existants
        document.querySelectorAll('[data-rsvp]').forEach(function(b) {
            b.classList.remove('active');
            if (b.getAttribute('data-rsvp') === rStatus) b.classList.add('active');
        });
      }, 500);
    }
  });
});`

export default function CodeTemplateEditor({ template, onChange }) {
  const [activeTab, setActiveTab] = useState('html')
  const [html, setHtml] = useState(template?.html || DEFAULT_HTML)
  const [css, setCss] = useState(template?.css || DEFAULT_CSS)
  const [js, setJs] = useState(template?.js || DEFAULT_JS)
  const [copied, setCopied] = useState(null)

  // Si on reçoit un nouveau template depuis l'IA, mettre à jour les champs
  useEffect(() => {
    if (template?.html && template.html !== html) setHtml(template.html)
    if (template?.css && template.css !== css) setCss(template.css)
    if (template?.js && template.js !== js) setJs(template.js || DEFAULT_JS)
  }, [template?.html, template?.css, template?.js])

  // Appliquer les changements au parent en temps réel
  function applyChanges(newHtml = html, newCss = css, newJs = js) {
    onChange({
      type: 'code',
      html: newHtml,
      css: newCss,
      js: newJs,
    })
  }

  function handleHtmlChange(val) {
    setHtml(val)
    applyChanges(val, css, js)
  }
  function handleCssChange(val) {
    setCss(val)
    applyChanges(html, val, js)
  }
  function handleJsChange(val) {
    setJs(val)
    applyChanges(html, css, val)
  }

  function handleReset() {
    if (!confirm('Réinitialiser avec le modèle par défaut ?')) return
    setHtml(DEFAULT_HTML)
    setCss(DEFAULT_CSS)
    setJs(DEFAULT_JS)
    applyChanges(DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS)
  }

  async function handleCopy(content, key) {
    await navigator.clipboard.writeText(content)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const tabs = [
    { key: 'html', label: 'HTML', icon: Code, color: 'text-orange-400', content: html, onChange: handleHtmlChange },
    { key: 'css', label: 'CSS', icon: Palette, color: 'text-blue-400', content: css, onChange: handleCssChange },
    { key: 'js', label: 'JavaScript (RSVP)', icon: Zap, color: 'text-yellow-400', content: js, onChange: handleJsChange },
  ]

  const activeTabData = tabs.find(t => t.key === activeTab)

  // Force apply on mount in case switching from another template type
  useEffect(() => {
    applyChanges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Info Banner */}
      <div className="bg-muted/30 border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-primary" /> Éditeur de Modèle Personnalisé
        </p>
        <p>Variables disponibles : <code className="text-primary text-[10px]">{'{{EVENT_TITLE}}'}</code>, <code className="text-primary text-[10px]">{'{{GUEST_NAME}}'}</code>, <code className="text-primary text-[10px]">{'{{EVENT_LOCATION}}'}</code>, <code className="text-primary text-[10px]">{'{{EVENT_DATE}}'}</code>, <code className="text-primary text-[10px]">{'{{DRESS_CODE}}'}</code>, <code className="text-primary text-[10px]">{'{{TIME}}'}</code></p>
        <p className="text-[10px] opacity-70">L'onglet JS est automatiquement injecté dans l'iframe. Il gère le RSVP via <code>postMessage</code>.</p>
      </div>

      {/* Tab Headers */}
      <div className="flex items-center gap-1 p-1 bg-muted/20 border border-border rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${activeTab === tab.key
              ? 'bg-card border border-border shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
          >
            <tab.icon className={`w-3 h-3 ${activeTab === tab.key ? tab.color : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 relative flex flex-col min-h-0">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border border-border border-b-0 rounded-t-lg">
          <span className={`text-xs font-mono font-semibold ${activeTabData?.color}`}>
            {activeTabData?.label.toLowerCase()}.{activeTab === 'html' ? 'html' : activeTab === 'css' ? 'css' : 'js'}
          </span>
          <button
            onClick={() => handleCopy(activeTabData?.content || '', activeTab)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied === activeTab ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied === activeTab ? 'Copié' : 'Copier'}
          </button>
        </div>

        <textarea
          value={activeTabData?.content || ''}
          onChange={e => activeTabData?.onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full font-mono text-xs bg-[#1e1e2e] text-[#cdd6f4] border border-border rounded-b-lg p-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[300px] custom-scrollbar leading-relaxed"
          placeholder="// Votre code ici..."
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Réinitialiser
        </Button>
        <Button
          size="sm"
          onClick={() => applyChanges()}
          className="flex-1 gap-1.5"
        >
          <Eye className="w-3 h-3" />
          Rafraîchir l'aperçu
        </Button>
      </div>
    </div>
  )
}
