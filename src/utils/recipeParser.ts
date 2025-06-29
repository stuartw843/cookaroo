// Recipe parsing utility functions

export interface ParsedIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface ParsedRecipe {
  title: string;
  description?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: ParsedIngredient[];
  instructions: { instruction: string }[];
  tags?: string[];
  image?: string;
}

/**
 * Parse a recipe from plain text
 */
export function parseRecipeFromText(text: string): ParsedRecipe {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let title = 'Untitled Recipe';
  let description = '';
  let servings = 4;
  const ingredients: ParsedIngredient[] = [];
  const instructions: { instruction: string }[] = [];
  
  let currentSection = 'title';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect section headers
    if (lowerLine.includes('ingredient')) {
      currentSection = 'ingredients';
      continue;
    } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('method')) {
      currentSection = 'instructions';
      continue;
    } else if (lowerLine.includes('serving')) {
      const servingMatch = line.match(/(\d+)/);
      if (servingMatch) {
        servings = parseInt(servingMatch[1]);
      }
      continue;
    }
    
    // Parse content based on current section
    if (currentSection === 'title' && !title.includes('Untitled')) {
      title = line;
      currentSection = 'description';
    } else if (currentSection === 'description' && !lowerLine.includes('ingredient') && !lowerLine.includes('instruction')) {
      description = line;
    } else if (currentSection === 'ingredients') {
      const ingredient = parseIngredientLine(line);
      if (ingredient.name) {
        ingredients.push(ingredient);
      }
    } else if (currentSection === 'instructions') {
      if (line.length > 5) { // Filter out very short lines
        instructions.push({ instruction: line });
      }
    }
  }
  
  // If no ingredients found, try to parse the whole text as ingredients
  if (ingredients.length === 0) {
    for (const line of lines.slice(1)) { // Skip title
      const ingredient = parseIngredientLine(line);
      if (ingredient.name) {
        ingredients.push(ingredient);
      }
    }
  }
  
  return {
    title,
    description,
    servings,
    ingredients,
    instructions
  };
}

/**
 * Parse an individual ingredient line
 */
export function parseIngredientLine(line: string): ParsedIngredient {
  // Remove leading numbers, dashes, or bullets
  const cleanLine = line.replace(/^[\d\-\*\•\s]+/, '').trim();
  
  // Common units to look for
  const units = [
    'cup', 'cups', 'c',
    'tablespoon', 'tablespoons', 'tbsp', 'tbs',
    'teaspoon', 'teaspoons', 'tsp',
    'pound', 'pounds', 'lb', 'lbs',
    'ounce', 'ounces', 'oz',
    'gram', 'grams', 'g',
    'kilogram', 'kilograms', 'kg',
    'liter', 'liters', 'l',
    'milliliter', 'milliliters', 'ml',
    'pint', 'pints', 'pt',
    'quart', 'quarts', 'qt',
    'gallon', 'gallons', 'gal',
    'piece', 'pieces', 'pc',
    'slice', 'slices',
    'clove', 'cloves',
    'bunch', 'bunches'
  ];
  
  // Try to match quantity and unit at the beginning
  const quantityUnitRegex = new RegExp(`^(\\d+(?:\\.\\d+)?(?:\\s*\\/\\s*\\d+)?|\\d+\\s*\\/\\s*\\d+)\\s*(${units.join('|')})\\s+(.+)`, 'i');
  const match = cleanLine.match(quantityUnitRegex);
  
  if (match) {
    const [, quantityStr, unit, name] = match;
    let quantity: number | undefined;
    
    // Parse fractions and decimals
    if (quantityStr.includes('/')) {
      const [numerator, denominator] = quantityStr.split('/').map(s => parseFloat(s.trim()));
      quantity = numerator / denominator;
    } else {
      quantity = parseFloat(quantityStr);
    }
    
    return {
      name: name.trim(),
      quantity: isNaN(quantity) ? undefined : quantity,
      unit: unit.toLowerCase()
    };
  }
  
  // Try to match just quantity at the beginning
  const quantityOnlyRegex = /^(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?|\d+\s*\/\s*\d+)\s+(.+)/;
  const quantityMatch = cleanLine.match(quantityOnlyRegex);
  
  if (quantityMatch) {
    const [, quantityStr, name] = quantityMatch;
    let quantity: number | undefined;
    
    if (quantityStr.includes('/')) {
      const [numerator, denominator] = quantityStr.split('/').map(s => parseFloat(s.trim()));
      quantity = numerator / denominator;
    } else {
      quantity = parseFloat(quantityStr);
    }
    
    return {
      name: name.trim(),
      quantity: isNaN(quantity) ? undefined : quantity
    };
  }
  
  // If no quantity/unit pattern found, return the whole line as ingredient name
  return {
    name: cleanLine
  };
}

/**
 * Scrape recipe from URL using Supabase edge function
 */
export async function scrapeRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-recipe`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to scrape recipe';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Transform the response to match our ParsedRecipe interface
    return {
      title: data.title || 'Untitled Recipe',
      description: data.description || '',
      servings: data.servings || 4,
      prepTime: data.prepTime || 0,
      cookTime: data.cookTime || 0,
      ingredients: data.ingredients || [],
      instructions: data.instructions || [],
      tags: data.tags || [],
      image: data.image || ''
    };
  } catch (error) {
    console.error('Recipe scraping error:', error);
    throw error;
  }
}