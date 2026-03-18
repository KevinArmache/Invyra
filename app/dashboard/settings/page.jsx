'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { updateProfile, changePassword } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Mail, Building, Key } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    company: user?.company || ''
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  async function handleProfileUpdate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateProfile(profile.name, profile.company)
      setSuccess('Profil mis à jour avec succès')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    
    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match')
      return
    }

    if (passwords.new.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await changePassword(passwords.current, passwords.new)
      setSuccess('Mot de passe modifié avec succès')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="p-4 text-sm text-green-400 bg-green-500/10 rounded-lg border border-green-500/20">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name
              </label>
              <Input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                Company
              </label>
              <Input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile(p => ({ ...p, company: e.target.value }))}
                placeholder="Your company"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Current Password
              </label>
              <Input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                New Password
              </label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Confirm new password"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Account deletion is currently disabled. Contact support if you need to delete your account.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
