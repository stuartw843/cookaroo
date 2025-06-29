import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { 
  ChefHat, 
  BookOpen, 
  Calendar, 
  Users, 
  Zap, 
  Clock, 
  Shield,
  Search,
  Tag,
  Copy,
  Globe,
  Smartphone,
  ArrowRight
} from 'lucide-react'

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">Cookaroo</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-orange-600 font-medium">
                Features
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
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
      <section className="bg-gradient-to-br from-orange-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Powerful features for passionate cooks
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover all the tools and features that make Cookaroo the perfect companion 
              for organizing recipes, planning meals, and cooking with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {/* Recipe Organization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">Smart Recipe Organization</h2>
                  <p className="text-lg text-gray-600">
                    Keep all your recipes in one place with intelligent organization tools that make 
                    finding the perfect dish effortless.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Search className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Instant Search</h3>
                      <p className="text-gray-600">Find any recipe by name, ingredient, or cooking time</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Tag className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Smart Tagging</h3>
                      <p className="text-gray-600">Organize with custom tags like "quick dinner" or "vegetarian"</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Globe className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Import from Anywhere</h3>
                      <p className="text-gray-600">Paste any recipe URL and watch it import automatically</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Recipe organization interface"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
            </div>

            {/* Meal Planning */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 lg:order-1">
                <img
                  src="https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Meal planning calendar"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
              <div className="space-y-6 order-1 lg:order-2">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">Weekly Meal Planning</h2>
                  <p className="text-lg text-gray-600">
                    Plan your meals for the entire week with drag-and-drop simplicity. 
                    Never wonder "what's for dinner?" again.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Visual Planning</h3>
                      <p className="text-gray-600">See your entire week at a glance with beautiful calendar view</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Copy className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Duplicate Successful Weeks</h3>
                      <p className="text-gray-600">Copy meal plans that worked well to save time</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Smartphone className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Mobile Friendly</h3>
                      <p className="text-gray-600">Plan and check your meals from anywhere</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collaboration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">Family Collaboration</h2>
                  <p className="text-lg text-gray-600">
                    Share recipe spaces with family members and build your family cookbook together. 
                    Everyone can contribute their favorite recipes.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Shared Spaces</h3>
                      <p className="text-gray-600">Create family recipe collections everyone can access</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Secure Invites</h3>
                      <p className="text-gray-600">Invite family with secure links that expire automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <BookOpen className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Family Cookbook</h3>
                      <p className="text-gray-600">Build a collection of family favorites and traditions</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Family cooking together"
                  className="w-full rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Even more powerful features</h2>
            <p className="text-lg text-gray-600">
              Discover additional tools that make cooking and meal planning a joy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Recipe Import Magic",
                description: "Paste any recipe URL and watch ingredients, instructions, and cooking times import automatically.",
                color: "bg-yellow-100 text-yellow-600"
              },
              {
                icon: Clock,
                title: "Smart Scaling",
                description: "Automatically scale recipes for any number of servings with intelligent measurement conversions.",
                color: "bg-red-100 text-red-600"
              },
              {
                icon: Search,
                title: "Advanced Search",
                description: "Filter recipes by cooking time, difficulty, dietary restrictions, and available ingredients.",
                color: "bg-blue-100 text-blue-600"
              },
              {
                icon: Copy,
                title: "Recipe Sharing",
                description: "Copy recipes to your clipboard or share them with friends and family instantly.",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: Tag,
                title: "Custom Categories",
                description: "Organize recipes with custom tags and categories that make sense for your cooking style.",
                color: "bg-purple-100 text-purple-600"
              },
              {
                icon: Shield,
                title: "Data Security",
                description: "Your recipes and meal plans are securely stored and backed up automatically.",
                color: "bg-indigo-100 text-indigo-600"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Ready to experience these features?
              </h2>
              <p className="text-xl text-orange-100">
                Start organizing your recipes and planning meals today. 
                All features are free to use—no credit card required.
              </p>
            </div>
            
            <Link to="/app">
              <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-50">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                </div>
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
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2">
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