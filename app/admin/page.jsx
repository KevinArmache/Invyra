import { getAdminStats } from '@/app/actions/admin'
import { Users, Calendar, LayoutTemplate, Shield } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Admin — Invyra' }

export default async function AdminPage() {
  const stats = await getAdminStats()

  const cards = [
    { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-blue-400 bg-blue-400/10', href: '/admin/users' },
    { label: 'Événements', value: stats.totalEvents, icon: Calendar, color: 'text-primary bg-primary/10', href: null },
    { label: 'Modèles', value: stats.totalTemplates, icon: LayoutTemplate, color: 'text-violet-400 bg-violet-400/10', href: null },
    { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-red-400 bg-red-400/10', href: '/admin/users' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vue d&apos;ensemble</h1>
        <p className="text-muted-foreground mt-1">Statistiques globales de la plateforme Invyra</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => {
          const content = (
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          )
          return card.href ? (
            <Link key={card.label} href={card.href} className="block">{content}</Link>
          ) : (
            <div key={card.label}>{content}</div>
          )
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Gérer les utilisateurs
          </Link>
        </div>
      </div>
    </div>
  )
}
