import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { 
  Calendar, 
  Clock, 
  User,
  ArrowRight,
  BookOpen,
  ChefHat,
  Utensils
} from 'lucide-react'

const blogPosts = [
  {
    id: 1,
    title: "10 Essential Tips for Meal Planning Success",
    excerpt: "Master the art of weekly meal planning with these proven strategies that will save you time, money, and reduce food waste.",
    content: `Meal planning doesn't have to be overwhelming. Start with these essential tips:

1. **Start Small**: Begin with planning just 3-4 meals per week
2. **Use What You Have**: Check your pantry before planning new meals
3. **Theme Nights**: Assign themes like "Meatless Monday" or "Taco Tuesday"
4. **Prep Ingredients**: Wash, chop, and store ingredients in advance
5. **Keep a Running List**: Note family favorites for easy planning

With Cookaroo's meal planning features, you can easily organize your weekly meals, duplicate successful plans, and keep track of your family's favorite recipes.`,
    author: "Sarah Johnson",
    date: "2025-01-25",
    readTime: "5 min read",
    category: "Meal Planning",
    image: "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["meal planning", "organization", "time saving", "family meals"]
  },
  {
    id: 2,
    title: "How to Import Recipes from Any Website",
    excerpt: "Learn how to quickly and easily import your favorite recipes from cooking websites into your digital recipe collection.",
    content: `Importing recipes has never been easier with modern recipe management tools:

**Step-by-Step Guide:**
1. Find a recipe you love on any cooking website
2. Copy the URL from your browser
3. Paste it into your recipe manager
4. Watch as ingredients, instructions, and cooking times are automatically extracted

**Best Websites for Recipe Import:**
- AllRecipes.com
- Food Network
- BBC Good Food
- Serious Eats
- Bon Appétit

Cookaroo's smart import feature can extract recipes from hundreds of popular cooking websites, saving you time and ensuring your recipes are properly organized.`,
    author: "Mike Chen",
    date: "2025-01-22",
    readTime: "3 min read",
    category: "Recipe Management",
    image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["recipe import", "digital recipes", "cooking websites", "organization"]
  },
  {
    id: 3,
    title: "Building Your Family Recipe Collection",
    excerpt: "Discover how to preserve family recipes and create a digital cookbook that can be shared across generations.",
    content: `Family recipes are precious memories that deserve to be preserved and shared:

**Preserving Traditional Recipes:**
- Scan handwritten recipe cards
- Interview family members about cooking techniques
- Document the stories behind each recipe
- Include photos of the finished dishes

**Creating a Digital Family Cookbook:**
- Organize recipes by family member or occasion
- Add tags for dietary restrictions and preferences
- Include cooking tips and variations
- Share access with family members

**Tips for Recipe Documentation:**
- Write down exact measurements and techniques
- Note any family modifications or secrets
- Include serving suggestions and side dishes
- Document seasonal or holiday traditions

With collaborative features, your entire family can contribute to and access your shared recipe collection, ensuring these culinary treasures are never lost.`,
    author: "Emma Rodriguez",
    date: "2025-01-20",
    readTime: "7 min read",
    category: "Family Cooking",
    image: "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["family recipes", "recipe preservation", "digital cookbook", "family traditions"]
  },
  {
    id: 4,
    title: "Scaling Recipes: A Complete Guide",
    excerpt: "Master the art of scaling recipes up or down for any number of servings with these essential tips and techniques.",
    content: `Scaling recipes correctly ensures consistent results every time:

**Basic Scaling Rules:**
- Multiply all ingredients by the same factor
- Be careful with spices and seasonings (start with less)
- Consider cooking time adjustments for larger batches
- Account for pan size and cooking vessel changes

**Ingredients That Don't Scale Linearly:**
- Salt and spices (increase gradually)
- Leavening agents (baking powder, yeast)
- Thickeners (flour, cornstarch)
- Alcohol in cooking

**Tools for Accurate Scaling:**
- Digital kitchen scale for precise measurements
- Conversion charts for different units
- Recipe scaling calculators
- Measuring cups and spoons in various sizes

Modern recipe apps can automatically calculate scaled ingredients, taking the guesswork out of cooking for different group sizes.`,
    author: "David Kim",
    date: "2025-01-18",
    readTime: "6 min read",
    category: "Cooking Tips",
    image: "https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["recipe scaling", "cooking techniques", "measurements", "batch cooking"]
  }
]

export const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50" role="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <Logo size="md" alt="Cookaroo logo" />
              <span className="text-xl font-bold text-gray-900">Cookaroo</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link to="/blog" className="text-orange-600 font-medium">
                Blog
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/app">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/app">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-teal-50 py-20" aria-labelledby="blog-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h1 id="blog-heading" className="text-4xl lg:text-5xl font-bold text-gray-900">
              Cookaroo Kitchen Blog
            </h1>
            <p className="text-xl text-gray-600">
              Tips, tricks, and inspiration for better cooking and meal planning
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {blogPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={post.image}
                    alt={`${post.title} - ${post.category} article`}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                  <div className="p-8">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </time>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 hover:text-orange-600 transition-colors">
                      <Link to={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </h2>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">By {post.author}</span>
                      </div>
                      
                      <Link 
                        to={`/blog/${post.id}`}
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
                      {post.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Categories */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {['Meal Planning', 'Recipe Management', 'Family Cooking', 'Cooking Tips'].map((category) => (
                    <Link
                      key={category}
                      to={`/blog/category/${category.toLowerCase().replace(' ', '-')}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-700">{category}</span>
                      <span className="text-sm text-gray-500">
                        {blogPosts.filter(post => post.category === category).length}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['meal planning', 'recipe import', 'family recipes', 'cooking tips', 'organization', 'time saving'].map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog/tag/${tag.replace(' ', '-')}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-800 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
                <p className="text-orange-100 text-sm mb-4">
                  Get the latest cooking tips and recipe management advice delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500"
                  />
                  <Button variant="secondary" className="w-full bg-white text-orange-600 hover:bg-gray-50">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 id="cta-heading" className="text-3xl font-bold text-gray-900">
                Ready to organize your recipes?
              </h2>
              <p className="text-lg text-gray-600">
                Start using Cookaroo today and transform your cooking experience.
              </p>
            </div>
            
            <Link to="/app">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center space-x-3">
                <Logo size="md" alt="Cookaroo footer logo" />
                <span className="text-xl font-bold">Cookaroo</span>
              </Link>
              <p className="text-gray-400">
                Your culinary companion for organized cooking and meal planning.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2">
                <Link to="/features" className="block text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
                <Link to="/app" className="block text-gray-400 hover:text-white transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <div className="space-y-2">
                <Link to="/blog" className="block text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
                <Link to="/about" className="block text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
                <Link to="/contact" className="block text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="block text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Cookaroo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}