import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { Logo } from '../ui/Logo'

interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
  name?: string
}

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode }) => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signIn, signUp } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<AuthFormData>()
  
  const password = watch('password')
  
  const onSubmit = async (data: AuthFormData) => {
    setLoading(true)
    
    try {
      if (mode === 'signup') {
        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }
        const { error } = await signUp(data.email, data.password, data.name)
        if (error) throw error
        toast.success('Account created successfully! Welcome to Cookaroo!')
      } else {
        const { error } = await signIn(data.email, data.password)
        if (error) throw error
        toast.success('Welcome back!')
      }
      
      // Handle redirect after successful authentication
      const redirectTo = (location.state as any)?.from || '/app'
      navigate(redirectTo, { replace: true })
      
      reset()
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please check your email and click the confirmation link before signing in.')
      } else {
        toast.error(error.message || 'An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-50 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-orange-75 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-md">
        <Card className="backdrop-blur-sm bg-white/95 border border-gray-200 shadow-xl">
          <CardHeader className="text-center pb-8 pt-8">
            <Logo size="xl" className="mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900">
              Cookaroo
            </h1>
            <p className="text-gray-600 text-sm mt-2 mb-4">Your culinary companion</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {mode === 'signin' ? 'Welcome back!' : 'Join the community'}
            </h2>
            <p className="text-gray-600 text-sm">
              {mode === 'signin' 
                ? 'Sign in to access your recipes and meal plans' 
                : 'Create your account and start organizing your recipes'
              }
            </p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {mode === 'signup' && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    tabIndex={1}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    {...register('name', {
                      required: mode === 'signup' ? 'Name is required' : false,
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Email address"
                  tabIndex={mode === 'signup' ? 2 : 1}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  tabIndex={mode === 'signup' ? 3 : 2}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              
              {mode === 'signup' && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    tabIndex={4}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    {...register('confirmPassword', {
                      required: mode === 'signup' ? 'Please confirm your password' : false,
                      validate: value => value === password || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Logo size="sm" className="mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">What you'll get:</p>
                      <ul className="space-y-1 text-orange-700">
                        <li>• AI recipe extraction</li>
                        <li>• Smart meal planning tools</li>
                        <li>• Family collaboration features</li>
                        <li>• Recipe import from any website</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                type="submit"
                tabIndex={mode === 'signup' ? 5 : 3}
                className="w-full py-3 text-base font-semibold bg-orange-500 hover:bg-orange-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </span>
                )}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={onToggleMode}
                className="mt-4 w-full text-center py-2 px-4 text-orange-600 hover:text-orange-700 font-medium hover:bg-orange-50 rounded-xl transition-all duration-200"
              >
                {mode === 'signin' 
                  ? 'Create a new account' 
                  : 'Sign in to existing account'
                }
              </button>
            </div>

            {mode === 'signin' && (
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By signing in, you agree to our{' '}
                  <a href="/terms" className="text-orange-600 hover:text-orange-700 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            )}

            {mode === 'signup' && (
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our{' '}
                  <a href="/terms" className="text-orange-600 hover:text-orange-700 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional info for new users */}
        {mode === 'signup' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Join thousands of home cooks who organize their recipes with Cookaroo
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>AI recipe extraction</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>No credit card</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Instant access</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
