'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Eye, CheckCircle, Plus, ArrowRight } from 'lucide-react'
import { getEvents } from '@/app/actions/event'
import { useTranslation } from '@/utils/i18n/Context'

export default function DashboardPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { t, locale } = useTranslation()

  useEffect(() => {
    getEvents().then(data => {
      setEvents(data || [])
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const stats = events.reduce((acc, event) => ({
    totalEvents: acc.totalEvents + 1,
    totalGuests: acc.totalGuests + (parseInt(event.guest_count) || 0),
    totalViews: acc.totalViews + (parseInt(event.viewed_count) || 0),
    totalConfirmed: acc.totalConfirmed + (parseInt(event.confirmed_count) || 0),
  }), { totalEvents: 0, totalGuests: 0, totalViews: 0, totalConfirmed: 0 })

  const recentEvents = events.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.welcome')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus size={20} className="mr-2" />
            {t('dashboard.create_event')}
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground break-words">{t('dashboard.total_events')}</CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground break-words">{t('dashboard.total_guests')}</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground break-words">{t('dashboard.invitations_viewed')}</CardTitle>
            <Eye className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground break-words">{t('dashboard.confirmed_rsvps')}</CardTitle>
            <CheckCircle className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalConfirmed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recent_events')}</CardTitle>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/events">
                {t('dashboard.view_all')}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('dashboard.no_events')}</h3>
              <Button asChild>
                <Link href="/dashboard/events/new">
                  <Plus size={20} className="mr-2" />
                  {t('dashboard.create_event')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-card/50 transition-all sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-foreground break-words">{event.title}</h4>
                      <p className="text-sm text-muted-foreground break-words">
                        {event.event_date
                          ? new Date(event.event_date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                          : 'Date not set'
                        }
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-3 text-sm sm:w-auto sm:justify-end">
                    <div className="text-center">
                      <div className="font-medium text-foreground">{event.guest_count || 0}</div>
                      <div className="text-xs leading-tight text-muted-foreground whitespace-normal">{t('dashboard.guests')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{event.confirmed_count || 0}</div>
                      <div className="text-xs leading-tight text-muted-foreground whitespace-normal">{t('dashboard.confirmed_rsvps')}</div>
                    </div>
                    <span className={`inline-flex max-w-full items-center justify-center whitespace-normal break-words px-2.5 py-1 rounded-full text-xs font-medium leading-tight ${event.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                      {event.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
