import { requireAdmin, getCurrentUser } from '@/app/actions/auth'
import Link from 'next/link'
import { LayoutDashboard, Users, BarChart3, Shield } from 'lucide-react'

export default async function AdminLayout({ children }) {
  await requireAdmin()
  const user = await getCurrentUser()

  const nav = [
    { label: 'Vue d\'ensemble', href: '/admin', icon: LayoutDashboard },
    { label: 'Utilisateurs', href: '/admin/users', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-bold text-lg">Invyra Admin</span>
          </div>
          <p className="text-xs text-muted-foreground">Panel d&apos;administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Connecté en tant que</p>
          <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" /> Admin
          </div>
          <Link href="/dashboard" className="block mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Revenir au Dashboard
          </Link>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
