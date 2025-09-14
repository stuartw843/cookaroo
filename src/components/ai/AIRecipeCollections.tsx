import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAIRecipeCollections } from '../../hooks/useAIRecipeCollections'
import { Brain, Plus, Edit3, Trash2, X, Check, Sparkles, Notebook as Robot, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

interface AIRecipeCollectionsProps {
  onSelectCollection?: (collectionId: string) => void
  selectedCollectionId?: string | null
  mode?: 'selection' | 'management'
}

export const AIRecipeCollections: React.FC<AIRecipeCollectionsProps> = ({
  onSelectCollection,
  selectedCollectionId,
  mode = 'management'
}) => {
  const { collections, loading, createCollection, updateCollection, deleteCollection } = useAIRecipeCollections()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    systemPrompt: ''
  })

  const handleCreateCollection = async () => {
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await createCollection(formData.name.trim(), formData.systemPrompt.trim())
      setFormData({ name: '', systemPrompt: '' })
      setShowCreateForm(false)
      toast.success('AI collection created!')
    } catch (error) {
      toast.error('Failed to create collection')
    }
  }

  const handleUpdateCollection = async (collectionId: string) => {
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      await updateCollection(collectionId, {
        name: formData.name.trim(),
        system_prompt: formData.systemPrompt.trim()
      })
      setFormData({ name: '', systemPrompt: '' })
      setEditingCollection(null)
      toast.success('Collection updated!')
    } catch (error) {
      toast.error('Failed to update collection')
    }
  }

  const handleDeleteCollection = async (collectionId: string, collectionName: string) => {
    if (window.confirm(`Are you sure you want to delete "${collectionName}"? This will not delete the recipes, but they will no longer be associated with this collection.`)) {
      try {
        await deleteCollection(collectionId)
        toast.success('Collection deleted!')
      } catch (error) {
        toast.error('Failed to delete collection')
      }
    }
  }

  const startEdit = (collection: any) => {
    setFormData({
      name: collection.name,
      systemPrompt: collection.system_prompt
    })
    setEditingCollection(collection.id)
  }

  const cancelEdit = () => {
    setFormData({ name: '', systemPrompt: '' })
    setEditingCollection(null)
    setShowCreateForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600">Loading AI collections...</p>
        </div>
      </div>
    )
  }

  // Selection mode for choosing a collection during recipe generation
  if (mode === 'selection') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Choose AI Collection</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Collection
          </Button>
        </div>

        {collections.length === 0 && !showCreateForm ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No AI Collections Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first AI collection to start generating themed recipes.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map(collection => (
              <Card
                key={collection.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedCollectionId === collection.id 
                    ? 'ring-2 ring-orange-500 border-orange-300 bg-orange-50' 
                    : 'hover:border-orange-300'
                }`}
                onClick={() => onSelectCollection?.(collection.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{collection.name}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {collection.system_prompt}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Collection Form */}
        {showCreateForm && (
          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Create New AI Collection</h4>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Collection Name"
                  placeholder="e.g., Taiwanese UK-Friendly Recipes"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., You are a chef specializing in Taiwanese cuisine. Create recipes that use ingredients easily available in UK supermarkets, or provide UK substitutes for traditional ingredients. Focus on authentic flavors while being practical for home cooks."
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollection}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Collection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Management mode for full collection management
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Brain className="w-7 h-7 text-orange-600" />
            <span>AI Recipe Collections</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Create themed AI collections to generate recipes with specific styles and constraints
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 && !showCreateForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Create Your First AI Collection
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              AI collections let you generate themed recipes with specific constraints. 
              For example, "Taiwanese recipes using UK ingredients" or "Quick weeknight dinners under 30 minutes".
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create AI Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {collections.map(collection => (
            <Card key={collection.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingCollection === collection.id ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="font-semibold"
                        />
                      ) : (
                        <h3 className="font-semibold text-gray-900 truncate">{collection.name}</h3>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Created {new Date(collection.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {editingCollection === collection.id ? (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateCollection(collection.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(collection)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCollection(collection.id, collection.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingCollection === collection.id ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      System Prompt
                    </label>
                    <textarea
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    />
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {collection.system_prompt}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Collection Form */}
      {showCreateForm && (
        <Card className="border-orange-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Create New AI Collection</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Robot className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">AI Collection Tips:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Be specific about cuisine style, dietary restrictions, or cooking methods</li>
                      <li>• Include ingredient constraints (e.g., "available in UK supermarkets")</li>
                      <li>• Mention skill level or time constraints if relevant</li>
                      <li>• The AI will avoid duplicating existing recipes in the collection</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Input
                label="Collection Name"
                placeholder="e.g., Taiwanese UK-Friendly Recipes"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                helperText="Give your collection a descriptive name"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="You are a chef specializing in Taiwanese cuisine. Create recipes that use ingredients easily available in UK supermarkets, or provide UK substitutes for traditional ingredients. Focus on authentic flavors while being practical for home cooks in the UK. Include prep and cooking times, and aim for recipes that serve 4 people."
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This prompt defines the theme and constraints for all AI-generated recipes in this collection
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCollection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}