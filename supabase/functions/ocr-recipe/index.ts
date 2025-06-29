const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface OCRRecipeData {
  title?: string
  description?: string
  ingredients?: Array<{
    name: string
    amount?: number
    unit?: string
  }>
  instructions?: Array<{
    instruction: string
  }>
  servings?: number
  prepTime?: number
  cookTime?: number
  error?: string
}

// Helper function to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // Process in chunks to avoid stack overflow
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
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

    // Parse form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "No image file provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: "File must be an image" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate file size (10MB limit)
    if (imageFile.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Image file too large (max 10MB)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing image: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`);

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: "OCR service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert image to base64 safely
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = arrayBufferToBase64(arrayBuffer);

    console.log('Image converted to base64, calling OpenAI API...');

    // Call OpenAI Vision API with timeout
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
            content: [
              {
                type: "text",
                text: `Please extract recipe information from this image. Return ONLY a valid JSON object with this exact structure:

{
  "title": "Recipe name",
  "description": "Brief description",
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1,
      "unit": "cup"
    }
  ],
  "instructions": [
    {
      "instruction": "step description"
    }
  ]
}

If you cannot read the recipe clearly or this is not a recipe image, return:
{
  "error": "Could not extract recipe from image"
}

Return ONLY the JSON object, no additional text or formatting.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.type};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
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
    let recipeData: OCRRecipeData;
    try {
      // Clean the content in case there's extra formatting
      const cleanContent = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
      recipeData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(
        JSON.stringify({ error: "Could not extract recipe from image" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if OpenAI returned an error
    if (recipeData.error) {
      return new Response(
        JSON.stringify({ error: recipeData.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate and clean the data
    const cleanedData: OCRRecipeData = {
      title: typeof recipeData.title === 'string' ? recipeData.title.trim() : "Extracted Recipe",
      description: typeof recipeData.description === 'string' ? recipeData.description.trim() : "",
      servings: typeof recipeData.servings === 'number' && recipeData.servings > 0 ? recipeData.servings : 4,
      prepTime: typeof recipeData.prepTime === 'number' && recipeData.prepTime >= 0 ? recipeData.prepTime : 0,
      cookTime: typeof recipeData.cookTime === 'number' && recipeData.cookTime >= 0 ? recipeData.cookTime : 0,
      ingredients: Array.isArray(recipeData.ingredients) 
        ? recipeData.ingredients
            .filter(ing => ing && typeof ing.name === 'string' && ing.name.trim())
            .map(ing => ({
              name: ing.name.trim(),
              amount: typeof ing.amount === 'number' && ing.amount > 0 ? ing.amount : undefined,
              unit: typeof ing.unit === 'string' && ing.unit.trim() ? ing.unit.trim() : undefined
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
        JSON.stringify({ error: "Could not extract recipe information from image" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully extracted recipe: ${cleanedData.title}`);

    return new Response(
      JSON.stringify(cleanedData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Determine error type and provide appropriate message
    let errorMessage = "Failed to process recipe image";
    let statusCode = 500;
    
    if (error.name === 'AbortError') {
      errorMessage = "Request timed out";
      statusCode = 408;
    } else if (error.message?.includes('fetch')) {
      errorMessage = "Network error occurred";
      statusCode = 503;
    } else if (error.message?.includes('parse')) {
      errorMessage = "Could not extract recipe from image";
      statusCode = 400;
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