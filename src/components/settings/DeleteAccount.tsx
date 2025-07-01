import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { Trash2, AlertTriangle, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export const DeleteAccount: React.FC = () => {
  const { user, deleteAccount } = useAuth()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm')
      return
    }

    setIsDeleting(true)
    
    try {
      const { error } = await deleteAccount()
      
      if (error) {
        console.error('Delete account error:', error)
        toast.error('Failed to delete account. Please try again or contact support.')
        setIsDeleting(false)
      }
      // If successful, user will be automatically redirected by the auth context
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('Failed to delete account. Please try again or contact support.')
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setShowConfirmation(false)
    setConfirmationText('')
  }

  if (!showConfirmation) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Delete Account</h3>
          </div>
          <p className="text-red-700 text-sm">
            Permanently delete your account and all associated data
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-red-800">
                  <p className="font-medium">This action cannot be undone!</p>
                  <p>Deleting your account will permanently remove:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your profile and account information</li>
                    <li>All your recipes and ingredients</li>
                    <li>Your meal plans and planning history</li>
                    <li>Your spaces and collaborations</li>
                    <li>Your preferences and settings</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowConfirmation(true)}
                variant="danger"
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>I understand, delete my account</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Confirm Account Deletion</h3>
        </div>
        <p className="text-red-700 text-sm">
          This is your final confirmation. This action cannot be undone.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">
                  You are about to permanently delete the account for: {user?.email}
                </p>
                <p className="mt-1">
                  All your data will be immediately and permanently removed from our servers.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
              Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE MY ACCOUNT</span> to confirm:
            </label>
            <Input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="font-mono"
              disabled={isDeleting}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleDeleteAccount}
              variant="danger"
              disabled={confirmationText !== 'DELETE MY ACCOUNT' || isDeleting}
              className="flex items-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account Forever</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={resetForm}
              variant="outline"
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
