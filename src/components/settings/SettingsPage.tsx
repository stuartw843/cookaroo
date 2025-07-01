import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { ProfileSettings } from './ProfileSettings'
import { DeleteAccount } from './DeleteAccount'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { Settings, Ruler } from 'lucide-react'
import toast from 'react-hot-toast'

export const SettingsPage: React.FC = () => {
  const { preferences, loading, updatePreferences } = useUserPreferences()
  const [saving, setSaving] = useState(false)

  const handleMeasurementSystemChange = async (system: 'metric' | 'imperial' | 'us') => {
    if (!preferences) return

    setSaving(true)
    try {
      await updatePreferences({ measurement_system: system })
      toast.success('Measurement system updated!')
    } catch (error) {
      toast.error('Failed to update measurement system')
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Settings className="w-8 h-8" />
            <span>Settings</span>
          </h1>
          <p className="text-gray-600 mt-1">Customize your recipe experience</p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <Settings className="w-8 h-8" />
          <span>Settings</span>
        </h1>
        <p className="text-gray-600 mt-1">Customize your recipe experience</p>
      </div>

      {/* Profile Settings */}
      <ProfileSettings />

      {/* Measurement System */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Ruler className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Measurement System</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Choose your preferred unit system for displaying recipe measurements
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleMeasurementSystemChange('metric')}
                disabled={saving}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences?.measurement_system === 'metric'
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <h4 className="font-medium">Metric</h4>
                  <p className="text-sm opacity-75 mt-1">
                    grams, liters, celsius
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleMeasurementSystemChange('imperial')}
                disabled={saving}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences?.measurement_system === 'imperial'
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <h4 className="font-medium">Imperial (UK)</h4>
                  <p className="text-sm opacity-75 mt-1">
                    ounces, pints, pounds
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleMeasurementSystemChange('us')}
                disabled={saving}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences?.measurement_system === 'us'
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-center">
                  <h4 className="font-medium">US Customary</h4>
                  <p className="text-sm opacity-75 mt-1">
                    cups, tablespoons, ounces
                  </p>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">About</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Cookaroo</strong> helps you organize and manage your favorite recipes.
            </p>
            <p>
              Your measurement preferences will be applied to all recipe displays and conversions throughout the app.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <DeleteAccount />
    </div>
  )
}
