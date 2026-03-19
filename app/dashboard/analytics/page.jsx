'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  Users, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp
} from 'lucide-react'
import { getEvents } from '@/app/actions/event'
import { useTranslation } from '@/utils/i18n/Context'

export default function AnalyticsPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { t, locale } = useTranslation()

  useEffect(() => {
    getEvents().then(data => { setEvents(data || []); setIsLoading(false) }).catch(() => setIsLoading(false))
  }, [])

  const stats = events.reduce((acc, event) => ({
    totalEvents: acc.totalEvents + 1,
    totalGuests: acc.totalGuests + (parseInt(event.guest_count) || 0),
    totalViews: acc.totalViews + (parseInt(event.viewed_count) || 0),
    totalConfirmed: acc.totalConfirmed + (parseInt(event.confirmed_count) || 0),
    totalDeclined: acc.totalDeclined + (parseInt(event.declined_count) || 0),
  }), { totalEvents: 0, totalGuests: 0, totalViews: 0, totalConfirmed: 0, totalDeclined: 0 })

  const pendingCount = stats.totalGuests - stats.totalConfirmed - stats.totalDeclined
  const responseRate = stats.totalGuests > 0 
    ? Math.round(((stats.totalConfirmed + stats.totalDeclined) / stats.totalGuests) * 100) 
    : 0
  const viewRate = stats.totalGuests > 0 
    ? Math.round((stats.totalViews / stats.totalGuests) * 100) 
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('portal.analytics.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('portal.analytics.subtitle')}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground wrap-break-word">{t('portal.analytics.total_events')}</CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground wrap-break-word">{t('portal.analytics.total_guests')}</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground wrap-break-word">{t('portal.analytics.view_rate')}</CardTitle>
            <Eye className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{viewRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.totalViews} {t('portal.analytics.views')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium leading-snug text-muted-foreground wrap-break-word">{t('portal.analytics.response_rate')}</CardTitle>
            <TrendingUp className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{responseRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* RSVP Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('portal.analytics.rsvp_breakdown_title')}</CardTitle>
          <CardDescription>{t('portal.analytics.rsvp_breakdown_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div className="min-w-0">
                <div className="text-2xl font-bold text-foreground">{stats.totalConfirmed}</div>
                <div className="text-sm leading-tight text-muted-foreground whitespace-normal wrap-break-word">{t('portal.analytics.confirmed')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-10 h-10 text-red-500" />
              <div className="min-w-0">
                <div className="text-2xl font-bold text-foreground">{stats.totalDeclined}</div>
                <div className="text-sm leading-tight text-muted-foreground whitespace-normal wrap-break-word">{t('portal.analytics.declined')}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-10 h-10 text-yellow-500" />
              <div className="min-w-0">
                <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
                <div className="text-sm leading-tight text-muted-foreground whitespace-normal wrap-break-word">{t('portal.analytics.pending')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t('portal.analytics.event_performance_title')}</CardTitle>
          <CardDescription>{t('portal.analytics.event_performance_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('portal.analytics.no_events')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const guestCount = parseInt(event.guest_count) || 0
                const confirmed = parseInt(event.confirmed_count) || 0
                const viewed = parseInt(event.viewed_count) || 0
                const confirmRate = guestCount > 0 ? Math.round((confirmed / guestCount) * 100) : 0
                
                return (
                  <div 
                    key={event.id}
                    className="flex flex-col gap-4 p-4 rounded-lg border border-border sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground wrap-break-word">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {event.eventDate 
                            ? new Date(event.eventDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : t('portal.analytics.no_date')
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 text-sm sm:w-auto sm:justify-end">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users size={14} />
                          <span>{guestCount}</span>
                        </div>
                        <div className="text-xs leading-tight text-muted-foreground whitespace-normal">{t('portal.analytics.guests')}</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye size={14} />
                          <span>{viewed}</span>
                        </div>
                        <div className="text-xs leading-tight text-muted-foreground whitespace-normal">{t('portal.analytics.views')}</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-green-500">
                          <CheckCircle size={14} />
                          <span>{confirmed}</span>
                        </div>
                        <div className="text-xs leading-tight text-muted-foreground whitespace-normal wrap-break-word">{t('portal.analytics.confirmed')}</div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <div className="font-medium text-foreground">{confirmRate}%</div>
                        <div className="text-xs text-muted-foreground">{t('portal.analytics.rate')}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
