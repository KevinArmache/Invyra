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
  TrendingUp,
  Mail
} from 'lucide-react'
import { getEvents } from '@/app/actions/event'

export default function AnalyticsPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your invitation performance across all events</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Guests</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">View Rate</CardTitle>
            <Eye className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{viewRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.totalViews} views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Response Rate</CardTitle>
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
          <CardTitle>RSVP Breakdown</CardTitle>
          <CardDescription>Summary of all guest responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalConfirmed}</div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <XCircle className="w-10 h-10 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalDeclined}</div>
                <div className="text-sm text-muted-foreground">Declined</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-10 h-10 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Event Performance</CardTitle>
          <CardDescription>Individual event statistics</CardDescription>
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
              <p className="text-muted-foreground">No events yet. Create an event to see analytics.</p>
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
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {event.eventDate 
                            ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : 'No date set'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users size={14} />
                          <span>{guestCount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Guests</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye size={14} />
                          <span>{viewed}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-green-500">
                          <CheckCircle size={14} />
                          <span>{confirmed}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Confirmed</div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <div className="font-medium text-foreground">{confirmRate}%</div>
                        <div className="text-xs text-muted-foreground">Rate</div>
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
