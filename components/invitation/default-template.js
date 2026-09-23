/**
 * Contenu de départ d'un nouveau modèle.
 *
 * Extrait de l'éditeur : ces trois chaînes faisaient 500 lignes au-dessus du
 * composant, ce qui obligeait à les faire défiler pour atteindre la moindre
 * ligne de logique.
 *
 * Les jetons {{...}} sont remplacés au rendu par InvitationPreview.
 */

const DEFAULT_HTML = `<div class="invitation-wrapper">
  <div class="invitation-card">
    <div class="header-decoration"></div>
    
    <!-- HERO IMAGE -->
    <div class="hero">
      <div class="hero-content">
        <p class="eyebrow">Invitation Exclusive</p>
        <h1 class="event-title">{{EVENT_TITLE}}</h1>
      </div>
    </div>

    <!-- CONTENU -->
    <div class="content">
      <div class="divider"></div>
      
      <p class="guest-name">Cher(e) <strong>{{GUEST_NAME}}</strong>,</p>
      <p class="description">
        Nous avons l'honneur de vous inviter à un moment unique, 
        une célébration exceptionnelle où l’amour et l’élégance se rencontrent.
      </p>

      <div class="details">
        <div class="detail-item">
          <span class="icon">📅</span>
          <span>{{EVENT_DATE}}</span>
        </div>

        <div class="detail-item">
          <span class="icon">📍</span>
          <span>{{EVENT_LOCATION}}</span>
        </div>

        <div class="detail-item">
          <span class="icon">👗</span>
          <span>{{DRESS_CODE}}</span>
        </div>

        <div class="detail-item">
          <span class="icon">⏰</span>
          <span>{{TIME}}</span>
        </div>
      </div>
    </div>

    <!-- STORY -->
    <div class="section">
      <h3 class="section-title">💖 Notre histoire</h3>
      <p>
        Chaque grande histoire commence par une rencontre.
        La nôtre s’est construite à travers les moments partagés,
        les défis surmontés et un amour qui n’a cessé de grandir.
      </p>
      <p>
        Aujourd’hui, nous écrivons ensemble le plus beau chapitre :
        celui de notre union.
      </p>

      <div class="image-block" style="background-image:url('https://images.unsplash.com/photo-1519741497674-611481863552');"></div>
    </div>

    <!-- PROGRAM -->
    <div class="section alt">
      <h3 class="section-title">🗓 Programme</h3>
      <div class="timeline">
        <div class="timeline-item">⏰ <strong>16:00</strong> – Accueil des invités</div>
        <div class="timeline-item">💍 <strong>17:00</strong> – Cérémonie</div>
        <div class="timeline-item">🍽 <strong>19:00</strong> – Dîner</div>
        <div class="timeline-item">🎉 <strong>22:00</strong> – Soirée dansante</div>
      </div>

      <div class="image-block" style="background-image:url('https://images.unsplash.com/photo-1505236858219-8359eb29e329');"></div>
    </div>

    <!-- VENUE -->
    <div class="section">
      <h3 class="section-title">📍 Le lieu</h3>
      <p>
        Le lieu de la cérémonie a été choisi avec soin pour offrir
        un cadre magique et inoubliable.
      </p>
      <p>
        Préparez-vous à vivre une expérience unique dans un environnement
        raffiné et chaleureux.
      </p>

      <div class="image-block" style="background-image:url('https://images.unsplash.com/photo-1522673607200-164d1b6ce486');"></div>
    </div>

    <!-- DRESS CODE -->
    <div class="section alt">
      <h3 class="section-title">👗 Dress Code</h3>
      <p>
        Une tenue élégante est recommandée pour cette occasion.
        Laissez parler votre style tout en respectant le thème de l’événement.
      </p>

      <div class="image-block" style="background-image:url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc');"></div>
    </div>

    <!-- GALLERY -->
    <div class="section">
      <h3 class="section-title">📸 Galerie</h3>
      <p>
        Quelques souvenirs de notre parcours ensemble…
      </p>

      <div class="gallery">
        <div class="gallery-item" style="background-image:url('https://images.unsplash.com/photo-1522673607200-164d1b6ce486')"></div>
        <div class="gallery-item" style="background-image:url('https://images.unsplash.com/photo-1505236858219-8359eb29e329')"></div>
        <div class="gallery-item" style="background-image:url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc')"></div>
      </div>
    </div>

    <!-- RSVP -->
    <div class="rsvp-section">
      <h3 class="rsvp-title">Confirmer votre présence</h3>
      
      <div id="rsvp-form">
        <div class="rsvp-buttons">
          <button class="rsvp-btn confirm-btn" data-rsvp="confirmed">✅ Oui, je viens</button>
          <button class="rsvp-btn maybe-btn" data-rsvp="maybe">🤔 Peut-être</button>
          <button class="rsvp-btn decline-btn" data-rsvp="declined">❌ Je ne pourrai pas</button>
        </div>
      </div>
      
      <div id="rsvp-success" class="rsvp-success" style="display:none">
        <p id="rsvp-status-msg">🎉 Merci pour votre réponse !</p>
        <button id="rsvp-edit-btn" class="rsvp-edit-btn" style="margin-top:1rem;background:transparent;border:1px solid #d4af37;color:#d4af37;padding:0.5rem 1rem;border-radius:0.5rem;cursor:pointer;font-size:0.8rem">
          Modifier ma réponse
        </button>
      </div>
    </div>

    <!-- FAQ -->
    <div class="section alt">
      <h3 class="section-title">❓ Informations</h3>
      <p><strong>+1 autorisé ?</strong><br>Merci de vérifier votre invitation.</p>
      <p><strong>Parking disponible ?</strong><br>Oui, sur place.</p>
      <p><strong>Enfants ?</strong><br>Selon invitation.</p>
    </div>

    <!-- FINAL -->
    <div class="section">
      <h3 class="section-title">💌 Message final</h3>
      <p>
        Votre présence rendra ce moment encore plus spécial.
        Nous avons hâte de célébrer avec vous.
      </p>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p>
        Developed by 
        <a href="https://instagram.com/kevinarmache" target="_blank" rel="noopener noreferrer" 
        style="color:inherit;text-decoration:underline;opacity:0.7;">
        Kevin Armache
        </a>
      </p>
    </div>

  </div>
</div>`;

