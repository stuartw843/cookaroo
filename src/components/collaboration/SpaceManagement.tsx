import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useSpacesContext } from '../../contexts/SpacesContext'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Users, 
  Plus, 
  Link, 
  Copy, 
  Trash2, 
  UserMinus, 
  Crown, 
  Calendar,
  ExternalLink,
  X,
  Check
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface SpaceManagementProps {
  isOpen: boolean
  onClose: () => void
}

export const SpaceManagement: React.FC<SpaceManagementProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'settings'>('members')
  const [newSpaceName, setNewSpaceName] = useState('')
  const [invites, setInvites] = useState<any[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [joiningSpace, setJoiningSpace] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const { user } = useAuth()
  
  const { 
    spaces, 
    currentSpace, 
    createSpace, 
    updateSpace, 
    deleteSpace,
    createInvite,
    getInvites,
    deactivateInvite,
    joinSpaceByInvite,
    removeMember,
    leaveSpace
  } = useSpacesContext()

  useEffect(() => {
    if (isOpen && currentSpace && activeTab === 'invites') {
      fetchInvites()
    }
  }, [isOpen, currentSpace, activeTab])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  const fetchInvites = async () => {
    if (!currentSpace) return
    
    setLoadingInvites(true)
    try {
      const inviteData = await getInvites(currentSpace.id)
      setInvites(inviteData)
    } catch (error) {
      toast.error('Failed to load invites')
    } finally {
      setLoadingInvites(false)
    }
  }

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return

    try {
      const newSpace = await createSpace(newSpaceName.trim())
      setNewSpaceName('')
      toast.success('Space created successfully!')
      
      // Don't close modal immediately, let user see the new space
    } catch (error) {
      console.error('Create space error:', error)
      toast.error('Failed to create space')
    }
  }

  const handleCreateInvite = async () => {
    if (!currentSpace) return

    try {
      await createInvite(currentSpace.id)
      await fetchInvites()
      toast.success('Invite link created!')
    } catch (error) {
      toast.error('Failed to create invite')
    }
  }

  const handleCopyInvite = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`
    navigator.clipboard.writeText(inviteUrl)
    toast.success('Invite link copied to clipboard!')
  }

  const handleDeactivateInvite = async (inviteId: string) => {
    try {
      await deactivateInvite(inviteId)
      await fetchInvites()
      toast.success('Invite deactivated')
    } catch (error) {
      toast.error('Failed to deactivate invite')
    }
  }

  const handleJoinSpace = async () => {
    if (!inviteCode.trim()) return

    setJoiningSpace(true)
    try {
      await joinSpaceByInvite(inviteCode.trim())
      setInviteCode('')
      toast.success('Successfully joined space!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join space')
    } finally {
      setJoiningSpace(false)
    }
  }

  const handleRemoveMember = async (userId: string, userEmail: string) => {
    if (!currentSpace) return

    if (window.confirm(`Remove ${userEmail} from this space?`)) {
      try {
        await removeMember(currentSpace.id, userId)
        toast.success('Member removed')
      } catch (error) {
        toast.error('Failed to remove member')
      }
    }
  }

  const handleLeaveSpace = async () => {
    if (!currentSpace) return

    if (window.confirm(`Are you sure you want to leave "${currentSpace.name}"?`)) {
      try {
        await leaveSpace(currentSpace.id)
        toast.success('Left space successfully')
        onClose()
      } catch (error) {
        toast.error('Failed to leave space')
      }
    }
  }

  const handleDeleteSpace = async () => {
    if (!currentSpace) return
    
    try {
      await deleteSpace(currentSpace.id)
      toast.success('Space deleted successfully')
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      toast.error('Failed to delete space')
    }
  }

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const isOwner = currentSpace?.user_role === 'admin' && currentSpace?.owner_id
  const canManageMembers = currentSpace?.user_role === 'admin'

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9996]" 
      style={{ zIndex: 9996 }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-[9997]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manage Spaces</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'members'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Members
          </button>
          {canManageMembers && (
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'invites'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Invites
            </button>
          )}
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'settings'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {activeTab === 'members' && currentSpace && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Space Members ({currentSpace.member_count})
                </h3>
                
                <div className="space-y-3">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Crown className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {(() => {
                            const ownerMember = currentSpace.members.find(m => m.user_id === currentSpace.owner_id)
                            const ownerName = ownerMember?.user?.name || 'Space Owner'
                            return currentSpace.owner_id === user?.id ? `${ownerName} (You)` : ownerName
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {currentSpace.owner_id === user?.id ? 'You own this space' : 'Full access to all features'}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-orange-600">Admin</span>
                  </div>

                  {/* Members */}
                  {currentSpace.members.filter(member => member.user_id !== currentSpace.owner_id).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.user_id === user?.id 
                              ? `${member.user?.name || 'You'} (You)` 
                              : member.user?.name || `Member ${member.user_id.slice(0, 8)}`
                            }
                          </div>
                          <div className="text-sm text-gray-600">
                            Joined {formatDistanceToNow(new Date(member.joined_at))} ago
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {member.role}
                        </span>
                        {canManageMembers && member.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id, member.user?.name || member.user?.email || 'this member')}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invites' && canManageMembers && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invite Links</h3>
                  <Button onClick={handleCreateInvite}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invite
                  </Button>
                </div>

                {loadingInvites ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : invites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active invites. Create one to invite new members.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            Invite Code: {invite.invite_code}
                          </div>
                          <div className="text-sm text-gray-600">
                            Expires {formatDistanceToNow(new Date(invite.expires_at))} from now
                            {invite.max_uses && (
                              <span> • {invite.current_uses}/{invite.max_uses} uses</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyInvite(invite.invite_code)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateInvite(invite.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Join Space */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Join a Space</h3>
                  <p className="text-gray-600 text-sm">
                    Enter an invite code to join another recipe space
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleJoinSpace}
                      loading={joiningSpace}
                      disabled={!inviteCode.trim()}
                    >
                      Join Space
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Create New Space */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Create New Space</h3>
                  <p className="text-gray-600 text-sm">
                    Create a new recipe space that you can share with others
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Space name"
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleCreateSpace}
                      disabled={!newSpaceName.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Space Actions */}
              {currentSpace && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900">Current Space Actions</h3>
                    <p className="text-gray-600 text-sm">
                      Manage your current space: {currentSpace.name}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentSpace.user_role !== 'admin' && (
                        <Button
                          variant="outline"
                          onClick={handleLeaveSpace}
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Leave Space
                        </Button>
                      )}
                      
                      {currentSpace.user_role === 'admin' && currentSpace.owner_id === user?.id && (
                        <Button
                          variant="danger"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full justify-start"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Space
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]" style={{ zIndex: 9998 }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative z-[9999]">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Space</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete <strong>"{currentSpace?.name}"</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium mb-1">
                  This will permanently delete:
                </p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• All recipes in this space</li>
                  <li>• All meal plans in this space</li>
                  <li>• All member access to this space</li>
                  <li>• All invite links for this space</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteSpace}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Space
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}