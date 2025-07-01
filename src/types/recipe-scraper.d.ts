declare module '@brandonrjguth/recipe-scraper' {
  interface RecipeTime {
    prep?: string;
    cook?: string;
    active?: string;
    inactive?: string;
    ready?: string;
    total?: string;
  }

  interface ScrapedRecipe {
    name: string;
    ingredients: string[];
    instructions: string[];
    tags?: string[];
    servings?: string;
    image?: string;
    time?: RecipeTime;
  }

  function recipeScraper(url: string): Promise<ScrapedRecipe>;
  export = recipeScraper;
}
