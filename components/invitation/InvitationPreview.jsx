"use client";

// InvitationPreview.jsx — HTML/CSS pure invitation renderer from a template JSON

export default function InvitationPreview({
  template,
  event,
  guestName,
  rsvpData,
  onRSVPSubmit,
  readOnly,
}) {
  if (!template || !event) return null;

  // Ensure backward compatibility or graceful fallback if template is empty
  const rawHtml =
    template.html ||
    '<div style="padding:4rem;text-align:center;"><h1>{{EVENT_TITLE}}</h1><p>Invité: {{GUEST_NAME}}</p></div>';
  const rawCss =
    template.css ||
    "body { background: #111; color: #fff; font-family: sans-serif; }";

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  console.log(event);
  // Inject variables
  const htmlContent = rawHtml
    .replace(/{{EVENT_TITLE}}/g, event.title || "Nom de l'événement")
    .replace(/{{GUEST_NAME}}/g, guestName || "Prénom Nom")
    .replace(/{{LOCATION}}/g, event.location || "Lieu")
    .replace(/{{EVENT_LOCATION}}/g, event.location || "Lieu")
    .replace(/{{TIME}}/g, event.time || formattedDate || "Date & Heure")
    .replace(/{{EVENT_DATE}}/g, formattedDate || "Date")
    .replace(
      /{{DRESS_CODE}}/g,
      event.dressCode || event.dress_code || "Non précisé",
    );

  const scriptContent = readOnly
    ? "" // En aperçu galerie : pas d'interaction
    : template.js ||
      `
  // Script de secours générique si le template ne fournit pas de JS
  document.addEventListener('DOMContentLoaded', function() {
    var formSection = document.getElementById('rsvp-form');
    var successSection = document.getElementById('rsvp-success');
    var statusMsg = document.getElementById('rsvp-status-msg');
    var editBtn = document.getElementById('rsvp-edit-btn');
    
    if (window.GUEST_DATA && window.GUEST_DATA.rsvp_status) {
      if (formSection) formSection.style.display = 'none';
      if (successSection) successSection.style.display = 'block';
      if (statusMsg) {
        var s = window.GUEST_DATA.rsvp_status;
        if (s === 'confirmed') statusMsg.innerHTML = '🎉 Présence confirmée !';
        else if (s === 'declined') statusMsg.innerHTML = '😔 Vous avez décliné.';
        else statusMsg.innerHTML = '🤔 Réponse en attente (Peut-être).';
      }
      document.querySelectorAll('[data-rsvp]').forEach(function(b) {
        if (b.getAttribute('data-rsvp') === window.GUEST_DATA.rsvp_status) b.classList.add('active');
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', function() {
        if (formSection) formSection.style.display = 'block';
        if (successSection) successSection.style.display = 'none';
      });
    }

    document.addEventListener('submit', function(e) {
      if (e.target.tagName.toLowerCase() === 'form') {
        e.preventDefault();
        var formData = new FormData(e.target);
        window.parent.postMessage({
          type: 'RSVP_SUBMIT',
          data: {
            rsvp_status: formData.get('rsvp_status') || 'confirmed',
            dietary_restrictions: formData.get('dietary_restrictions') || '',
            plus_one: formData.get('plus_one') === 'on' || formData.get('plus_one') === 'true',
            notes: formData.get('notes') || ''
          }
        }, '*');
      }
    });

    document.addEventListener('click', function(e) {
      // Compatibilité nouveau modèle
      var btnRsvp = e.target.closest('[data-rsvp]');
      if (btnRsvp) {
        e.preventDefault();
        var status = btnRsvp.getAttribute('data-rsvp');
        window.parent.postMessage({ type: 'RSVP_SUBMIT', data: { rsvp_status: status } }, '*');
        return;
      }
      
      // Compatibilité avec l'ancien modèle (btn-yes / btn-no)
      if (e.target.closest('.btn-yes')) {
        e.preventDefault();
        window.parent.postMessage({ type: 'RSVP_SUBMIT', data: { rsvp_status: 'confirmed' } }, '*');
      } else if (e.target.closest('.btn-no')) {
        e.preventDefault();
        window.parent.postMessage({ type: 'RSVP_SUBMIT', data: { rsvp_status: 'declined' } }, '*');
      }
    });
  });`;

  const iframeDoc = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<style>
html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; overflow-x: hidden; }
${rawCss}
</style>
</head>
<body>
${htmlContent}
<script>
  window.GUEST_DATA = ${JSON.stringify(rsvpData || null)};
</script>
<script>
${scriptContent}
</script>
</body>
</html>`;

  return (
    <iframe
      srcDoc={iframeDoc}
      title="Invitation preview"
      className="w-full h-full border-0"
      style={{ minHeight: "100%", display: "block" }}
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      scrolling="yes"
    />
  );
}
