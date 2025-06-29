import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { useSpacesContext } from '../../contexts/SpacesContext'
import { ChevronDown, Users, Plus, Settings } from 'lucide-react'

interface SpaceSelectorProps {
  onManageSpace: () => void
}

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({ onManageSpace }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { spaces, currentSpace, setCurrentSpace } = useSpacesContext()

  // Show a "Create Space" button if no current space
  if (!currentSpace) {
    return (
      <Button
        variant="outline"
        onClick={onManageSpace}
        className="w-full flex items-center justify-center space-x-2 min-h-[36px]"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Create Space</span>
      </Button>
    )
  }

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between space-x-2 min-h-[36px] px-3"
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="truncate text-sm font-medium">{currentSpace.name}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">({currentSpace.member_count})</span>
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full left-0 mt-1 w-full min-w-[280px] z-20 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => {
                      setCurrentSpace(space)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      space.id === currentSpace.id
                        ? 'bg-orange-50 text-orange-900 border border-orange-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{space.name}</div>
                        <div className="text-sm text-gray-500">
                          {space.member_count} member{space.member_count !== 1 ? 's' : ''} • {space.user_role}
                        </div>
                      </div>
                      {space.id === currentSpace.id && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-200 mt-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onManageSpace()
                    setIsOpen(false)
                  }}
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Spaces
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}