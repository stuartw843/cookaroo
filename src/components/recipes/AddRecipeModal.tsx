import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, Plus, Link, Type, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { parseRecipeFromText, parseIngredientLine, scrapeRecipeFromUrl } from '../../utils/recipeParser'
import toast from 'react-hot-toast'

interface RecipeFormData {
  title: string
  description: string
  notes: string
  image_url: string
  source_url: string
  prep_time: number
  cook_time: number
  servings: number
  tags: string
  ingredients: { name: string; amount: string; unit: string }[]
  instructions: { instruction: string }[]
}

interface AddRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (recipe: any) => Promise<any>
  recipe?: any // For editing
  onUpdate?: (recipeId: string, recipe: any) => Promise<void>
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  recipe,
  onUpdate
}) => {
  const [mode, setMode] = useState<'url' | 'manual'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  
  const isEditing = Boolean(recipe)
  
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<RecipeFormData>({
    defaultValues: {
      servings: 4,
      ingredients: [{ name: '', amount: '', unit: '' }],
      instructions: [{ instruction: '' }]
    }
  })
  
  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control,
    name: 'ingredients'
  })
  
  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction } = useFieldArray({
    control,
    name: 'instructions'
  })

  // Reset form when modal opens/closes or recipe changes
  useEffect(() => {
    if (isOpen) {
      if (isEditing && recipe) {
        // Populate form with existing recipe data
        setValue('title', recipe.title)
        setValue('description', recipe.description || '')
        setValue('notes', recipe.notes || '')
        setValue('image_url', recipe.image_url || '')
        setValue('source_url', recipe.source_url || '')
        setValue('prep_time', recipe.prep_time || 0)
        setValue('cook_time', recipe.cook_time || 0)
        setValue('servings', recipe.servings)
        setTags(recipe.tags || [])
        setImagePreview(recipe.image_url || '')
        
        // Clear and populate ingredients
        for (let i = ingredientFields.length - 1; i >= 0; i--) {
          removeIngredient(i)
        }
        
        const ingredientsToAdd = recipe.ingredients && recipe.ingredients.length > 0 
          ? recipe.ingredients 
          : [{ name: '', amount: '', unit: '' }]
        
        ingredientsToAdd.forEach((ingredient: any) => {
          appendIngredient({
            name: ingredient.name || '',
            amount: ingredient.amount?.toString() || '',
            unit: ingredient.unit || ''
          })
        })
        
        // Clear and populate instructions
        for (let i = instructionFields.length - 1; i >= 0; i--) {
          removeInstruction(i)
        }
        
        const instructionsToAdd = recipe.instructions && recipe.instructions.length > 0 
          ? recipe.instructions 
          : [{ instruction: '' }]
        
        instructionsToAdd.forEach((instruction: any) => {
          appendInstruction({ instruction: instruction.instruction || '' })
        })
      } else {
        // Reset form for new recipe
        reset()
        setTags([])
        setTagInput('')
        setUrlInput('')
        setTextInput('')
        setImageFile(null)
        setImagePreview('')
      }
    }
  }, [isOpen, isEditing, recipe, reset, setValue])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

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

  const populateFormWithRecipe = (recipeData: any) => {
    setValue('title', recipeData.title || '')
    setValue('description', recipeData.description || '')
    setValue('image_url', recipeData.image_url || '')
    setValue('source_url', recipeData.source_url || '')
    setValue('prep_time', recipeData.prep_time || 0)
    setValue('cook_time', recipeData.cook_time || 0)
    setValue('servings', recipeData.servings || 4)
    setTags(recipeData.tags || [])
    
    if (recipeData.image_url) {
      setImagePreview(recipeData.image_url)
    }
    
    // Clear and populate ingredients
    for (let i = ingredientFields.length - 1; i >= 0; i--) {
      removeIngredient(i)
    }
    
    const ingredientsToAdd = recipeData.ingredients && recipeData.ingredients.length > 0 
      ? recipeData.ingredients 
      : [{ name: '', amount: '', unit: '' }]
    
    ingredientsToAdd.forEach((ingredient: any) => {
      appendIngredient({
        name: ingredient.name || '',
        amount: ingredient.amount?.toString() || '',
        unit: ingredient.unit || ''
      })
    })
    
    // Clear and populate instructions
    for (let i = instructionFields.length - 1; i >= 0; i--) {
      removeInstruction(i)
    }
    
    const instructionsToAdd = recipeData.instructions && recipeData.instructions.length > 0 
      ? recipeData.instructions 
      : [{ instruction: '' }]
    
    instructionsToAdd.forEach((instruction: any) => {
      appendInstruction({ instruction: instruction.instruction || '' })
    })
  }

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return
    
    setLoading(true)
    try {
      const extractedRecipe = await scrapeRecipeFromUrl(urlInput.trim())
      populateFormWithRecipe(extractedRecipe)
      setMode('manual')
      toast.success('Recipe imported successfully! Review and edit as needed.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import recipe')
    } finally {
      setLoading(false)
    }
  }

  const handleTextImport = () => {
    if (!textInput.trim()) return
    
    try {
      const parsedRecipe = parseRecipeFromText(textInput)
      populateFormWithRecipe(parsedRecipe)
      setMode('manual')
      toast.success('Recipe parsed successfully! Review and edit as needed.')
    } catch (error) {
      toast.error('Failed to parse recipe text')
    }
  }

  const handleImageUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setValue('image_url', '')
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setValue('image_url', '')
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const onSubmit = async (data: RecipeFormData) => {
    setLoading(true)
    
    try {
      let finalImageUrl = data.image_url
      
      // Handle image upload if there's a file
      if (imageFile) {
        try {
          const reader = new FileReader()
          finalImageUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to read image file'))
            reader.readAsDataURL(imageFile)
          })
        } catch (error) {
          console.error('Image processing error:', error)
          toast.error('Failed to process image')
          setLoading(false)
          return
        }
      }
      
      const recipeData = {
        title: data.title,
        description: data.description || undefined,
        notes: data.notes || undefined,
        image_url: finalImageUrl || undefined,
        source_url: data.source_url || undefined,
        prep_time: data.prep_time || undefined,
        cook_time: data.cook_time || undefined,
        servings: data.servings,
        tags: tags,
        ingredients: data.ingredients
          .filter(ing => ing.name.trim())
          .map(ing => ({
            name: ing.name.trim(),
            amount: ing.amount && ing.amount.trim() ? parseFloat(ing.amount) : undefined,
            unit: ing.unit.trim() || undefined
          })),
        instructions: data.instructions
          .filter(inst => inst.instruction.trim())
          .map(inst => ({ instruction: inst.instruction.trim() }))
      }
      
      if (isEditing && onUpdate) {
        await onUpdate(recipe.id, recipeData)
        toast.success('Recipe updated successfully!')
      } else {
        await onAdd(recipeData)
        toast.success('Recipe added successfully!')
      }
      
      onClose()
    } catch (error) {
      toast.error(isEditing ? 'Failed to update recipe' : 'Failed to save recipe')
    } finally {
      setLoading(false)
    }
  }

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
          {!isEditing && mode === 'url' && (
            <div className="space-y-6 mb-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import from URL</h3>
                <p className="text-gray-600">Paste a recipe URL to automatically import it</p>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Recipe URL"
                  placeholder="https://www.allrecipes.com/recipe/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={loading}
                />
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setMode('manual')}
                    disabled={loading}
                  >
                    Enter Manually
                  </Button>
                  <Button 
                    onClick={handleUrlImport} 
                    loading={loading}
                    disabled={!urlInput.trim() || loading}
                  >
                    Import Recipe
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {!isEditing && mode === 'text' && (
            <div className="space-y-6 mb-8">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import from Text</h3>
                <p className="text-gray-600">Paste recipe text to parse it automatically</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Text
                  </label>
                  <textarea
                    className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Paste your recipe text here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setMode('manual')}
                  >
                    Enter Manually
                  </Button>
                  <Button 
                    onClick={handleTextImport}
                    disabled={!textInput.trim()}
                  >
                    Parse Recipe
                  </Button>
                </div>
              </div>
            </div>
          )}

          {(mode === 'manual' || isEditing) && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Recipe Title"
                  {...register('title', { required: 'Title is required' })}
                  error={errors.title?.message}
                />
                
                {/* Image Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Recipe Image
                  </label>
                  
                  {(imagePreview || watch('image_url')) ? (
                    <div className="relative">
                      <img
                        src={imagePreview || watch('image_url')}
                        alt="Recipe preview"
                        className="w-full h-40 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file)
                              }
                            }}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto pointer-events-none">
                              <Upload className="w-4 h-4 mr-1" />
                              Upload
                            </Button>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Or enter URL below
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...register('image_url')}
                    onChange={(e) => {
                      const value = e.target.value
                      setValue('image_url', value)
                      if (value && value.trim()) {
                        setImagePreview(value)
                        setImageFile(null)
                      } else if (!value.trim() && !imageFile) {
                        setImagePreview('')
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  {...register('description')}
                  placeholder="Brief description of the recipe..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Notes
                </label>
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  {...register('notes')}
                  placeholder="Personal cooking notes, modifications, tips, or family preferences..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add your own cooking tips, modifications, or notes about this recipe
                </p>
              </div>
                
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="Prep Time (min)"
                  type="number"
                  {...register('prep_time', { valueAsNumber: true })}
                />
                <Input
                  label="Cook Time (min)"
                  type="number"
                  {...register('cook_time', { valueAsNumber: true })}
                />
                <Input
                  label="Servings"
                  type="number"
                  {...register('servings', { 
                    required: 'Servings is required',
                    valueAsNumber: true,
                    min: 1
                  })}
                  error={errors.servings?.message}
                />
                <Input
                  label="Source URL"
                  {...register('source_url')}
                  placeholder="https://example.com"
                />
              </div>
              
              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                
                {/* Current Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Add Tag Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="Add a tag (e.g., dinner, pasta, italian)"
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or click Add to add tags
                </p>
              </div>
              
              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Ingredients</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => appendIngredient({ name: '', amount: '', unit: '' })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Ingredient
                  </Button>
                </div>
                <div className="space-y-2">
                  {ingredientFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Input
                        placeholder="Amount"
                        className="w-20"
                        type="number"
                        step="any"
                        {...register(`ingredients.${index}.amount`)}
                      />
                      <Input
                        placeholder="Unit"
                        className="w-24"
                        {...register(`ingredients.${index}.unit`)}
                      />
                      <Input
                        placeholder="Ingredient name"
                        className="flex-1"
                        {...register(`ingredients.${index}.name`)}
                      />
                      {ingredientFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Instructions</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => appendInstruction({ instruction: '' })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {instructionFields.map((field, index) => (
                    <div key={field.id} className="flex items-start space-x-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mt-2">
                        {index + 1}
                      </span>
                      <textarea
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        rows={2}
                        placeholder="Describe this step..."
                        {...register(`instructions.${index}.instruction`)}
                      />
                      {instructionFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInstruction(index)}
                          className="mt-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}

          {!isEditing && mode !== 'manual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setMode('url')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    mode === 'url' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <Link className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900">Import from URL</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Paste a recipe link
                  </p>
                </button>
                
                <button
                  onClick={() => setMode('text')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    mode === 'text' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <Type className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900">Parse from Text</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Paste recipe text
                  </p>
                </button>
                
                <button
                  onClick={() => setMode('manual')}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    mode === 'manual' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <Type className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900">Manual Entry</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Type recipe details
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {(mode === 'manual' || isEditing) && (
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit" 
                onClick={handleSubmit(onSubmit)}
                loading={loading} 
                disabled={loading}
              >
                {isEditing ? 'Update Recipe' : 'Add Recipe'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}