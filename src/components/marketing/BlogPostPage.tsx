import React from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { 
  Calendar, 
  Clock, 
  User,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

const blogPosts = [
  {
    id: 1,
    title: "10 Essential Tips for Meal Planning Success",
    excerpt: "Master the art of weekly meal planning with these proven strategies that will save you time, money, and reduce food waste.",
    content: `# 10 Essential Tips for Meal Planning Success

Meal planning doesn't have to be overwhelming. Here are the essential tips to get you started:

## 1. Start Small
Begin with planning just 3-4 meals per week instead of trying to plan everything at once.

## 2. Use What You Have
Check your pantry and fridge before planning new meals to reduce waste and save money.

## 3. Theme Nights
Assign themes like "Meatless Monday" or "Taco Tuesday" to make planning easier.

## 4. Prep Ingredients
Wash, chop, and store ingredients in advance to save time during busy weeknights.

## 5. Keep a Running List
Note family favorites for easy planning in future weeks.

With Cookaroo's meal planning features, you can easily organize your weekly meals and keep track of your family's favorite recipes.`,
    author: "Sarah Johnson",
    date: "2025-01-25",
    readTime: "5 min read",
    category: "Meal Planning"
  },
  {
    id: 2,
    title: "How to Import Recipes from Any Website",
    excerpt: "Learn how to quickly and easily import your favorite recipes from cooking websites into your digital recipe collection.",
    content: `# How to Import Recipes from Any Website

Importing recipes has never been easier with modern recipe management tools.

## Step-by-Step Guide
1. Find a recipe you love on any cooking website
2. Copy the URL from your browser
3. Paste it into your recipe manager
4. Watch as ingredients and instructions are automatically extracted

## Best Websites for Recipe Import
- AllRecipes.com
- Food Network
- BBC Good Food
- Serious Eats
- Bon Appétit

Cookaroo's smart import feature can extract recipes from hundreds of popular cooking websites, saving you time and ensuring your recipes are properly organized.`,
    author: "Mike Chen",
    date: "2025-01-22",
    readTime: "3 min read",
    category: "Recipe Management"
  },
  {
    id: 3,
    title: "Building Your Family Recipe Collection",
    excerpt: "Discover how to preserve family recipes and create a digital cookbook that can be shared across generations.",
    content: `# Building Your Family Recipe Collection

Family recipes are precious memories that deserve to be preserved and shared.

## Preserving Traditional Recipes
- Scan handwritten recipe cards
- Interview family members about cooking techniques
- Document the stories behind each recipe
- Include photos of the finished dishes

## Creating a Digital Family Cookbook
- Organize recipes by family member or occasion
- Add tags for dietary restrictions and preferences
- Include cooking tips and variations
- Share access with family members

With collaborative features, your entire family can contribute to and access your shared recipe collection.`,
    author: "Emma Rodriguez",
    date: "2025-01-20",
    readTime: "7 min read",
    category: "Family Cooking"
  },
  {
    id: 4,
    title: "Scaling Recipes: A Complete Guide",
    excerpt: "Master the art of scaling recipes up or down for any number of servings with these essential tips and techniques.",
    content: `# Scaling Recipes: A Complete Guide

Scaling recipes correctly ensures consistent results every time.

## Basic Scaling Rules
- Multiply all ingredients by the same factor
- Be careful with spices and seasonings (start with less)
- Consider cooking time adjustments for larger batches
- Account for pan size and cooking vessel changes

## Ingredients That Don't Scale Linearly
- Salt and spices (increase gradually)
- Leavening agents (baking powder, yeast)
- Thickeners (flour, cornstarch)
- Alcohol in cooking

Modern recipe apps can automatically calculate scaled ingredients, taking the guesswork out of cooking for different group sizes.`,
    author: "David Kim",
    date: "2025-01-18",
    readTime: "6 min read",
    category: "Cooking Tips"
  }
]

export const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const post = blogPosts.find(p => p.id === parseInt(id || '1'))
  
  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentIndex = blogPosts.findIndex(p => p.id === post.id)
  const previousPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <Logo size="md" />
              <span className="text-xl font-bold text-gray-900">Cookaroo</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/blog">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Button>
              </Link>
              <Link to="/app">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium text-sm">
              {post.category}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>By {post.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </time>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
          {previousPost ? (
            <Link to={`/blog/${previousPost.id}`} className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: {previousPost.title}</span>
            </Link>
          ) : <div />}
          
          {nextPost ? (
            <Link to={`/blog/${nextPost.id}`} className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
              <span>Next: {nextPost.title}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : <div />}
        </div>
      </article>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to organize your recipes?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start using Cookaroo today and transform your cooking experience.
          </p>
          <Link to="/app">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}