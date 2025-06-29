import React, { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, Plus, Link, Type, Clock, Users, Upload, Camera, Image as ImageIcon, Trash2 } from 'lucide-react'
import { parseRecipeFromText, parseIngredientLine, scrapeRecipeFromUrl } from '../../utils/recipeParser'
import { useSpacesContext } from '../../contexts/SpacesContext'
import toast from 'react-hot-toast'

interface AddRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (recipe: any) => Promise<void>
  recipe?: any // Optional recipe for editing
  onUpdate?: (recipeId: string, recipe: any) => Promise<void>
}

interface RecipeFormData {
  title: string
  description: string
  image_url: string
  source_url: string
  prep_time: number
  cook_time: number
  servings: number
  tags: string
  ingredients: { name: string; amount: string; unit: string }[]
  instructions: { instruction: string }[]
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  recipe, 
  onUpdate 
}) => {
  const [mode, setMode] = useState<'url' | 'manual' | 'image'>('url')
  const [loading, setLoading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const { currentSpace } = useSpacesContext()
  
  const isEditing = !!recipe
  
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<RecipeFormData>({
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
  
  // Populate form when editing
  useEffect(() => {
    if (isEditing && recipe) {
      setValue('title', recipe.title || '')
      setValue('description', recipe.description || '')
      setValue('image_url', recipe.image_url || '')
      setImagePreview(recipe.image_url || '')
      setValue('source_url', recipe.source_url || '')
      setValue('prep_time', recipe.prep_time || 0)
      setValue('cook_time', recipe.cook_time || 0)
      setValue('servings', recipe.servings || 4)
      setTags(recipe.tags || [])
      
      // Clear existing fields and populate with recipe data
      // Remove all existing ingredients
      for (let i = ingredientFields.length - 1; i >= 0; i--) {
        removeIngredient(i)
      }
      
      // Add recipe ingredients or default empty one
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
      
      // Remove all existing instructions
      for (let i = instructionFields.length - 1; i >= 0; i--) {
        removeInstruction(i)
      }
      
      // Add recipe instructions or default empty one
      const instructionsToAdd = recipe.instructions && recipe.instructions.length > 0 
        ? recipe.instructions 
        : [{ instruction: '' }]
      
      instructionsToAdd.forEach((instruction: any) => {
        appendInstruction({ instruction: instruction.instruction || '' })
      })
      
      // Set mode to manual for editing
      setMode('manual')
    }
  }, [isEditing, recipe, setValue, removeIngredient, appendIngredient, removeInstruction, appendInstruction])
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUrlInput('')
      setTextInput('')
      setImageFile(null)
      setImagePreview('')
      setTagInput('')
      setTags([])
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      // Prevent body scroll when modal is open
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, onClose])

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB')
        return
      }
      
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setValue('image_url', '') // Clear URL when uploading file
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageOCR = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for OCR
      toast.error('Image size must be less than 10MB')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-recipe`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Failed to process recipe image'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }
      
      const recipeData = await response.json()
      
      // Populate form with OCR data
      setValue('title', recipeData.title || '')
      setValue('description', recipeData.description || '')
      setValue('prep_time', recipeData.prepTime || 0)
      setValue('cook_time', recipeData.cookTime || 0)
      setValue('servings', recipeData.servings || 4)
      
      // Set the uploaded image as preview
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setValue('image_url', '') // Clear URL when uploading file
      }
      reader.readAsDataURL(file)
      
      // Clear existing fields and add OCR ingredients
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
      
      // Clear existing fields and add OCR instructions
      for (let i = instructionFields.length - 1; i >= 0; i--) {
        removeInstruction(i)
      }
      
      const instructionsToAdd = recipeData.instructions && recipeData.instructions.length > 0 
        ? recipeData.instructions 
        : [{ instruction: '' }]
      
      instructionsToAdd.forEach((instruction: any) => {
        appendInstruction({ instruction: instruction.instruction || '' })
      })
      
      toast.success('Recipe extracted from image! Review and edit as needed.')
    } catch (error) {
      console.error('OCR error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process recipe image')
    } finally {
      setLoading(false)
    }
  }

  const handleCameraCapture = () => cameraInputRef.current?.click()

  const handleCameraInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    // Show loading indicator while the image is processed
    setLoading(true)
    setImageFile(file)

    // preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
      setValue('image_url', '')
    }
    reader.readAsDataURL(file)

    /* run OCR – wait so loading stays true until done */
    if (mode === 'image') {
      await handleImageOCRFromFile(file)
    }

    // Allow selecting the same file again by clearing the input value
    input.value = ''
  }

  const handleImageOCRFromFile = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-recipe`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Failed to process recipe image'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }
      
      const recipeData = await response.json()

      const ingredientsToAdd =
        recipeData.ingredients && recipeData.ingredients.length > 0
          ? recipeData.ingredients.map((ingredient: any) => ({
              name: ingredient.name || '',
              amount: ingredient.amount?.toString() || '',
              unit: ingredient.unit || ''
            }))
          : [{ name: '', amount: '', unit: '' }]

      const instructionsToAdd =
        recipeData.instructions && recipeData.instructions.length > 0
          ? recipeData.instructions.map((instruction: any) => ({
              instruction: instruction.instruction || ''
            }))
          : [{ instruction: '' }]

      // Switch to manual mode before populating form fields so inputs are mounted
      setMode('manual')

      // Reset the form with the extracted values to ensure fields populate
      reset({
        title: recipeData.title || '',
        description: recipeData.description || '',
        image_url: '',
        source_url: '',
        prep_time: recipeData.prepTime || 0,
        cook_time: recipeData.cookTime || 0,
        servings: recipeData.servings || 4,
        tags: [],
        ingredients: ingredientsToAdd,
        instructions: instructionsToAdd
      })

      setImageFile(file)
      const previewReader = new FileReader()
      previewReader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      previewReader.readAsDataURL(file)

      toast.success('Recipe extracted from image! Review and edit as needed.')
    } catch (error) {
      console.error('OCR error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process recipe image')
    } finally {
      setLoading(false)
    }
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

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return
    
    setLoading(true)
    try {
      const recipe = await scrapeRecipeFromUrl(urlInput.trim())
      
      // Populate form with scraped data
      setValue('title', recipe.title || '')
      setValue('description', recipe.description || '')
      if (recipe.image) {
        setValue('image_url', recipe.image)
        setImagePreview(recipe.image)
      }
      setValue('source_url', urlInput)
      setValue('prep_time', recipe.prepTime || 0)
      setValue('cook_time', recipe.cookTime || 0)
      setValue('servings', recipe.servings || 4)
      setTags(recipe.tags || [])
      
      // Clear existing fields and add scraped ingredients
      // Remove all existing ingredients
      for (let i = ingredientFields.length - 1; i >= 0; i--) {
        removeIngredient(i)
      }
      
      // Add scraped ingredients or default empty one
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
      
      // Clear existing fields and add scraped instructions
      // Remove all existing instructions
      for (let i = instructionFields.length - 1; i >= 0; i--) {
        removeInstruction(i)
      }
      
      // Add scraped instructions or default empty one
      const instructionsToAdd = recipe.instructions && recipe.instructions.length > 0 
        ? recipe.instructions 
        : [{ instruction: '' }]
      
      instructionsToAdd.forEach((instruction: any) => {
        appendInstruction({ instruction: instruction.instruction || '' })
      })
      
      toast.success('Recipe imported successfully! Review and edit as needed.')
      setMode('manual')
    } catch (error) {
      console.error('Recipe import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import recipe. Please try manual entry.')
      setMode('manual')
    } finally {
      setLoading(false)
    }
  }
  
  const handleTextImport = () => {
    if (!textInput.trim()) return
    
    try {
      const parsed = parseRecipeFromText(textInput)
      setValue('title', parsed.title)
      setValue('description', parsed.description || '')
      setValue('servings', parsed.servings)
      
      // Clear existing fields and add parsed ones
      while (ingredientFields.length > 0) {
        removeIngredient(0)
      }
      parsed.ingredients.forEach(ingredient => {
        appendIngredient({
          name: ingredient.name,
          amount: ingredient.amount?.toString() || '',
          unit: ingredient.unit || ''
        })
      })
      
      while (instructionFields.length > 0) {
        removeInstruction(0)
      }
      parsed.instructions.forEach(instruction => {
        appendInstruction(instruction)
      })
      
      toast.success('Recipe parsed successfully!')
      setMode('manual')
    } catch (error) {
      toast.error('Failed to parse recipe text')
    }
  }
  
  const onSubmit = async (data: RecipeFormData) => {
    if (!isEditing && !currentSpace) {
      toast.error('No space selected. Please select or create a space first.')
      return
    }
    
    setLoading(true)
    try {
      let finalImageUrl = data.image_url
      
      // Handle image upload if there's a file
      if (imageFile) {
        try {
          // Convert to base64 for storage (in production, use proper file storage)
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
            amount: ing.amount && ing.amount.trim() ? parseFloat(ing.amount) : null,
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
      
      reset()
      setUrlInput('')
      setTextInput('')
      setImageFile(null)
      setImagePreview('')
      setTags([])
      setTagInput('')
      setMode('url')
      onClose()
    } catch (error) {
      toast.error('Failed to add recipe')
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9997]"
      onClick={handleBackdropClick}
      style={{ zIndex: 9997 }}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-[9998]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
          </h2>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraInputChange}
            className="absolute w-px h-px opacity-0 overflow-hidden -m-px"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* Mode Selection */}
            {!isEditing && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={mode === 'url' ? 'primary' : 'outline'}
                  onClick={() => setMode('url')}
                  className="flex items-center space-x-2 flex-1 min-w-0"
                >
                  <Link className="w-4 h-4" />
                  <span>Import from URL</span>
                </Button>
                <Button
                  variant={mode === 'image' ? 'primary' : 'outline'}
                  onClick={() => setMode('image')}
                  className="flex items-center space-x-2 flex-1 min-w-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Recipe Image</span>
                </Button>
                <Button
                  variant={mode === 'manual' ? 'primary' : 'outline'}
                  onClick={() => setMode('manual')}
                  className="flex items-center space-x-2 flex-1 min-w-0"
                >
                  <Type className="w-4 h-4" />
                  <span>Manual Entry</span>
                </Button>
              </div>
            )}
            
            {/* URL Import */}
            {!isEditing && mode === 'url' && (
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Recipe Import:</strong> Enter a URL from popular recipe sites like AllRecipes, Food Network, BBC Good Food, etc. 
                    The system will automatically extract recipe details.
                  </p>
                </div>
                <Input
                  label="Recipe URL"
                  placeholder="https://www.allrecipes.com/recipe/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={loading}
                />
                <Button 
                  onClick={handleUrlImport} 
                  loading={loading}
                  disabled={!urlInput.trim() || loading}
                >
                  Import Recipe
                </Button>
              </div>
            )}
            
            {/* Image OCR */}
            {!isEditing && mode === 'image' && (
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Recipe Image Scanner:</strong> Upload a photo of a recipe from a cookbook, 
                    magazine, or printed recipe. Our AI will extract the ingredients and instructions for you.
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-4">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageOCR}
                          className="hidden"
                          disabled={loading}
                          id="ocr-image-upload"
                        />
                        <label htmlFor="ocr-image-upload" className="cursor-pointer">
                          <Button 
                            type="button" 
                            size="lg" 
                            disabled={loading}
                            className="w-full sm:w-auto pointer-events-none"
                          >
                            <Upload className="w-5 h-5 mr-2" />
                            {loading ? 'Processing...' : 'Upload Recipe Image'}
                          </Button>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <span className="text-gray-500 text-sm">or</span>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCameraCapture}
                        disabled={loading}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-4">
                      Supports JPG, PNG, and other common image formats
                    </p>
                  </div>
                  
                </div>
                
                {loading && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                      <p className="text-sm text-orange-800">
                        <strong>Processing image...</strong> Our AI is reading the recipe. This may take a moment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Manual Entry Form */}
            {(isEditing || mode === 'manual') && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Recipe Title"
                    {...register('title', { required: 'Title is required' })}
                    error={errors.title?.message}
                  />
                  
                  {/* Image Upload Section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Recipe Image
                    </label>
                    
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Recipe preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
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
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="manual-image-upload"
                            />
                            <label htmlFor="manual-image-upload" className="cursor-pointer">
                              <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto pointer-events-none">
                                <Upload className="w-4 h-4 mr-1" />
                                Upload
                              </Button>
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCameraCapture}
                              disabled={loading}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Camera
                            </Button>
                            
                            {/* Hidden camera input for manual mode */}
                            <input
                              id="manual-camera-input"
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) { // 5MB limit
                                    toast.error('Image size must be less than 5MB')
                                    return
                                  }
                                  
                                  setImageFile(file)
                                  const reader = new FileReader()
                                  reader.onload = (event) => {
                                    const result = event.target?.result as string
                                    setImagePreview(result)
                                    setValue('image_url', '') // Clear URL when uploading file
                                  }
                                  reader.readAsDataURL(file)
                                }
                                // Clear the input value
                                e.target.value = ''
                              }}
                              className="hidden"
                            />
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
                    className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    {...register('description')}
                    placeholder="Brief description of the recipe..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                
                {/* Enhanced Tags Section */}
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
                    
                    {/* Hidden camera input */}
                    <input
                      id="camera-capture-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraInputChange}
                      className="hidden"
                    />
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
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading} disabled={loading}>
                    {isEditing ? 'Update Recipe' : 'Add Recipe'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}