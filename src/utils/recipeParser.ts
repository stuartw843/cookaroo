export interface ParsedIngredient {
  quantity?: number
  unit?: string
  name: string
  section?: string
}

export const parseIngredientLine = (line: string): ParsedIngredient => {
  // Simple ingredient parsing
  const match = line.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(\w+)?\s+(.+)$/)
  
  if (match) {
    const [, quantity, unit, name] = match
    return {
      quantity: parseFloat(quantity),
      unit: unit || undefined,
      name: name.trim()
    }
  }
  
  return { name: line.trim() }
}

export const parseRecipeFromText = (text: string) => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  
  let title = ''
  let description = ''
  let ingredients: ParsedIngredient[] = []
  let instructions: string[] = []
  let servings = 4
  
  let currentSection = 'title'
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    if (lowerLine.includes('ingredient')) {
      currentSection = 'ingredients'
      continue
    } else if (lowerLine.includes('instruction') || lowerLine.includes('method') || lowerLine.includes('direction')) {
      currentSection = 'instructions'
      continue
    } else if (lowerLine.includes('serves') || lowerLine.includes('serving')) {
      const match = line.match(/(\d+)/)
      if (match) servings = parseInt(match[1])
      continue
    }
    
    switch (currentSection) {
      case 'title':
        if (!title) {
          title = line
          currentSection = 'description'
        }
        break
      case 'description':
        if (lowerLine.includes('ingredient') || line.match(/^\d/)) {
          currentSection = 'ingredients'
          ingredients.push(parseIngredientLine(line))
        } else {
          description += (description ? ' ' : '') + line
        }
        break
      case 'ingredients':
        if (line.match(/^\d+\./) || lowerLine.includes('step')) {
          currentSection = 'instructions'
          instructions.push(line.replace(/^\d+\.\s*/, ''))
        } else {
          ingredients.push(parseIngredientLine(line))
        }
        break
      case 'instructions':
        instructions.push(line.replace(/^\d+\.\s*/, ''))
        break
    }
  }
  
  return {
    title: title || 'Untitled Recipe',
    description: description || undefined,
    servings,
    ingredients,
    instructions: instructions.map(instruction => ({ instruction }))
  }
}

export const scrapeRecipeFromUrl = async (url: string): Promise<any> => {
  if (!url || !url.trim()) {
    throw new Error('Please enter a valid URL')
  }
  
  // Basic URL validation
  try {
    new URL(url)
  } catch {
    throw new Error('Please enter a valid URL')
  }
  
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-recipe`
    
    console.log('Sending request to:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url.trim() })
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      let errorMessage = 'Failed to scrape recipe'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        errorMessage = `Server error: ${response.status}`
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    console.log('Received data:', data)
    
    // Transform the data to match our expected format
    return {
      title: data.title || '',
      description: data.description || '',
      image: data.image || '',
      prepTime: data.prepTime || 0,
      cookTime: data.cookTime || 0,
      totalTime: data.totalTime || 0,
      servings: data.servings || 4,
      tags: data.tags || [],
      ingredients: data.ingredients || [],
      instructions: data.instructions || []
    }
  } catch (error) {
    console.error('Recipe scraping failed:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to import recipe. Please check the URL and try again.')
  }
}
