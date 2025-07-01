import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, Plus, Link, Type, Clock, Users, Upload, Camera, Image as ImageIcon, Trash2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
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

type WizardStep = 'method' | 'url-input' | 'image-input' | 'processing' | 'recipe-details' | 'review'
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

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  recipe, 
  onUpdate 
}) => {
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 'method',
    method: null,
    urlInput: '',
    imageFile: null,
    imagePreview: '',
    extractedData: null,
    isProcessing: false
  })

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [initialFormData, setInitialFormData] = useState<any>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  
  const { currentSpace } = useSpacesContext()
  const isEditing = !!recipe
  
  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isDirty } } = useForm<RecipeFormData>({
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

  // Initialize wizard for editing
  useEffect(() => {
    if (isEditing && recipe && isOpen) {
      // Skip wizard for editing, go straight to recipe details
      setWizardState(prev => ({ ...prev, step: 'recipe-details', method: 'manual' }))
      populateFormWithRecipe(recipe)
      // Store initial form data for comparison
      setInitialFormData({
        ...recipe,
        tags: recipe.tags || []
      })
    } else if (isOpen && !isEditing) {
      // Reset wizard for new recipe
      setWizardState({
        step: 'method',
        method: null,
        urlInput: '',
        imageFile: null,
        imagePreview: '',
        extractedData: null,
        isProcessing: false
      })
      setInitialFormData(null)
    }
  }, [isEditing, recipe, isOpen])

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setWizardState({
        step: 'method',
        method: null,
        urlInput: '',
        imageFile: null,
        imagePreview: '',
        extractedData: null,
        isProcessing: false
      })
      setTags([])
      setTagInput('')
      setHasUnsavedChanges(false)
      setShowConfirmClose(false)
      setInitialFormData(null)
      reset()
    }
  }, [isOpen, reset])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !wizardState.isProcessing) {
        handleCloseAttempt()
      }
    }

    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, wizardState.isProcessing])

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

  // Check if form has unsaved changes
  const checkForUnsavedChanges = () => {
    if (!isEditing || !initialFormData) return false

    const currentFormData = watch()
    
    // Check basic form fields
    const fieldsChanged = 
      currentFormData.title !== (initialFormData.title || '') ||
      currentFormData.description !== (initialFormData.description || '') ||
      currentFormData.image_url !== (initialFormData.image_url || '') ||
      currentFormData.source_url !== (initialFormData.source_url || '') ||
      currentFormData.prep_time !== (initialFormData.prep_time || 0) ||
      currentFormData.cook_time !== (initialFormData.cook_time || 0) ||
      currentFormData.servings !== (initialFormData.servings || 4)

    // Check tags
    const initialTags = initialFormData.tags || []
    const tagsChanged = tags.length !== initialTags.length || 
      !tags.every(tag => initialTags.includes(tag))

    // Check ingredients
    const initialIngredients = initialFormData.ingredients || []
    const currentIngredients = currentFormData.ingredients || []
    const ingredientsChanged = currentIngredients.length !== initialIngredients.length ||
      !currentIngredients.every((ing: any, index: number) => {
        const initialIng = initialIngredients[index]
        return initialIng && 
          ing.name === (initialIng.name || '') &&
          ing.amount === (initialIng.amount?.toString() || '') &&
          ing.unit === (initialIng.unit || '')
      })

    // Check instructions
    const initialInstructions = initialFormData.instructions || []
    const currentInstructions = currentFormData.instructions || []
    const instructionsChanged = currentInstructions.length !== initialInstructions.length ||
      !currentInstructions.every((inst: any, index: number) => {
        const initialInst = initialInstructions[index]
        return initialInst && inst.instruction === (initialInst.instruction || '')
      })

    // Check image changes
    const imageChanged = wizardState.imageFile !== null ||
      wizardState.imagePreview !== (initialFormData.image_url || '')

    return fieldsChanged || tagsChanged || ingredientsChanged || instructionsChanged || imageChanged
  }

  // Update unsaved changes status
  useEffect(() => {
    if (isEditing && wizardState.step === 'recipe-details') {
      const hasChanges = checkForUnsavedChanges()
      setHasUnsavedChanges(hasChanges)
    }
  }, [watch(), tags, wizardState.imageFile, wizardState.imagePreview, isEditing, wizardState.step])

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges && isEditing) {
      setShowConfirmClose(true)
    } else {
      onClose()
    }
  }

  const handleConfirmClose = () => {
    setShowConfirmClose(false)
    onClose()
  }

  const handleCancelClose = () => {
    setShowConfirmClose(false)
  }

  const handleMethodSelect = (method: InputMethod) => {
    setWizardState(prev => ({ 
      ...prev, 
      method, 
      step: method === 'manual' ? 'recipe-details' : method === 'url' ? 'url-input' : 'image-input'
    }))
    
    // Scroll to top when entering recipe-details for manual entry
    if (method === 'manual') {
      setTimeout(() => {
        modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }

  const handleUrlImport = async () => {
    if (!wizardState.urlInput.trim()) return
    
    setWizardState(prev => ({ ...prev, isProcessing: true, step: 'processing' }))
    
    try {
      const extractedRecipe = await scrapeRecipeFromUrl(wizardState.urlInput.trim())
      
      setWizardState(prev => ({ 
        ...prev, 
        extractedData: extractedRecipe,
        isProcessing: false,
        step: 'recipe-details'
      }))
      
      // Populate form with extracted data
      populateFormWithRecipe({
        ...extractedRecipe,
        source_url: wizardState.urlInput,
        image_url: extractedRecipe.image || ''
      })
      
      if (extractedRecipe.image) {
        setWizardState(prev => ({ ...prev, imagePreview: extractedRecipe.image }))
      }
      
      // Scroll to top when transitioning to recipe details
      setTimeout(() => {
        modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      
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
      
      // Populate form with extracted data
      populateFormWithRecipe(extractedRecipe)
      
      // Scroll to top when transitioning to recipe details
      setTimeout(() => {
        modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      
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

  const onSubmit = async (data: RecipeFormData) => {
    if (!isEditing && !currentSpace) {
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
      
      onClose()
    } catch (error) {
      toast.error('Failed to save recipe')
      setWizardState(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !wizardState.isProcessing) {
      handleCloseAttempt()
    }
  }

  const getStepTitle = () => {
    switch (wizardState.step) {
      case 'method': return isEditing ? 'Edit Recipe' : 'How would you like to add your recipe?'
      case 'url-input': return 'Import from URL'
      case 'image-input': return 'Upload Recipe Image'
      case 'processing': return 'Processing...'
      case 'recipe-details': return 'Recipe Details'
      case 'review': return 'Review Recipe'
      default: return 'Add Recipe'
    }
  }

  const canGoBack = () => {
    return !wizardState.isProcessing && wizardState.step !== 'method' && wizardState.step !== 'processing'
  }

  if (!isOpen) return null
  
  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9997]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {canGoBack() && (
              <button
                onClick={goBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {getStepTitle()}
            </h2>
          </div>
          
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
          
          <button
            onClick={handleCloseAttempt}
            disabled={wizardState.isProcessing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div ref={modalContentRef} className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* Step 1: Method Selection */}
            {wizardState.step === 'method' && !isEditing && (
              <div className="space-y-6">
                <p className="text-gray-600 text-center mb-8">
                  Choose how you'd like to add your recipe
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleMethodSelect('url')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
                  >
                    <Link className="w-12 h-12 text-gray-400 group-hover:text-orange-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Import from URL</h3>
                    <p className="text-sm text-gray-600">
                      Paste a link from your favorite recipe website
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleMethodSelect('image')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
                  >
                    <Camera className="w-12 h-12 text-gray-400 group-hover:text-orange-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Scan Recipe Image</h3>
                    <p className="text-sm text-gray-600">
                      Upload or take a photo of a recipe
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleMethodSelect('manual')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
                  >
                    <Type className="w-12 h-12 text-gray-400 group-hover:text-orange-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Manual Entry</h3>
                    <p className="text-sm text-gray-600">
                      Type in your recipe details manually
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2a: URL Input */}
            {wizardState.step === 'url-input' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Recipe Import:</strong> Enter a URL from popular recipe sites like AllRecipes, Food Network, BBC Good Food, etc. 
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
              <div className="space-y-6">
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
                        <span className="text-gray-500 text-sm">or</span>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCameraCapture}
                        disabled={wizardState.isProcessing}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-4">
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
              <div className="space-y-6 text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {wizardState.method === 'url' ? 'Importing Recipe...' : 'Processing Image...'}
                  </h3>
                  <p className="text-gray-600">
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
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Recipe Details Form */}
            {wizardState.step === 'recipe-details' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Success message for extracted recipes */}
                {wizardState.extractedData && !isEditing && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">
                      <strong>Recipe extracted successfully!</strong> Review and edit the details below as needed.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                    onClick={handleCloseAttempt}
                    disabled={wizardState.isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    loading={wizardState.isProcessing} 
                    disabled={wizardState.isProcessing}
                  >
                    {isEditing ? 'Update Recipe' : 'Add Recipe'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Unsaved Changes
            </h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes to this recipe. Are you sure you want to close without saving?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelClose}
              >
                Keep Editing
              </Button>
              <Button
                variant="outline"
                onClick={handleConfirmClose}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(modalContent, document.body)
}