const DEFAULT_CSS = `/* RESET */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cormorant Garamond', Georgia, serif;
  padding: 2rem;
}

/* WRAPPER */
.invitation-wrapper {
  width: 100%;
  max-width: 480px;
}

/* CARD */
.invitation-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  animation: fadeIn 1s ease;
}

/* HEADER LINE */
.header-decoration {
  height: 4px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}

/* HERO IMAGE */
.hero {
  height: 220px;
  background: url('https://images.unsplash.com/photo-1520857014576-2c4f4c972b57') center/cover;
  position: relative;
}

.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
}

.hero-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}

/* CONTENT */
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
}

.event-title {
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.divider {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
  margin: 0 auto 1.5rem;
}

/* TEXT */
.guest-name {
  color: rgba(255,255,255,0.7);
  font-size: 1rem;
  margin-bottom: 0.75rem;
  font-style: italic;
}

.guest-name strong { color: #d4af37; }

.description {
  color: rgba(255,255,255,0.45);
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

/* DETAILS */
.details {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.75rem;
  color: rgba(255,255,255,0.7);
  font-size: 0.85rem;
  transition: 0.3s;
}

.detail-item:hover {
  transform: translateY(-3px);
  background: rgba(212,175,55,0.08);
  border-color: rgba(212,175,55,0.4);
}

.icon { font-size: 1rem; }

/* SECTIONS */
.section {
  padding: 2rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.section.alt {
  background: rgba(255,255,255,0.02);
}

.section-title {
  color: #d4af37;
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.section p {
  color: rgba(255,255,255,0.5);
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* IMAGE BLOCK */
.image-block {
  height: 160px;
  border-radius: 1rem;
  background-size: cover;
  background-position: center;
  margin-top: 1rem;
}

/* GALLERY */
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.gallery-item {
  height: 80px;
  border-radius: 0.5rem;
  background-size: cover;
  background-position: center;
}

/* RSVP */
.rsvp-section {
  padding: 1.5rem 2rem;
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
  cursor: pointer;
  transition: 0.2s;
}

.rsvp-btn:hover { transform: translateY(-2px); }

.confirm-btn.active { color:#4ade80; border-color:#4ade80; }
.maybe-btn.active { color:#facc15; border-color:#facc15; }
.decline-btn.active { color:#f87171; border-color:#f87171; }

.rsvp-success {
  text-align: center;
  padding: 1rem;
  color: #4ade80;
}

/* FOOTER */
.footer {
  padding: 1rem;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.04);
}

.footer p {
  color: rgba(255,255,255,0.2);
  font-size: 0.65rem;
}

/* ANIMATION */
@keyframes fadeIn {
  from { opacity:0; transform: translateY(10px); }
  to { opacity:1; transform: translateY(0); }
}`;

