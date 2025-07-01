import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { FileText, Scale, Shield, AlertTriangle } from 'lucide-react'

export const TermsPage: React.FC = () => {
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

      {/* Header */}
      <section className="bg-gradient-to-br from-orange-50 to-teal-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-lg text-gray-600">
              Last updated: January 1, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-green-900 mb-2">Simple Terms</h2>
              <p className="text-green-800 mb-0">
                We've written these terms to be as clear and fair as possible. 
                In short: use Cookaroo responsibly, respect others, and we'll provide you with a great service.
              </p>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600">
                  By accessing and using Cookaroo, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <div className="flex items-center space-x-3 mb-4">
                  <Scale className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-0">2. Use License</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Permission is granted to temporarily use Cookaroo for personal, non-commercial transitory viewing only. 
                    This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Modify or copy the materials</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Use the materials for any commercial purpose or for any public display</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Attempt to reverse engineer any software contained on Cookaroo</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Remove any copyright or other proprietary notations from the materials</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                    You are responsible for safeguarding the password and for all activities that occur under your account.
                  </p>
                  <p className="text-gray-600">
                    You agree not to disclose your password to any third party and to take sole responsibility for any activities 
                    or actions under your account, whether or not you have authorized such activities or actions.
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-0">4. User Content</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    You retain ownership of any content you submit, post, or display on or through Cookaroo. 
                    By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                    copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such content 
                    solely for the purpose of providing the Cookaroo service.
                  </p>
                  <p className="text-gray-600">
                    You are responsible for the content you submit and must ensure you have the right to use any recipes, 
                    images, or other materials you add to Cookaroo.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Uses</h2>
                <div className="space-y-4">
                  <p className="text-gray-600">You may not use Cookaroo:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>For any unlawful purpose or to solicit others to perform unlawful acts</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>To submit false or misleading information</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Availability</h2>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    We strive to provide reliable service, but we cannot guarantee that Cookaroo will be available 
                    at all times. We may experience hardware, software, or other problems or need to perform maintenance 
                    related to the service, resulting in interruptions, delays, or errors.
                  </p>
                  <p className="text-gray-600">
                    We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify 
                    Cookaroo at any time or for any reason without notice to you.
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-0">7. Disclaimer</h2>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    The information on Cookaroo is provided on an 'as is' basis. To the fullest extent permitted by law, 
                    this Company excludes all representations, warranties, conditions and terms whether express or implied, 
                    statutory or otherwise.
                  </p>
                  <p className="text-gray-600">
                    Cookaroo does not warrant that the service will be uninterrupted, timely, secure, or error-free.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitations</h2>
                <p className="text-gray-600">
                  In no event shall Cookaroo or its suppliers be liable for any damages (including, without limitation, 
                  damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                  to use Cookaroo, even if Cookaroo or a Cookaroo authorized representative has been notified orally or 
                  in writing of the possibility of such damage.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Accuracy of Materials</h2>
                <p className="text-gray-600">
                  The materials appearing on Cookaroo could include technical, typographical, or photographic errors. 
                  Cookaroo does not warrant that any of the materials on its website are accurate, complete, or current. 
                  Cookaroo may make changes to the materials contained on its website at any time without notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
                <p className="text-gray-600">
                  These terms and conditions are governed by and construed in accordance with the laws of the United States 
                  and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
                <p className="text-gray-600">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
                <p className="text-gray-600">
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@cookaroo.com" className="text-orange-600 hover:text-orange-700">
                    legal@cookaroo.com
                  </a>.
                </p>
              </section>
            </div>
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
