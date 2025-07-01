const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RecipeData {
  title?: string
  description?: string
  image?: string
  prepTime?: number
  cookTime?: number
  totalTime?: number
  servings?: number
  tags?: string[]
  ingredients?: Array<{
    name: string
    amount?: number
    unit?: string
  }>
  instructions?: Array<{
    instruction: string
  }>
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Scraping recipe from: ${url}`);

    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Fetched HTML, length: ${html.length}`);
    
    // Extract recipe data
    let recipeData: RecipeData = {};

    // Try JSON-LD first
    recipeData = extractJsonLd(html);
    
    // Fallback to microdata
    if (!recipeData.title) {
      recipeData = extractMicrodata(html);
    }

    // Final fallback to basic HTML
    if (!recipeData.title) {
      recipeData = extractBasicData(html);
    }

    // Ensure we have at least a title
    if (!recipeData.title) {
      recipeData.title = "Imported Recipe";
    }

    // Set defaults
    recipeData.servings = recipeData.servings || 4;
    recipeData.ingredients = recipeData.ingredients || [];
    recipeData.instructions = recipeData.instructions || [];

    console.log(`Extracted recipe: ${recipeData.title}`);

    return new Response(
      JSON.stringify(recipeData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Recipe scraping error:', error);
    
    // Return a more specific error message
    let errorMessage = "Failed to scrape recipe";
    if (error.name === 'AbortError') {
      errorMessage = "Request timed out";
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = "Could not access the website";
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function extractJsonLd(html: string): RecipeData {
  const result: RecipeData = {};
  
  try {
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    
    if (!jsonLdMatches) return result;

    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        const data = JSON.parse(jsonContent);
        
        const recipes = Array.isArray(data) ? data : [data];
        
        for (const item of recipes) {
          if (isRecipe(item)) {
            return parseRecipeData(item);
          }
          
          // Check @graph
          if (item['@graph']) {
            const recipe = item['@graph'].find((graphItem: any) => isRecipe(graphItem));
            if (recipe) {
              return parseRecipeData(recipe);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse JSON-LD block:', e);
      }
    }
  } catch (e) {
    console.warn('JSON-LD extraction failed:', e);
  }
  
  return result;
}

function isRecipe(item: any): boolean {
  if (!item || !item['@type']) return false;
  const type = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
  return type.includes('Recipe');
}

function parseRecipeData(recipe: any): RecipeData {
  const result: RecipeData = {};

  // Basic info
  result.title = decodeHtmlEntities(recipe.name || recipe.headline || '');
  result.description = decodeHtmlEntities(recipe.description || '');
  
  // Image
  if (recipe.image) {
    if (Array.isArray(recipe.image)) {
      result.image = recipe.image[0]?.url || recipe.image[0];
    } else if (typeof recipe.image === 'object') {
      result.image = recipe.image.url || recipe.image['@id'];
    } else {
      result.image = recipe.image;
    }
  }

  // Times
  result.prepTime = parseDuration(recipe.prepTime);
  result.cookTime = parseDuration(recipe.cookTime);
  result.totalTime = parseDuration(recipe.totalTime);

  // Servings
  if (recipe.recipeYield) {
    const yield_ = Array.isArray(recipe.recipeYield) ? recipe.recipeYield[0] : recipe.recipeYield;
    const match = yield_.toString().match(/\d+/);
    result.servings = match ? parseInt(match[0]) : 4;
  }

  // Tags
  result.tags = [];
  if (recipe.recipeCategory) {
    const categories = Array.isArray(recipe.recipeCategory) ? recipe.recipeCategory : [recipe.recipeCategory];
    result.tags.push(...categories);
  }
  if (recipe.recipeCuisine) {
    const cuisines = Array.isArray(recipe.recipeCuisine) ? recipe.recipeCuisine : [recipe.recipeCuisine];
    result.tags.push(...cuisines);
  }

  // Ingredients
  if (recipe.recipeIngredient) {
    result.ingredients = recipe.recipeIngredient.map((ingredient: string) => {
      const parsed = parseIngredientText(ingredient);
      return {
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit
      };
    });
  }

  // Instructions
  if (recipe.recipeInstructions) {
    result.instructions = recipe.recipeInstructions.map((instruction: any) => {
      let text = '';
      if (typeof instruction === 'string') {
        text = instruction;
      } else if (instruction.text) {
        text = instruction.text;
      } else if (instruction.name) {
        text = instruction.name;
      }
      return { instruction: decodeHtmlEntities(text.trim()) };
    }).filter((inst: any) => inst.instruction);
  }

  return result;
}

function extractMicrodata(html: string): RecipeData {
  const result: RecipeData = {};
  
  try {
    const titleMatch = html.match(/itemprop=["']name["'][^>]*>([^<]+)/i);
    if (titleMatch) result.title = decodeHtmlEntities(titleMatch[1].trim());

    const descMatch = html.match(/itemprop=["']description["'][^>]*content=["']([^"']+)/i);
    if (descMatch) result.description = decodeHtmlEntities(descMatch[1].trim());

    const imageMatch = html.match(/itemprop=["']image["'][^>]*src=["']([^"']+)/i);
    if (imageMatch) result.image = imageMatch[1];
  } catch (e) {
    console.warn('Microdata extraction failed:', e);
  }

  return result;
}

function extractBasicData(html: string): RecipeData {
  const result: RecipeData = {};
  
  try {
    // Try to extract title
    const titleMatches = [
      html.match(/<h1[^>]*>([^<]+)<\/h1>/i),
      html.match(/<title>([^<]+)<\/title>/i),
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)/i)
    ];
    
    for (const match of titleMatches) {
      if (match) {
        result.title = decodeHtmlEntities(match[1].trim().replace(/\s+/g, ' '));
        break;
      }
    }

    // Try to extract description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i);
    if (descMatch) result.description = decodeHtmlEntities(descMatch[1].trim());

    // Try to extract image
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i);
    if (imageMatch) result.image = imageMatch[1];
  } catch (e) {
    console.warn('Basic extraction failed:', e);
  }

  return result;
}

function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  
  try {
    // Parse ISO 8601 duration (PT15M)
    if (duration.startsWith('PT')) {
      const hours = duration.match(/(\d+)H/)?.[1] || '0';
      const minutes = duration.match(/(\d+)M/)?.[1] || '0';
      return parseInt(hours) * 60 + parseInt(minutes);
    }
    
    // Try to extract numbers from text
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  } catch (e) {
    return 0;
  }
}

function parseIngredientText(text: string): { name: string; amount?: number; unit?: string } {
  try {
    // Simple ingredient parsing
    const cleanText = decodeHtmlEntities(text);
    const match = cleanText.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(\w+)?\s+(.+)$/);
    
    if (match) {
      const [, amount, unit, name] = match;
      return {
        amount: parseFloat(amount),
        unit: unit || undefined,
        name: name.trim()
      };
    }
  } catch (e) {
    // Fall back to just the name
  }
  
  return { name: decodeHtmlEntities(text.trim()) };
}

function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  // Common HTML entities
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&deg;': '°',
    '&frac12;': '½',
    '&frac14;': '¼',
    '&frac34;': '¾'
  };
  
  let decoded = text;
  
  // Replace named entities
  for (const [entity, replacement] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), replacement);
  }
  
  // Replace numeric entities (&#123; and &#x1A;)
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decoded;
}