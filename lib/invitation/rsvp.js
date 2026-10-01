import { escapeHtml } from "@/lib/invitation/html";
import { DEFAULT_CONTENT } from "@/lib/invitation/content";

/**
 * Réponse de l'invité (RSVP) : bloc HTML et script, communs à toutes les
 * invitations.
 */

/**
 * Bloc RSVP. Le balisage suit le contrat attendu par RSVP_SCRIPT ; les designs
 * ne font que le styler via les classes `rsvp-*`.
 */
export function renderRsvpBlock(rsvp) {
  const labels = { ...DEFAULT_CONTENT.rsvp, ...rsvp };
  return `<section class="rsvp">
  <h2 class="rsvp-title">${escapeHtml(labels.title)}</h2>
  <div id="rsvp-form" class="rsvp-form">
    <div class="rsvp-buttons">
      <button type="button" class="rsvp-btn rsvp-btn--confirmed" data-rsvp="confirmed">${escapeHtml(labels.confirmed)}</button>
      <button type="button" class="rsvp-btn rsvp-btn--maybe" data-rsvp="maybe">${escapeHtml(labels.maybe)}</button>
      <button type="button" class="rsvp-btn rsvp-btn--declined" data-rsvp="declined">${escapeHtml(labels.declined)}</button>
    </div>
  </div>
  <div id="rsvp-success" class="rsvp-success" hidden>
    <p id="rsvp-status-msg" class="rsvp-status"></p>
    <button type="button" id="rsvp-edit-btn" class="rsvp-edit">Modifier ma réponse</button>
  </div>
</section>`;
}

/**
 * Script RSVP des designs. Il relaie la réponse au parent par postMessage
 * (l'iframe a une origine opaque, voir InvitationPreview) et gère l'état
 * « déjà répondu » / « modifier ma réponse ».
 */
export const RSVP_SCRIPT = `
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('rsvp-form');
  var success = document.getElementById('rsvp-success');
  var message = document.getElementById('rsvp-status-msg');
  var editBtn = document.getElementById('rsvp-edit-btn');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-rsvp]'));
  var MESSAGES = {
    confirmed: '🎉 Présence confirmée, merci !',
    maybe: '🤔 Réponse notée : peut-être.',
    declined: '😔 Vous avez décliné. Merci de nous avoir prévenus.'
  };
  var current = window.GUEST_DATA && window.GUEST_DATA.rsvp_status ? window.GUEST_DATA.rsvp_status : null;
  var submitting = false;

  function setActive(status) {
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-rsvp') === status);
    });
  }
  function setDisabled(disabled) {
    buttons.forEach(function (btn) { btn.disabled = disabled; });
  }
  function showSuccess(status) {
    current = status;
    setActive(status);
    if (message) message.textContent = MESSAGES[status] || MESSAGES.maybe;
    if (form) form.hidden = true;
    if (success) success.hidden = false;
  }
  function showForm() {
    if (form) form.hidden = false;
    if (success) success.hidden = true;
    setActive(current);
    setDisabled(false);
  }

  if (current) showSuccess(current);

  if (editBtn) {
    editBtn.addEventListener('click', function (e) {
      e.preventDefault();
      submitting = false;
      showForm();
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (submitting) return;
      var status = btn.getAttribute('data-rsvp');
      if (!status) return;
      submitting = true;
      setActive(status);
      setDisabled(true);
      window.parent.postMessage({
        type: 'RSVP_SUBMIT',
        data: { rsvp_status: status, dietary_restrictions: '', plus_one: false, notes: '' }
      }, '*');
      setTimeout(function () {
        showSuccess(status);
        submitting = false;
      }, 400);
    });
  });
});`;
