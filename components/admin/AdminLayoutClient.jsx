'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Users, Shield, Menu, X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth'
import { useTranslation } from '@/utils/i18n/Context'

export default function AdminLayoutClient({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { locale, changeLocale } = useTranslation()

  const navigation = [
    { name: locale === 'fr' ? "Vue d'ensemble" : 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: locale === 'fr' ? 'Utilisateurs' : 'Users', href: '/admin/users', icon: Users },
  ]

  useEffect(() => {
    setIsClient(true)
    const savedState = localStorage.getItem('invyra_admin_sidebar_collapsed')
    if (savedState) setIsCollapsed(savedState === 'true')
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('invyra_admin_sidebar_collapsed', String(newState))
  }

  async function handleLogout() {
    await logout()
  }

  if (!isClient) return null

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed top-0 left-0 z-50 h-dvh flex flex-col bg-sidebar border-r border-sidebar-border
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed && !sidebarOpen ? 'lg:w-[88px]' : 'lg:w-64'}
        `}>
          {/* Logo & Toggle */}
          <div className="flex shrink-0 items-center justify-between h-16 px-4 border-b border-sidebar-border">
            {(!isCollapsed || sidebarOpen) && (
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <span className="font-bold text-lg whitespace-nowrap">Admin</span>
              </div>
            )}
            {isCollapsed && !sidebarOpen && (
              <div className="w-8 h-8 mx-auto rounded-lg bg-red-500/20 flex items-center justify-center cursor-pointer">
                <Shield className="w-4 h-4 text-red-500" />
              </div>
            )}
            <button
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
              onClick={toggleCollapse}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              className="lg:hidden p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2 no-scrollbar">
            {navigation.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors
                      ${isCollapsed && !sidebarOpen ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={22} className="shrink-0" />
                    {(!isCollapsed || sidebarOpen) && (
                      <span className="whitespace-nowrap overflow-hidden">{item.name}</span>
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && !sidebarOpen && (
                  <TooltipContent side="right" className="font-medium bg-popover text-popover-foreground ml-2">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className={`flex items-center rounded-lg text-primary hover:bg-primary/10 transition-colors border border-primary/20 mt-2
                    ${isCollapsed && !sidebarOpen ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <LayoutDashboard size={22} className="shrink-0" />
                  {(!isCollapsed || sidebarOpen) && (
                    <span className="whitespace-nowrap overflow-hidden font-medium">Dashboard</span>
                  )}
                </Link>
              </TooltipTrigger>
              {isCollapsed && !sidebarOpen && (
                <TooltipContent side="right" className="font-medium bg-popover text-popover-foreground ml-2">
                  {locale === 'fr' ? 'Retour au Dashboard' : 'Back to Dashboard'}
                </TooltipContent>
              )}
            </Tooltip>
          </nav>

          {/* Language switcher + User section */}
          <div className="shrink-0 p-3 border-t border-sidebar-border space-y-3">
            <div className={`flex items-center gap-1 bg-sidebar-accent/40 rounded-lg p-1 ${isCollapsed && !sidebarOpen ? 'flex-col' : 'flex-row'}`}>
              {['fr', 'en'].map(code => (
                <Tooltip key={code}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => changeLocale(code)}
                      className={`flex-1 flex items-center justify-center py-1.5 text-xs font-bold rounded-md transition-all duration-200
                        ${isCollapsed && !sidebarOpen ? 'w-full p-2' : 'gap-1.5'}
                        ${locale === code ? 'bg-primary text-primary-foreground shadow-sm' : 'text-sidebar-foreground hover:bg-sidebar-accent'}
                      `}
                    >
                      <span className="uppercase">{code}</span>
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && !sidebarOpen && (
                    <TooltipContent side="right" className="ml-2 font-medium">
                      {code === 'fr' ? 'Français' : 'English'}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>

            <div className={`flex items-center ${isCollapsed && !sidebarOpen ? 'justify-center py-2' : 'px-2'}`}>
              <div className="w-10 h-10 shrink-0 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-500 font-medium">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'A'}
                </span>
              </div>
              {(!isCollapsed || sidebarOpen) && (
                <div className="flex-1 min-w-0 ml-3">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.name || 'Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full text-muted-foreground hover:text-foreground
                    ${isCollapsed && !sidebarOpen ? 'justify-center px-0' : 'justify-start'}
                  `}
                  onClick={handleLogout}
                >
                  <LogOut size={20} className={!isCollapsed || sidebarOpen ? "mr-3 shrink-0" : "shrink-0"} />
                  {(!isCollapsed || sidebarOpen) && <span className="whitespace-nowrap overflow-hidden">{locale === 'fr' ? 'Déconnexion' : 'Sign out'}</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && !sidebarOpen && (
                <TooltipContent side="right" className="ml-2 font-medium">
                  {locale === 'fr' ? 'Déconnexion' : 'Sign out'}
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        {/* Main content wrapper */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-[88px]' : 'lg:pl-64'}`}>
          {/* Top bar */}
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-4 lg:hidden">
            <button
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label={locale === 'fr' ? 'Ouvrir le menu' : 'Open menu'}
            >
              <Menu size={24} />
            </button>
            <span className="ml-4 font-bold">{locale === 'fr' ? 'Panneau admin' : 'Admin panel'}</span>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-8 flex-1">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
