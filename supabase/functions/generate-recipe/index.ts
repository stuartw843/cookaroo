const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GenerateRecipeRequest {
  collection_id: string
  user_prompt?: string
  space_id: string
}

interface RecipeData {
  title: string
  description?: string
  image?: string
  prepTime?: number
  cookTime?: number
  totalTime?: number
  servings?: number
  difficulty?: string
  tags?: string[]
  ingredients: Array<{
    name: string
    amount?: number
    unit?: string
    preparation?: string
  }>
  instructions: Array<{
    instruction: string
  }>
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { collection_id, user_prompt, space_id }: GenerateRecipeRequest = await req.json();
    
    if (!collection_id || !space_id) {
      return new Response(
        JSON.stringify({ error: "Collection ID and Space ID are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating recipe for collection: ${collection_id}`);

    // Fetch collection details
    const collectionResponse = await fetch(`${supabaseUrl}/rest/v1/ai_recipe_collections?id=eq.${collection_id}&select=*`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
      }
    });

    if (!collectionResponse.ok) {
      throw new Error('Failed to fetch collection details');
    }

    const collections = await collectionResponse.json();
    if (!collections || collections.length === 0) {
      return new Response(
        JSON.stringify({ error: "Collection not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const collection = collections[0];
    console.log(`Found collection: ${collection.name}`);

    // Fetch existing recipes in this collection to avoid duplicates
    const recipesResponse = await fetch(`${supabaseUrl}/rest/v1/recipes?space_id=eq.${space_id}&ai_collection_id=eq.${collection_id}&select=title,description`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
      }
    });

    const existingRecipes = recipesResponse.ok ? await recipesResponse.json() : [];
    console.log(`Found ${existingRecipes.length} existing recipes in collection`);

    // Construct the AI prompt
    const systemPrompt = collection.system_prompt;
    const existingRecipesText = existingRecipes.length > 0 
      ? `\n\nEXISTING RECIPES TO AVOID DUPLICATING:\n${existingRecipes.map((r: any) => `- ${r.title}: ${r.description || 'No description'}`).join('\n')}`
      : '';

    const finalPrompt = `${systemPrompt}

${user_prompt ? `SPECIFIC REQUEST: ${user_prompt}\n` : ''}

Please generate a unique recipe that fits the collection theme. Make sure it's different from any existing recipes.${existingRecipesText}

Return ONLY a valid JSON object with this exact structure:

{
  "title": "Recipe name",
  "description": "Brief description",
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "difficulty": "medium",
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1,
      "unit": "cup",
      "preparation": "chopped"
    }
  ],
  "instructions": [
    {
      "instruction": "step description"
    }
  ]
}

Ensure the recipe is practical, uses realistic ingredients and measurements, and provides clear step-by-step instructions. Return ONLY the JSON object, no additional text.`;

    console.log('Calling OpenAI API...');

    // Call OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: finalPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.8
      })
    });

    clearTimeout(timeoutId);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content received from OpenAI');
      return new Response(
        JSON.stringify({ error: "No response from AI service" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('OpenAI response received, parsing...');

    // Parse the JSON response
    let recipeData: RecipeData;
    try {
      // Clean the content in case there's extra formatting
      const cleanContent = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
      recipeData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(
        JSON.stringify({ error: "Failed to generate valid recipe" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate and clean the data
    const cleanedData: RecipeData = {
      title: typeof recipeData.title === 'string' ? recipeData.title.trim() : "AI Generated Recipe",
      description: typeof recipeData.description === 'string' ? recipeData.description.trim() : "",
      servings: typeof recipeData.servings === 'number' && recipeData.servings > 0 ? recipeData.servings : 4,
      prepTime: typeof recipeData.prepTime === 'number' && recipeData.prepTime >= 0 ? recipeData.prepTime : 0,
      cookTime: typeof recipeData.cookTime === 'number' && recipeData.cookTime >= 0 ? recipeData.cookTime : 0,
      difficulty: typeof recipeData.difficulty === 'string' ? recipeData.difficulty : "medium",
      tags: Array.isArray(recipeData.tags) ? recipeData.tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim()) : [],
      ingredients: Array.isArray(recipeData.ingredients) 
        ? recipeData.ingredients
            .filter(ing => ing && typeof ing.name === 'string' && ing.name.trim())
            .map(ing => ({
              name: ing.name.trim(),
              amount: typeof ing.amount === 'number' && ing.amount > 0 ? ing.amount : undefined,
              unit: typeof ing.unit === 'string' && ing.unit.trim() ? ing.unit.trim() : undefined,
              preparation: typeof ing.preparation === 'string' && ing.preparation.trim() ? ing.preparation.trim() : undefined
            }))
        : [],
      instructions: Array.isArray(recipeData.instructions)
        ? recipeData.instructions
            .filter(inst => inst && typeof inst.instruction === 'string' && inst.instruction.trim())
            .map(inst => ({
              instruction: inst.instruction.trim()
            }))
        : []
    };

    // Ensure we have at least some data
    if (!cleanedData.ingredients.length && !cleanedData.instructions.length) {
      return new Response(
        JSON.stringify({ error: "Generated recipe lacks sufficient detail" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully generated recipe: ${cleanedData.title}`);

    return new Response(
      JSON.stringify({
        ...cleanedData,
        ai_collection_id: collection_id,
        generation_prompt: user_prompt || null,
        is_ai_generated: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Recipe generation error:', error);
    
    let errorMessage = "Failed to generate recipe";
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = "Request timed out";
      statusCode = 408;
    } else if (error.message?.includes('fetch')) {
      errorMessage = "Network error occurred";
      statusCode = 503;
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});