const DEFAULT_JS = `// RSVP template script: uniquement l'essentiel (init, clics, "Merci", modification, postMessage).
document.addEventListener('DOMContentLoaded', function() {
  // ─────────────────────────────────────────────────────────────────────────────
  // DOM: éléments RSVP attendus par le template
  // ─────────────────────────────────────────────────────────────────────────────
  var formSection = document.getElementById('rsvp-form');
  var successSection = document.getElementById('rsvp-success');
  var statusMsg = document.getElementById('rsvp-status-msg');
  var editBtn = document.getElementById('rsvp-edit-btn');
  var rsvpButtons = Array.prototype.slice.call(document.querySelectorAll('[data-rsvp]'));

  // ─────────────────────────────────────────────────────────────────────────────
  // Etat local (pour "Modifier ma réponse" et éviter les double-soumissions)
  // ─────────────────────────────────────────────────────────────────────────────
  var currentStatus = null;
  var isSubmitting = false;

  function setButtonsDisabled(disabled) {
    rsvpButtons.forEach(function(btn) {
      btn.disabled = !!disabled;
      btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    });
  }

  // Garantit "une seule réponse à la fois" côté UI (un seul bouton avec la classe active).
  function setActiveStatus(status) {
    rsvpButtons.forEach(function(btn) {
      btn.classList.remove('active');
      if (btn.getAttribute('data-rsvp') === status) btn.classList.add('active');
    });
  }

  function updateStatusMessage(status) {
    if (!statusMsg) return;
    if (status === 'confirmed') statusMsg.innerHTML = '🎉 Présence confirmée !';
    else if (status === 'declined') statusMsg.innerHTML = '😔 Vous avez décliné.';
    else statusMsg.innerHTML = '🤔 Réponse : Peut-être.';
  }

  function showSuccess(status) {
    currentStatus = status;
    if (formSection) formSection.style.display = 'none';
    if (successSection) successSection.style.display = 'block';

    // Marque visuellement la réponse sélectionnée
    setActiveStatus(status);
    updateStatusMessage(status);
  }

  function showForm() {
    if (formSection) formSection.style.display = 'block';
    if (successSection) successSection.style.display = 'none';

    // Repartir avec la dernière réponse sélectionnée (modifiable)
    setActiveStatus(currentStatus);
    setButtonsDisabled(false);
  }

  // 1) Initialisation au chargement de la page (si l'invité a déjà répondu)
  var initialStatus =
    window.GUEST_DATA && window.GUEST_DATA.rsvp_status ? window.GUEST_DATA.rsvp_status : null;

  if (initialStatus) {
    showSuccess(initialStatus);
    // Bloque toute nouvelle sélection tant que l'on n'a pas cliqué "Modifier"
    setButtonsDisabled(true);
  } else {
    setButtonsDisabled(false);
  }

  // 2) Modification possible: revenir sur le formulaire RSVP
  if (editBtn) {
    editBtn.addEventListener('click', function(e) {
      e.preventDefault();
      isSubmitting = false;
      showForm();
    });
  }

  // 3) Gestion des clics sur les boutons RSVP + communication parent via postMessage
  rsvpButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();

      // Empêche les double-soumissions (ex: clics rapides)
      if (isSubmitting) return;

      var status = btn.getAttribute('data-rsvp');
      if (!status) return;

      isSubmitting = true;

      // Garantit l'unicité de sélection dans l'UI
      setActiveStatus(status);
      setButtonsDisabled(true);

      // Envoie la réponse à la plateforme (parent de l'iframe)
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(
          {
            type: 'RSVP_SUBMIT',
            data: {
              rsvp_status: status,
              dietary_restrictions: '',
              plus_one: false,
              notes: ''
            }
          },
          '*'
        );
      }

      // 4) Affiche la section "Merci" après la réponse
      setTimeout(function() {
        showSuccess(status);
        isSubmitting = false;
      }, 500);
    });
  });
});`;

export { DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS };
