import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useUserProfile } from '../../hooks/useUserProfile'
import { User, Mail, Edit3, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export const ProfileSettings: React.FC = () => {
  const { profile, loading, updateProfile } = useUserProfile()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email
      })
    }
  }, [profile])

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email
      })
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim()
      })
      setEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
        <p className="text-gray-600 text-sm">
          Manage your personal information and account details
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            {editing ? (
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{profile?.name || 'Not set'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            {editing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{profile?.email || 'Not set'}</span>
              </div>
            )}
          </div>

          {editing && (
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <Button onClick={handleSave} loading={saving}>
                <Check className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}

          {profile && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p>Account created: {new Date(profile.created_at).toLocaleDateString()}</p>
                <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}