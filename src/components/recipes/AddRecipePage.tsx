import React, { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, Plus, Link, Type, Clock, Users, Upload, Camera, Image as ImageIcon, Trash2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { parseRecipeFromText, parseIngredientLine, scrapeRecipeFromUrl } from '../../utils/recipeParser'
import { useSpacesContext } from '../../contexts/SpacesContext'
import { useRecipes } from '../../hooks/useRecipes'
import toast from 'react-hot-toast'

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

type WizardStep = 'method' | 'url-input' | 'image-input' | 'processing' | 'recipe-details'
type InputMethod = 'url' | 'image' | 'manual'

interface WizardState {
  step: WizardStep
  method: InputMethod | null
  urlInput: string
  imageFile: File | null
  imagePreview: string
  extractedData: any
  isProcessing: boolean
}

const STORAGE_KEY = 'addRecipeWizardState'

export const AddRecipePage: React.FC = () => {
  const navigate = useNavigate()
  const { addRecipe } = useRecipes()
  
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    // Try to restore state from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Only restore if saved within last 30 minutes (camera operations can take time)
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return {
            step: parsed.step || 'method',
            method: parsed.method || null,
            urlInput: parsed.urlInput || '',
            imageFile: null, // Don't restore file objects
            imagePreview: parsed.imagePreview || '',
            extractedData: parsed.extractedData || null,
            isProcessing: false
          }
        }
      } catch (error) {
        console.error('Failed to restore wizard state:', error)
      }
    }
    
    return {
      step: 'method',
      method: null,
      urlInput: '',
      imageFile: null,
      imagePreview: '',
      extractedData: null,
      isProcessing: false
    }
  })

  const [tags, setTags] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          return parsed.tags || []
        }
      } catch (error) {
        console.error('Failed to restore tags:', error)
      }
    }
    return []
  })
  
  const [tagInput, setTagInput] = useState('')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const { currentSpace } = useSpacesContext()
  
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

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      ...wizardState,
      tags,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  }, [wizardState, tags])

  // Restore form data if we have extracted data
  useEffect(() => {
    if (wizardState.extractedData && wizardState.step === 'recipe-details') {
      populateFormWithRecipe(wizardState.extractedData)
    }
  }, [wizardState.extractedData, wizardState.step])

  // Clear storage when leaving the page (but not on mobile camera operations)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!wizardState.isProcessing && wizardState.step !== 'processing') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [wizardState.isProcessing, wizardState.step])

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
      setWizardState(prev => ({ ...prev, imagePreview: recipeData.image_url }))
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

  const handleMethodSelect = (method: InputMethod) => {
    setWizardState(prev => ({ 
      ...prev, 
      method, 
      step: method === 'manual' ? 'recipe-details' : method === 'url' ? 'url-input' : 'image-input'
    }))
  }

  const handleUrlImport = async () => {
    if (!wizardState.urlInput.trim()) return
    
    setWizardState(prev => ({ ...prev, isProcessing: true, step: 'processing' }))
    
    try {
      const extractedRecipe = await scrapeRecipeFromUrl(wizardState.urlInput.trim())
      
      setWizardState(prev => ({ 
        ...prev, 
        extractedData: {
          ...extractedRecipe,
          source_url: wizardState.urlInput,
          image_url: extractedRecipe.image || ''
        },
        isProcessing: false,
        step: 'recipe-details'
      }))
      
      if (extractedRecipe.image) {
        setWizardState(prev => ({ ...prev, imagePreview: extractedRecipe.image }))
      }
      
      toast.success('Recipe imported successfully! Review and edit as needed.')
    } catch (error) {
      console.error('Recipe import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import recipe')
      setWizardState(prev => ({ ...prev, isProcessing: false, step: 'url-input' }))
    }
  }

  const handleImageUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setWizardState(prev => ({ 
      ...prev, 
      imageFile: file,
      isProcessing: true,
      step: 'processing'
    }))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      setWizardState(prev => ({ ...prev, imagePreview: preview }))
    }
    reader.readAsDataURL(file)

    // Process OCR
    processImageOCR(file)
  }

  const processImageOCR = async (file: File) => {
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
      
      const extractedRecipe = await response.json()
      
      setWizardState(prev => ({ 
        ...prev, 
        extractedData: extractedRecipe,
        isProcessing: false,
        step: 'recipe-details'
      }))
      
      toast.success('Recipe extracted from image! Review and edit as needed.')
    } catch (error) {
      console.error('OCR error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process recipe image')
      setWizardState(prev => ({ ...prev, isProcessing: false, step: 'image-input' }))
    }
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const handleCameraInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    // Clear input to allow same file selection
    event.target.value = ''
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const removeImage = () => {
    setWizardState(prev => ({ ...prev, imageFile: null, imagePreview: '' }))
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

  const goBack = () => {
    switch (wizardState.step) {
      case 'url-input':
      case 'image-input':
        setWizardState(prev => ({ ...prev, step: 'method' }))
        break
      case 'recipe-details':
        if (wizardState.method === 'manual') {
          setWizardState(prev => ({ ...prev, step: 'method' }))
        } else {
          setWizardState(prev => ({ 
            ...prev, 
            step: wizardState.method === 'url' ? 'url-input' : 'image-input' 
          }))
        }
        break
    }
  }

  const handleCancel = () => {
    localStorage.removeItem(STORAGE_KEY)
    navigate(-1) // Go back to previous page
  }

  const onSubmit = async (data: RecipeFormData) => {
    if (!currentSpace) {
      toast.error('No space selected. Please select or create a space first.')
      return
    }
    
    setWizardState(prev => ({ ...prev, isProcessing: true }))
    
    try {
      let finalImageUrl = data.image_url
      
      // Handle image upload if there's a file
      if (wizardState.imageFile) {
        try {
          const reader = new FileReader()
          finalImageUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to read image file'))
            reader.readAsDataURL(wizardState.imageFile!)
          })
        } catch (error) {
          console.error('Image processing error:', error)
          toast.error('Failed to process image')
          setWizardState(prev => ({ ...prev, isProcessing: false }))
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
            amount: ing.amount && ing.amount.trim() ? parseFloat(ing.amount) : undefined,
            unit: ing.unit.trim() || undefined
          })),
        instructions: data.instructions
          .filter(inst => inst.instruction.trim())
          .map(inst => ({ instruction: inst.instruction.trim() }))
      }
      
      await addRecipe(recipeData)
      toast.success('Recipe added successfully!')
      
      // Clear storage and navigate back
      localStorage.removeItem(STORAGE_KEY)
      navigate(-1)
    } catch (error) {
      toast.error('Failed to save recipe')
      setWizardState(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const getStepTitle = () => {
    switch (wizardState.step) {
      case 'method': return 'How would you like to add your recipe?'
      case 'url-input': return 'Import from URL'
      case 'image-input': return 'Upload Recipe Image'
      case 'processing': return 'Processing...'
      case 'recipe-details': return 'Recipe Details'
      default: return 'Add Recipe'
    }
  }

  const canGoBack = () => {
    return !wizardState.isProcessing && wizardState.step !== 'method' && wizardState.step !== 'processing'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {canGoBack() ? (
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={wizardState.isProcessing}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={wizardState.isProcessing}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {getStepTitle()}
              </h1>
            </div>
            
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${wizardState.step === 'method' ? 'bg-orange-500' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${['url-input', 'image-input'].includes(wizardState.step) ? 'bg-orange-500' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${wizardState.step === 'processing' ? 'bg-orange-500' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${wizardState.step === 'recipe-details' ? 'bg-orange-500' : 'bg-gray-300'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hidden camera input */}
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

        {/* Step 1: Method Selection */}
        {wizardState.step === 'method' && (
          <div className="space-y-8">
            <p className="text-gray-600 text-center text-lg">
              Choose how you'd like to add your recipe
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => handleMethodSelect('url')}
                className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <Link className="w-16 h-16 text-gray-400 group-hover:text-orange-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Import from URL</h3>
                <p className="text-gray-600">
                  Paste a link from your favorite recipe website
                </p>
              </button>
              
              <button
                onClick={() => handleMethodSelect('image')}
                className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <Camera className="w-16 h-16 text-gray-400 group-hover:text-orange-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Scan Recipe Image</h3>
                <p className="text-gray-600">
                  Upload or take a photo of a recipe
                </p>
              </button>
              
              <button
                onClick={() => handleMethodSelect('manual')}
                className="p-8 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <Type className="w-16 h-16 text-gray-400 group-hover:text-orange-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Manual Entry</h3>
                <p className="text-gray-600">
                  Type in your recipe details manually
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2a: URL Input */}
        {wizardState.step === 'url-input' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Recipe Import:</strong> Enter a URL from popular recipe sites like AllRecipes, EatingWell, BBC Good Food, etc. 
                The system will automatically extract recipe details.
              </p>
            </div>
            
            <Input
              label="Recipe URL"
              placeholder="https://www.allrecipes.com/recipe/..."
              value={wizardState.urlInput}
              onChange={(e) => setWizardState(prev => ({ ...prev, urlInput: e.target.value }))}
              disabled={wizardState.isProcessing}
            />
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={goBack}
                disabled={wizardState.isProcessing}
              >
                Back
              </Button>
              <Button 
                onClick={handleUrlImport} 
                loading={wizardState.isProcessing}
                disabled={!wizardState.urlInput.trim() || wizardState.isProcessing}
              >
                Import Recipe
              </Button>
            </div>
          </div>
        )}

        {/* Step 2b: Image Input */}
        {wizardState.step === 'image-input' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Recipe Image Scanner:</strong> Upload a photo of a recipe from a cookbook, 
                magazine, or screen. Our AI will extract the ingredients and instructions for you.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
              <div className="text-center">
                <Camera className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      disabled={wizardState.isProcessing}
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Button 
                        type="button" 
                        size="lg" 
                        disabled={wizardState.isProcessing}
                        className="w-full sm:w-auto pointer-events-none"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Recipe Image
                      </Button>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <span className="text-gray-500">or</span>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleCameraCapture}
                    disabled={wizardState.isProcessing}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 mt-6">
                  Supports JPG, PNG, and other common image formats (max 10MB)
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {wizardState.step === 'processing' && (
          <div className="max-w-2xl mx-auto space-y-8 text-center py-16">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-orange-600 mx-auto"></div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {wizardState.method === 'url' ? 'Importing Recipe...' : 'Processing Image...'}
              </h3>
              <p className="text-gray-600 text-lg">
                {wizardState.method === 'url' 
                  ? 'Extracting recipe details from the website...' 
                  : 'Our AI is reading the recipe from your image. This may take a moment...'
                }
              </p>
            </div>
            
            {wizardState.imagePreview && (
              <div className="max-w-sm mx-auto">
                <img
                  src={wizardState.imagePreview}
                  alt="Processing"
                  className="w-full h-64 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Recipe Details Form */}
        {wizardState.step === 'recipe-details' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Success message for extracted recipes */}
            {wizardState.extractedData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800">
                  <strong>Recipe extracted successfully!</strong> Review and edit the details below as needed.
                </p>
              </div>
            )}

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
                
                {(wizardState.imagePreview || watch('image_url')) ? (
                  <div className="relative">
                    <img
                      src={wizardState.imagePreview || watch('image_url')}
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
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image size must be less than 5MB')
                                return
                              }
                              setWizardState(prev => ({ ...prev, imageFile: file }))
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                const result = e.target?.result as string
                                setWizardState(prev => ({ ...prev, imagePreview: result }))
                                setValue('image_url', '')
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="hidden"
                          id="manual-image-upload"
                        />
                        <label htmlFor="manual-image-upload" className="cursor-pointer">
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
                      setWizardState(prev => ({ ...prev, imagePreview: value, imageFile: null }))
                    } else if (!value.trim() && !wizardState.imageFile) {
                      setWizardState(prev => ({ ...prev, imagePreview: '' }))
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
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              {canGoBack() && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goBack}
                  disabled={wizardState.isProcessing}
                >
                  Back
                </Button>
              )}
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={wizardState.isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={wizardState.isProcessing} 
                disabled={wizardState.isProcessing}
              >
                Add Recipe
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}