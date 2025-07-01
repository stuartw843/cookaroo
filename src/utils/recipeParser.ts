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

const parseTimeString = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // Extract numbers from time strings like "30 minutes", "1 hour 15 minutes", etc.
  const hourMatch = timeStr.match(/(\d+)\s*(?:hour|hr)/i);
  const minuteMatch = timeStr.match(/(\d+)\s*(?:minute|min)/i);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  
  return hours * 60 + minutes;
};

const scrapeWithLocalPackage = async (url: string): Promise<any> => {
  try {
    // Dynamic import to handle potential module loading issues
    const recipeScraper = await import('@brandonrjguth/recipe-scraper');
    const scrapedRecipe = await recipeScraper.default(url);
    
    // Transform the package's format to our expected format
    return {
      title: scrapedRecipe.name || '',
      description: '', // Package doesn't provide description
      image: scrapedRecipe.image || '',
      prepTime: parseTimeString(scrapedRecipe.time?.prep || '') || 0,
      cookTime: parseTimeString(scrapedRecipe.time?.cook || '') || 0,
      totalTime: parseTimeString(scrapedRecipe.time?.total || '') || 0,
      servings: parseInt(scrapedRecipe.servings || '4') || 4,
      tags: scrapedRecipe.tags || [],
      ingredients: scrapedRecipe.ingredients?.map((ingredient: string) => {
        const parsed = parseIngredientLine(ingredient);
        return {
          name: parsed.name,
          amount: parsed.quantity,
          unit: parsed.unit
        };
      }) || [],
      instructions: scrapedRecipe.instructions?.map((instruction: string) => ({
        instruction: instruction.trim()
      })) || []
    };
  } catch (error) {
    console.warn('Local recipe scraper failed:', error);
    throw error;
  }
};

const scrapeWithEdgeFunction = async (url: string): Promise<any> => {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-recipe`
  
  console.log('Using edge function fallback:', apiUrl)
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: url.trim() })
  })

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
};

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
  
  const cleanUrl = url.trim();
  
  try {
    // First, try the local recipe-scraper package
    console.log('Attempting to scrape with local package:', cleanUrl);
    const result = await scrapeWithLocalPackage(cleanUrl);
    console.log('Successfully scraped with local package');
    return result;
  } catch (localError) {
    console.warn('Local package failed, trying edge function fallback:', localError);
    
    try {
      // Fallback to the Supabase Edge Function
      const result = await scrapeWithEdgeFunction(cleanUrl);
      console.log('Successfully scraped with edge function fallback');
      return result;
    } catch (edgeError) {
      console.error('Both scraping methods failed:', { localError, edgeError });
      
      // Provide a more helpful error message
      if (localError instanceof Error && localError.message.includes('Site not yet supported')) {
        throw new Error('This website is not supported by our recipe scraper. Please try a different recipe URL or enter the recipe manually.');
      }
      
      throw new Error('Failed to import recipe. Please check the URL and try again, or enter the recipe manually.');
    }
  }
}
