'use client'

// InvitationPreview.jsx — HTML/CSS pure invitation renderer from a template JSON

export default function InvitationPreview({ template, event, guestName, onRSVP }) {
  if (!template || !event) return null

  const t = template
  const borderStr = t.borderStyle && t.borderStyle !== 'none'
    ? `2px ${t.borderStyle} ${t.borderColor || t.primaryColor}${opacityToHex(t.borderOpacity ?? 0.5)}`
    : 'none'

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
    : null

  if (template.type === 'code' || template.type === 'jsx') {
    const rawCss = template.css || ''
    const rawHtml = template.html || ''

    // Inject variables
    const htmlContent = rawHtml
      .replace(/{{EVENT_NAME}}/g, event.title || "Nom de l'événement")
      .replace(/{{EVENT_TITLE}}/g, event.title || "Nom de l'événement")
      .replace(/{{GUEST_NAME}}/g, guestName || 'Prénom Nom')
      .replace(/{{LOCATION}}/g, event.location || 'Lieu')
      .replace(/{{EVENT_LOCATION}}/g, event.location || 'Lieu')
      .replace(/{{TIME}}/g, event.time || (formattedDate || 'Date & Heure'))
      .replace(/{{EVENT_DATE}}/g, formattedDate || 'Date')
      .replace(/{{DRESS_CODE}}/g, event.dressCode || event.dress_code || 'Non précisé')

    // Build a complete HTML document to load inside an iframe
    // This isolates the template's CSS from the rest of the app
    const iframeDoc = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<style>
html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; }
${rawCss}
</style>
</head>
<body>
${htmlContent}
</body>
</html>`

    return (
      <iframe
        srcDoc={iframeDoc}
        title="Invitation Preview"
        className="w-full h-full border-0"
        style={{ minHeight: '100%', display: 'block' }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        scrolling="yes"
      />
    )
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        background: t.bgImage
          ? `url(${t.bgImage}) center/cover no-repeat`
          : `linear-gradient(135deg, ${(t.bgGradient || [t.bgColor || '#0f0c08', '#000'])[0]}, ${(t.bgGradient || ['#0f0c08', '#000'])[1]})`,
        fontFamily: t.fontFamily || 'Georgia, serif',
        minHeight: '100%',
      }}
    >
      {/* Overlay for readability on photos */}
      {t.bgImage && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Glitter/sparkle effect */}
      {t.glitter && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                background: t.primaryColor,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Corner decorations */}
      {t.cornerDecoration && (
        <>
          <CornerSVG color={t.primaryColor} position="top-left" />
          <CornerSVG color={t.primaryColor} position="top-right" />
          <CornerSVG color={t.primaryColor} position="bottom-left" />
          <CornerSVG color={t.primaryColor} position="bottom-right" />
        </>
      )}

      {/* Main card */}
      <div
        className="relative z-10 text-center flex flex-col items-center gap-6 py-10 px-8 sm:px-12 w-[90%] max-w-2xl mx-auto"
        style={{
          border: borderStr,
          background: t.cardBg
            ? `${t.cardBg}${opacityToHex(t.cardBgOpacity ?? 0)}`
            : 'transparent',
          borderRadius: '2px',
          boxShadow: borderStr !== 'none' ? '0 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Floral top accent */}
        {t.floral && (
          <div className="text-4xl mb-2 opacity-70">🌸 🌿 🌸</div>
        )}

        {/* Header */}
        <h1
          className="font-bold tracking-tight leading-tight"
          style={{
            color: t.primaryColor,
            fontSize: t.headerFontSize || '3rem',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}
        >
          {t.headerText || 'You are Invited'}
        </h1>

        {/* Sub-header */}
        {t.subHeaderText && (
          <p
            className="tracking-widest uppercase text-sm"
            style={{ color: `${t.textColor}aa`, letterSpacing: '0.25em' }}
          >
            {t.subHeaderText}
          </p>
        )}

        {/* Thin separator */}
        <div className="w-24 h-px mx-auto" style={{ background: `${t.primaryColor}80` }} />

        {/* Event title */}
        <h2
          className="font-semibold"
          style={{
            color: t.textColor,
            fontSize: t.headerFontSize ? `calc(${t.headerFontSize} * 0.65)` : '1.8rem',
          }}
        >
          {event.title}
        </h2>

        {/* Guest name */}
        {guestName && (
          <p
            className="font-light"
            style={{ color: `${t.textColor}dd`, fontSize: t.bodyFontSize || '1rem' }}
          >
            Cher(e) <strong style={{ color: t.accentColor || t.primaryColor }}>{guestName}</strong>
          </p>
        )}

        {/* Custom message */}
        {event.customMessage && (
          <p
            className="italic font-light leading-relaxed max-w-md"
            style={{ color: `${t.textColor}cc`, fontSize: t.bodyFontSize || '1rem' }}
          >
            "{event.customMessage}"
          </p>
        )}

        {/* Thin separator */}
        <div className="w-16 h-px mx-auto" style={{ background: `${t.primaryColor}50` }} />

        {/* Event details */}
        <div className="flex flex-col gap-2 text-center">
          {formattedDate && (
            <p style={{ color: `${t.textColor}dd`, fontSize: t.bodyFontSize }}>
              <span className="mr-2 opacity-70">📅</span>
              <span className="capitalize">{formattedDate}</span>
            </p>
          )}
          {event.location && (
            <p style={{ color: `${t.textColor}cc`, fontSize: t.bodyFontSize }}>
              <span className="mr-2 opacity-70">📍</span>
              {event.location}
            </p>
          )}
        </div>

        {/* Floral bottom accent */}
        {t.floral && (
          <div className="text-4xl mt-2 opacity-70">🌿 🌸 🌿</div>
        )}

        {/* RSVP Button */}
        {onRSVP && (
          <button
            onClick={onRSVP}
            className="mt-2 px-8 py-3 font-medium tracking-widest uppercase text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: t.buttonColor || t.primaryColor,
              color: t.buttonTextColor || '#fff',
              borderRadius: '2px',
              letterSpacing: '0.2em',
              boxShadow: `0 4px 20px ${t.buttonColor || t.primaryColor}60`,
            }}
          >
            {t.buttonLabel || 'RSVP'}
          </button>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  )
}

function opacityToHex(opacity) {
  return Math.round((opacity ?? 1) * 255).toString(16).padStart(2, '0')
}

function CornerSVG({ color, position }) {
  const styles = {
    'top-left': { top: 12, left: 12, transform: 'rotate(0deg)' },
    'top-right': { top: 12, right: 12, transform: 'rotate(90deg)' },
    'bottom-left': { bottom: 12, left: 12, transform: 'rotate(270deg)' },
    'bottom-right': { bottom: 12, right: 12, transform: 'rotate(180deg)' },
  }
  return (
    <svg
      width="48" height="48" viewBox="0 0 48 48"
      className="absolute opacity-60 pointer-events-none"
      style={styles[position]}
    >
      <path d="M4 44 L4 4 L44 4" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="4" cy="4" r="2" fill={color} />
    </svg>
  )
}
