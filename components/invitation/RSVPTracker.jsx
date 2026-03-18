'use client'

import { CheckCircle, XCircle, HelpCircle, Clock, Users, TrendingUp } from 'lucide-react'

export default function RSVPTracker({ guests = [] }) {
  const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length
  const declined = guests.filter(g => g.rsvpStatus === 'declined').length
  const maybe = guests.filter(g => g.rsvpStatus === 'maybe').length
  const pending = guests.filter(g => !g.rsvpStatus).length
  const total = guests.length
  const responseRate = total > 0 ? Math.round(((confirmed + declined + maybe) / total) * 100) : 0

  const stats = [
    { label: 'Confirmés', count: confirmed, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
    { label: 'Peut-être', count: maybe, icon: HelpCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    { label: 'Déclinés', count: declined, icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
    { label: 'En attente', count: pending, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border' },
  ]

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`rounded-lg border p-3 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Taux de réponse</span>
            <span className="font-medium text-foreground">{responseRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${total > 0 ? ((confirmed + declined + maybe) / total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #22c55e, #84cc16)'
              }}
            />
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-l-full"
              style={{
                width: `${total > 0 ? (confirmed / total) * 100 : 0}%`,
                background: '#22c55e'
              }}
            />
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Confirmé</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Peut-être</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Décliné</span>
          </div>
        </div>
      )}
    </div>
  )
}
