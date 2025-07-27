import React from 'react'
import { Link } from 'react-router-dom'
import { useDynamicSeo } from '../../hooks/useDynamicSeo'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { BoltBadge } from '../ui/BoltBadge'
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Clock, 
  Star,
  ArrowRight,
  Check,
  Sparkles,
  Heart,
  Shield,
  Zap
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  const { trackPerformance, generateSocialShare } = useDynamicSeo('home', {
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    referrer: document.referrer
  })

  React.useEffect(() => {
    trackPerformance()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Bolt Badge */}
      <BoltBadge variant="black-circle" size="md" position="top-right" />
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50" role="navigation" aria-label="Main navigation" itemScope itemType="https://schema.org/SiteNavigationElement">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo size="md" alt="Cookaroo logo" />
              <h1 className="text-xl font-bold text-gray-900">Cookaroo</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="View Cookaroo features" itemProp="url">
                Features
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Learn about Cookaroo" itemProp="url">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Contact Cookaroo" itemProp="url">
                Contact
              </Link>
              <Link to="/blog" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Cookaroo cooking blog" itemProp="url">
                Blog
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
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-teal-50" aria-labelledby="hero-heading" itemScope itemType="https://schema.org/SoftwareApplication">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Your culinary companion
                </div>
                <h2 id="hero-heading" className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  <span itemProp="name">Organize recipes,</span>
                  <span className="text-orange-600"> plan meals</span>,
                  cook together
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed" itemProp="description">
                  Transform your kitchen chaos into culinary harmony. Store recipes, plan weekly meals, 
                  and collaborate with family and friends—all in one beautiful, intuitive platform.
                  <span className="sr-only">Cookaroo is a comprehensive recipe management application that helps home cooks organize their favorite recipes, plan weekly meals efficiently, and collaborate with family members on cooking and meal preparation.</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/app">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Cooking Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Features
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Collaborate with family</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <img
                  src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Mediterranean pasta recipe displayed in Cookaroo app interface showing ingredients and cooking time"
                  className="w-full h-64 object-cover rounded-xl"
                  loading="eager"
                />
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900">Mediterranean Pasta Recipe</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>25 minutes cooking time</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>Serves 4 people</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>4.8 star rating</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-3 rounded-full shadow-lg animate-bounce">
                <Heart className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-teal-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 id="features-heading" className="text-3xl lg:text-4xl font-bold text-gray-900">
              Everything you need for culinary success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From recipe organization to meal planning and family collaboration, 
              Cookaroo provides all the tools you need to transform your cooking experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Smart Recipe Organization & Management",
                description: "Import recipes from any website, organize with tags, and search through your collection instantly.",
                color: "bg-blue-100 text-blue-600"
              },
              {
                icon: Calendar,
                title: "Weekly Meal Planning & Scheduling",
                description: "Plan your meals for the week, duplicate successful plans, and never wonder 'what's for dinner?' again.",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: Users,
                title: "Family Recipe Collaboration",
                description: "Share recipe spaces with family members, plan meals together, and build your family cookbook.",
                color: "bg-purple-100 text-purple-600"
              },
              {
                icon: Zap,
                title: "Automatic Recipe Import",
                description: "Paste any recipe URL and watch it automatically extract ingredients, instructions, and cooking times.",
                color: "bg-yellow-100 text-yellow-600"
              },
              {
                icon: Clock,
                title: "Smart Recipe Scaling",
                description: "Automatically scale recipes for any number of servings with intelligent measurement conversions.",
                color: "bg-red-100 text-red-600"
              },
              {
                icon: Shield,
                title: "Secure Data Storage",
                description: "Your recipes and meal plans are securely stored and accessible only to you and those you invite.",
                color: "bg-indigo-100 text-indigo-600"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2" id={`feature-${index}`}>{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white" aria-labelledby="benefits-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 id="benefits-heading" className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Turn cooking chaos into culinary confidence
                </h2>
                <p className="text-xl text-gray-600">
                  Stop losing recipes, forgetting ingredients, and struggling with meal planning. 
                  Cookaroo brings order to your kitchen and joy back to cooking.
                </p>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Save Time Every Week",
                    description: "Spend less time planning and more time enjoying delicious meals with your family."
                  },
                  {
                    title: "Reduce Food Waste",
                    description: "Plan ahead, shop smarter, and use ingredients more efficiently with organized meal planning."
                  },
                  {
                    title: "Discover New Favorites",
                    description: "Easily try new recipes and keep track of what your family loves most."
                  },
                  {
                    title: "Cook Together",
                    description: "Share the joy of cooking by collaborating on recipes and meal plans with loved ones."
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Happy family cooking together in modern kitchen using recipe app"
                  className="w-full h-48 object-cover rounded-xl"
                  loading="lazy"
                />
                <img
                  src="https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Well-organized cooking ingredients and meal prep setup"
                  className="w-full h-48 object-cover rounded-xl mt-8"
                  loading="lazy"
                />
                <img
                  src="https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Weekly meal planning calendar with healthy recipes"
                  className="w-full h-48 object-cover rounded-xl -mt-8"
                  loading="lazy"
                />
                <img
                  src="https://images.pexels.com/photos/1640776/pexels-photo-1640776.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Delicious home-cooked meal prepared using recipe app"
                  className="w-full h-48 object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-teal-500" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 id="cta-heading" className="text-3xl lg:text-4xl font-bold text-white">
                Ready to transform your kitchen?
              </h2>
              <p className="text-xl text-orange-100">
                Join thousands of home cooks who've discovered the joy of organized cooking.
                Start your culinary journey today—completely free.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/app">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-50">
                  Start Cooking Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <p className="text-orange-100 text-sm">
              No credit card required • Free to start • Start in 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo" aria-label="Site footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Logo size="md" alt="Cookaroo footer logo" />
                <span className="text-xl font-bold">Cookaroo</span>
              </div>
              <p className="text-gray-400">
                Your culinary companion for organized cooking and meal planning.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product Features</h3>
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
              <h3 className="font-semibold mb-4">Company Info</h3>
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
              <h3 className="font-semibold mb-4">Legal Information</h3>
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