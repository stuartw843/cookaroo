import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { Input } from '../ui/Input'
import { 
  Mail, 
  MessageSquare, 
  Send,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Message sent! We\'ll get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

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
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-orange-600 font-medium">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Get in touch
            </h1>
            <p className="text-xl text-gray-600">
              Have questions about Cookaroo? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
                    <p className="text-gray-600">
                      Fill out the form below and we'll get back to you within 24 hours.
                    </p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                      />
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                      />
                    </div>
                    
                    <Input
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="What's this about?"
                    />
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="block w-full rounded-lg border-gray-300 shadow-sm transition-colors duration-200 focus:border-orange-500 focus:ring-orange-500 focus:ring-1 placeholder:text-gray-400"
                        placeholder="Tell us more about your question or feedback..."
                      />
                    </div>
                    
                    <Button type="submit" loading={loading} className="w-full md:w-auto">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </div>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                    <p className="text-gray-600">
                      We're here to help with any questions about Cookaroo.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Email</h4>
                        <p className="text-gray-600">hello@cookaroo.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Response Time</h4>
                        <p className="text-gray-600">Within 24 hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Support</h4>
                        <p className="text-gray-600">Monday - Friday, 9am - 5pm EST</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl p-6 text-white">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
                  <p className="text-orange-100">
                    Before reaching out, you might find your answer in our FAQ section.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Is Cookaroo really free?</h4>
                      <p className="text-orange-100 text-sm">Yes! All core features are free forever.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Can I share recipes with family?</h4>
                      <p className="text-orange-100 text-sm">Absolutely! Create shared spaces for family collaboration.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">How do I import recipes?</h4>
                      <p className="text-orange-100 text-sm">Just paste any recipe URL and we'll import it automatically.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">
                Ready to start cooking?
              </h2>
              <p className="text-lg text-gray-600">
                Don't wait for an answer—you can start using Cookaroo right now. 
                It's free and takes less than a minute to get started.
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
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center space-x-3">
                <Logo size="md" />
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
