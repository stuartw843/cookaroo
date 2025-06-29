import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { useSpacesContext } from '../../contexts/SpacesContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Users, CheckCircle, XCircle, ChefHat, Calendar, BookOpen, Clock, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface SpaceInviteInfo {
  id: string
  space_id: string
  invite_code: string
  expires_at: string
  max_uses: number | null
  current_uses: number
  is_active: boolean
  spaces: {
    id: string
    name: string
    owner_id: string
    created_at: string
  }
}

export const JoinSpace: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { joinSpaceByInvite, refetch: refetchSpaces } = useSpacesContext()
  
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<SpaceInviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch invite information (works for both authenticated and unauthenticated users)
  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (!inviteCode) {
        setError('Invalid invite link')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Fetch invite info - this should work without authentication for public invite validation
        const { data: inviteData, error: inviteError } = await supabase
          .from('space_invites')
          .select(`
            *,
            spaces(*)
          `)
          .eq('invite_code', inviteCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (inviteError || !inviteData) {
          setError('This invite link is invalid or has expired')
          setLoading(false)
          return
        }

        // Check usage limits
        if (inviteData.max_uses && inviteData.current_uses >= inviteData.max_uses) {
          setError('This invite link has reached its usage limit')
          setLoading(false)
          return
        }

        setInviteInfo(inviteData)
        setError(null)
      } catch (err) {
        console.error('Error fetching invite info:', err)
        setError('Failed to load invite information')
      } finally {
        setLoading(false)
      }
    }

    fetchInviteInfo()
  }, [inviteCode])

  // Check if user is already a member when they authenticate
  useEffect(() => {
    const checkMembership = async () => {
      if (!user || !inviteInfo || !inviteInfo.spaces) return

      try {
        // Ensure inviteInfo.spaces exists before accessing its properties
        if (!inviteInfo.spaces || !inviteInfo.space_id) {
          console.warn('Invalid invite info structure', inviteInfo)
          return
        }
        
        // Check if user is already a member of this space
        const { data: membership } = await supabase
          .from('space_members')
          .select('id')
          .eq('space_id', inviteInfo.space_id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (membership) {
          // User is already a member, redirect to app
          toast.success('You are already a member of this space!')
          navigate('/app')
          return
        }

        // Check if user is the owner
        if (inviteInfo.spaces && inviteInfo.spaces.owner_id === user.id) {
          toast.success('You are the owner of this space!')
          navigate('/app')
          return
        }
      } catch (err) {
        // User is not a member, which is expected for new invites
        console.log('User is not a member yet, which is expected')
      }
    }

    checkMembership()
  }, [user, inviteInfo, navigate])

  const handleJoinSpace = async () => {
    if (!inviteCode || !user || !inviteInfo) return

    setJoining(true)
    try {
      await joinSpaceByInvite(inviteCode)
      setJoined(true)
      toast.success(`Successfully joined "${inviteInfo.spaces?.name || 'the space'}"!`)
      
      // Refetch spaces to update the UI
      await refetchSpaces()
      
      // Redirect to main app after a short delay
      setTimeout(() => {
        navigate('/app')
      }, 2000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join space')
    } finally {
      setJoining(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 text-sm">Loading invite information...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid Invite</h1>
            <p className="text-gray-600 mt-2">{error}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link to="/app">
                <Button className="w-full">
                  Go to Cookaroo
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state (after joining)
  if (joined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to the Space!</h1>
            <p className="text-gray-600 mt-2">
              You have successfully joined "{inviteInfo?.space?.name || 'the space'}". Taking you to your recipes...
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated - show space preview and sign in prompt
  if (!user && inviteInfo?.spaces) {
    const expiresAt = new Date(inviteInfo.expires_at)
    const timeUntilExpiry = expiresAt.getTime() - Date.now()
    const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60))
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-xl font-bold text-gray-900">Cookaroo</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex items-center justify-center p-4 py-20">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                You're Invited!
              </h1>
              <p className="text-gray-600">
                Join a recipe space and start cooking together
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Space Info */}
              <div className="bg-gradient-to-br from-orange-50 to-teal-50 rounded-xl p-6 border border-orange-100">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{inviteInfo.spaces?.name || 'Recipe Space'}</h2>
                    <p className="text-gray-600 text-sm mt-1">Recipe Space</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-orange-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-600">Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {inviteInfo.spaces.created_at ? new Date(inviteInfo.spaces.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-600">Expires</p>
                      <p className="text-sm font-medium text-gray-900">
                        {hoursUntilExpiry > 24 ? `${Math.floor(hoursUntilExpiry / 24)} days` : `${hoursUntilExpiry}h`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-center">What you'll get access to:</h3>
                <div className="space-y-2">
                  {[
                    'Shared recipe collection',
                    'Collaborative meal planning',
                    'Family cookbook building',
                    'Recipe import and organization'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-gray-700 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <Link to="/auth" state={{ from: `/join/${inviteCode}` }}>
                  <Button className="w-full" size="lg">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Sign Up to Join Space
                  </Button>
                </Link>
                <Link to="/auth" state={{ from: `/join/${inviteCode}` }}>
                  <Button variant="outline" className="w-full">
                    Already have an account? Sign In
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Free to join • No credit card required
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Authenticated user - show join confirmation
  if (user && inviteInfo?.spaces) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Join Recipe Space
            </h1>
            <p className="text-gray-600 mt-2">
              You're about to join "{inviteInfo.spaces.name || 'this space'}"
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-gray-900">{inviteInfo.spaces.name || 'Recipe Space'}</h3>
                <p className="text-sm text-gray-600">
                  Created {inviteInfo.spaces.created_at ? new Date(inviteInfo.spaces.created_at).toLocaleDateString() : 'Unknown'}
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 pt-2">
                  <span>Invite Code: {inviteInfo.invite_code}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleJoinSpace}
                loading={joining}
                className="w-full"
                size="lg"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Join Space
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/app')}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fallback - should not reach here but provide a safe default
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}