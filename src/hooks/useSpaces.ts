import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

type Space = Database['public']['Tables']['spaces']['Row']
type SpaceMember = Database['public']['Tables']['space_members']['Row'] & {
  user?: {
    id: string
    email: string
    name: string
  }
}
type SpaceInvite = Database['public']['Tables']['space_invites']['Row']

type SpaceWithMembers = Space & {
  members: SpaceMember[]
  member_count: number
  user_role: string
}

export const useSpacesData = () => {
  const [spaces, setSpaces] = useState<SpaceWithMembers[]>([])
  const [currentSpace, setCurrentSpace] = useState<SpaceWithMembers | null>(null)
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchSpaces = async () => {
    if (!user) {
      setSpaces([])
      setCurrentSpace(null)
      setCurrentSpaceId(null)
      setLoading(false)
      setInitialLoad(false)
      return
    }

    try {
      setLoading(true)
      
      // Get spaces where user is owner
      const { data: ownedSpaces, error: ownedError } = await supabase
        .from('spaces')
        .select('*')
        .eq('owner_id', user.id)

      if (ownedError) throw ownedError

      // Get spaces where user is a member
      const { data: memberSpaces, error: memberError } = await supabase
        .from('space_members')
        .select(`
          space_id,
          role,
          joined_at,
          spaces(*)
        `)
        .eq('user_id', user.id)

      if (memberError) throw memberError

      // Combine owned and member spaces, removing duplicates
      const allSpaces = [
        ...(ownedSpaces || []),
        ...(memberSpaces?.map(m => m.spaces).filter(space => space !== null) || [])
      ]
      
      // Remove duplicates by space id
      const uniqueSpaces = allSpaces.filter((space, index, self) => 
        index === self.findIndex(s => s.id === space.id)
      )

      if (uniqueSpaces.length > 0) {
        const spacesWithDetails = await Promise.all(
          uniqueSpaces.map(async (space) => {
            if (!space) return null
            
            // Get all members for this space
            const { data: membersData, error: membersError } = await supabase
              .from('space_members')
              .select(`
                *,
                user:users(id, email, name)
              `)
              .eq('space_id', space.id)

            if (membersError) throw membersError

            // Get owner information
            const { data: ownerData } = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', space.owner_id)
              .single()

            // Determine user's role in this space
            const userRole = space.owner_id === user.id 
              ? 'admin' 
              : membersData?.find(m => m.user_id === user.id)?.role || 'member'

            // Add owner to the members list for display purposes
            const allMembers = [
              ...(membersData || []),
              // Add owner as a virtual member for display
              ...(ownerData ? [{
                id: 'owner',
                space_id: space.id,
                user_id: space.owner_id,
                role: 'admin' as const,
                joined_at: space.created_at,
                user: ownerData
              }] : [])
            ]

            return {
              ...space,
              members: allMembers,
              member_count: allMembers.length,
              user_role: userRole
            }
          })
        )

        // Filter out any null spaces that might have been created
        const validSpaces = spacesWithDetails.filter(space => space !== null)
        setSpaces(validSpaces)
        
        // Set current space based on stored ID or first available space
        if (validSpaces.length > 0) {
          let spaceToSet = null
          
          // Try to find the previously selected space (only if it still exists)
          if (currentSpaceId && validSpaces.some(space => space.id === currentSpaceId)) {
            spaceToSet = validSpaces.find(space => space.id === currentSpaceId)
          }
          
          // If no previously selected space or it doesn't exist, use first space
          if (!spaceToSet) {
            spaceToSet = validSpaces[0]
            setCurrentSpaceId(spaceToSet.id)
          }
          
          // Update currentSpace with fresh data
          setCurrentSpace(spaceToSet)
        } else {
          // No spaces available - user needs to create one
          setCurrentSpace(null)
          setCurrentSpaceId(null)
        }
      } else {
        // No spaces available - user needs to create one
        setSpaces([])
        setCurrentSpace(null)
        setCurrentSpaceId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Fetch spaces error:', err)
      // Set safe defaults on error
      setSpaces([])
      setCurrentSpace(null)
      setCurrentSpaceId(null)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const createSpace = async (name: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert({
          name,
          owner_id: user.id
        })
        .select()
        .single()

      if (spaceError) throw spaceError

      // Note: Owner is NOT added to space_members table
      // They have admin access through ownership

      await fetchSpaces()
      
      // Set the new space as current space
      // Set the new space as current space immediately
      const newSpaceWithDetails = {
        ...space,
        members: [],
        member_count: 1, // Just the owner
        user_role: 'admin'
      }
      setCurrentSpace(newSpaceWithDetails)
      setCurrentSpaceId(newSpaceWithDetails.id)
      
      return space
    } catch (err) {
      throw err
    }
  }

  const updateSpace = async (spaceId: string, updates: { name?: string }) => {
    try {
      const { error } = await supabase
        .from('spaces')
        .update(updates)
        .eq('id', spaceId)

      if (error) throw error
      await fetchSpaces()
    } catch (err) {
      throw err
    }
  }

  const deleteSpace = async (spaceId: string) => {
    try {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', spaceId)

      if (error) throw error
      
      await fetchSpaces()
      
      // After deletion, currentSpace will be updated by fetchSpaces if other spaces exist
    } catch (err) {
      throw err
    }
  }

  const createInvite = async (spaceId: string, maxUses?: number) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data: invite, error } = await supabase
        .from('space_invites')
        .insert({
          space_id: spaceId,
          created_by: user.id,
          max_uses: maxUses || null,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
        })
        .select()
        .single()

      if (error) throw error
      return invite
    } catch (err) {
      throw err
    }
  }

  const getInvites = async (spaceId: string) => {
    try {
      const { data: invites, error } = await supabase
        .from('space_invites')
        .select('*')
        .eq('space_id', spaceId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return invites || []
    } catch (err) {
      throw err
    }
  }

  const deactivateInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('space_invites')
        .update({ is_active: false })
        .eq('id', inviteId)

      if (error) throw error
    } catch (err) {
      throw err
    }
  }

  const joinSpaceByInvite = async (inviteCode: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('Attempting to join space with invite code:', inviteCode)
      
      // Get invite details
      const { data: invite, error: inviteError } = await supabase
        .from('space_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (inviteError || !invite) {
        console.error('Invite error:', inviteError)
        throw new Error('Invalid or expired invite code')
      }

      console.log('Found invite:', invite)

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('space_members')
        .select('id')
        .eq('space_id', invite.space_id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        console.log('User is already a member')
        throw new Error('You are already a member of this space')
      }

      // Check if user is the owner
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('owner_id')
        .eq('id', invite.space_id)
        .single()

      if (spaceData?.owner_id === user.id) {
        console.log('User is the owner of this space')
        throw new Error('You are the owner of this space')
      }

      // Check usage limits
      if (invite.max_uses && invite.current_uses >= invite.max_uses) {
        console.log('Invite usage limit reached')
        throw new Error('This invite has reached its usage limit')
      }

      console.log('Adding user as member...')

      // Add user as member
      const { error: memberError } = await supabase
        .from('space_members')
        .insert({
          space_id: invite.space_id,
          user_id: user.id,
          role: 'member'
        })

      if (memberError) throw memberError

      console.log('User added as member successfully')

      // Update invite usage count
      const { error: updateError } = await supabase
        .from('space_invites')
        .update({ current_uses: invite.current_uses + 1 })
        .eq('id', invite.id)

      if (updateError) throw updateError

      console.log('Invite usage count updated')

      await fetchSpaces()
      
      return invite.space_id
    } catch (err) {
      console.error('Join space error:', err)
      throw err
    }
  }

  const removeMember = async (spaceId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', userId)

      if (error) throw error
      await fetchSpaces()
    } catch (err) {
      throw err
    }
  }

  const updateMemberRole = async (spaceId: string, userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('space_members')
        .update({ role })
        .eq('space_id', spaceId)
        .eq('user_id', userId)

      if (error) throw error
      await fetchSpaces()
    } catch (err) {
      throw err
    }
  }

  const leaveSpace = async (spaceId: string) => {
    if (!user) throw new Error('User not authenticated')

    try {      
      const { error } = await supabase
        .from('space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', user.id)

      if (error) throw error
      
      await fetchSpaces()
      
      // After leaving, currentSpace will be updated by fetchSpaces if other spaces exist
    } catch (err) {
      throw err
    }
  }

  // Custom setCurrentSpace that also updates the stored ID
  const setCurrentSpaceWithId = (space: SpaceWithMembers | null) => {
    setCurrentSpace(space)
    setCurrentSpaceId(space?.id || null)
  }

  useEffect(() => {
    fetchSpaces()
  }, [user])

  return {
    spaces,
    currentSpace,
    setCurrentSpace: setCurrentSpaceWithId,
    loading,
    initialLoad,
    error,
    createSpace,
    updateSpace,
    deleteSpace,
    createInvite,
    getInvites,
    deactivateInvite,
    joinSpaceByInvite,
    removeMember,
    updateMemberRole,
    leaveSpace,
    refetch: fetchSpaces
  }
}