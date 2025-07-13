import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Logo } from './components/ui/Logo'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SpacesProvider } from './contexts/SpacesContext'

// Marketing pages
import { LandingPage } from './components/marketing/LandingPage'
import { FeaturesPage } from './components/marketing/FeaturesPage'
import { AboutPage } from './components/marketing/AboutPage'
import { ContactPage } from './components/marketing/ContactPage'
import { PrivacyPage } from './components/marketing/PrivacyPage'
import { TermsPage } from './components/marketing/TermsPage'
import { BlogPage } from './components/marketing/BlogPage'

// App components
import { AuthForm } from './components/auth/AuthForm'
import { Header } from './components/layout/Header'
import { BottomNavigation } from './components/layout/BottomNavigation'
import { MealPlannerView } from './components/mealplanner/MealPlannerView'
import { SettingsPage } from './components/settings/SettingsPage'
import { SpaceManagement } from './components/collaboration/SpaceManagement'
import { JoinSpace } from './components/collaboration/JoinSpace'
import { RecipeCard } from './components/recipes/RecipeCard'
import { AddRecipeModal } from './components/recipes/AddRecipeModal'
import { AddRecipePage } from './components/recipes/AddRecipePage'
import { RecipeDetail } from './components/recipes/RecipeDetail'
import { Input } from './components/ui/Input'
import { Button } from './components/ui/Button'
import { useRecipes } from './hooks/useRecipes'
import { useSpacesContext } from './contexts/SpacesContext'
import { Search, Filter, Grid, List, Plus, Settings, LogOut } from 'lucide-react'

type ViewMode = 'recipes' | 'mealplanner' | 'settings'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<ViewMode>('recipes')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [editingRecipe, setEditingRecipe] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [timeFilter, setTimeFilter] = useState<string>('')
  const [showSpaceManagement, setShowSpaceManagement] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const { recipes, loading: recipesLoading, error, addRecipe, updateRecipe, deleteRecipe } = useRecipes()
  const { currentSpace, spaces, loading: spacesLoading } = useSpacesContext()
  const { user, signOut } = useAuth()
  
  // Handle view changes with smooth transitions
  const handleViewChange = (newView: ViewMode) => {
    if (newView === currentView) return
    
    setIsTransitioning(true)
    
    // Start fade out
    setTimeout(() => {
      setCurrentView(newView)
      // Start fade in
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 150)
  }
  
  // Show loading state while spaces are being fetched
  if (spacesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          currentView={currentView}
          onViewChange={handleViewChange}
          onManageSpace={() => setShowSpaceManagement(true)}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-600">Loading your recipe spaces...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get all unique tags
  const allTags = Array.from(
    new Set(recipes.flatMap(recipe => recipe.tags || []))
  ).sort()
  
  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.every(tag => recipe.tags?.includes(tag))
    
    const matchesTime = (() => {
      if (!timeFilter) return true
      
      const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
      
      switch (timeFilter) {
        case 'quick': return totalTime <= 30
        case 'medium': return totalTime > 30 && totalTime <= 60
        case 'long': return totalTime > 60
        case 'any': return totalTime > 0
        default: return true
      }
    })()
    
    return matchesSearch && matchesTags && matchesTime
  })
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }
  
  if (recipesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          currentView={currentView}
          onViewChange={handleViewChange}
          onManageSpace={() => setShowSpaceManagement(true)}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-600">Loading recipes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Show space creation prompt if no spaces exist
  if (!currentSpace && spaces.length === 0 && !spacesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          currentView={currentView}
          onViewChange={handleViewChange}
          onManageSpace={() => setShowSpaceManagement(true)}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Cookaroo!
            </h3>
            <p className="text-gray-600 mb-4">
              To get started, you need to create your first recipe space.
            </p>
            <Button onClick={() => setShowSpaceManagement(true)}>
              Create Your First Space
            </Button>
          </div>
        </div>
        
        {/* Space Management Modal */}
        <SpaceManagement
          isOpen={showSpaceManagement}
          onClose={() => setShowSpaceManagement(false)}
        />
      </div>
    )
  }

  // Render the current view content
  const renderCurrentView = () => {
    switch (currentView) {
      case 'settings':
        return <SettingsPage />
      case 'mealplanner':
        return <MealPlannerView />
      default:
        return (
          <>
            {/* Recipes Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Recipes</h1>
                <p className="text-gray-600 mt-1">Organize and manage your favorite recipes</p>
              </div>
              <Button 
                onClick={() => navigate('/app/add-recipe')} 
                className="flex items-center justify-center space-x-2 w-full sm:w-auto min-h-[48px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Recipe</span>
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-8">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                <div className="flex-1">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-base"
                  >
                    <option value="">All Times</option>
                    <option value="quick">Quick (≤30 min)</option>
                    <option value="medium">Medium (30-60 min)</option>
                    <option value="long">Long ({'>'} 60 min)</option>
                    <option value="any">Has Time Info</option>
                  </select>
                </div>
                
                {/* View Mode Buttons */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  >
                    <Grid className="w-4 h-4" />
                    <span className="ml-2 sm:hidden">Grid</span>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="min-h-[44px] min-w-[44px] flex-1 sm:flex-none"
                  >
                    <List className="w-4 h-4" />
                    <span className="ml-2 sm:hidden">List</span>
                  </Button>
                </div>
              </div>
              
              {/* Tag Filters */}
              {allTags.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-2 rounded-full text-sm transition-colors min-h-[36px] ${
                          selectedTags.includes(tag)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Recipe Count and Active Filters */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Recipes ({filteredRecipes.length})
                </h2>
                {(searchQuery || selectedTags.length > 0 || timeFilter) && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-sm text-gray-500">Active filters:</span>
                    {searchQuery && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Search: "{searchQuery}"
                      </span>
                    )}
                    {timeFilter && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Time: {timeFilter === 'quick' ? '≤30 min' : timeFilter === 'medium' ? '30-60 min' : timeFilter === 'long' ? '>60 min' : 'Has time info'}
                      </span>
                    )}
                    {selectedTags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        {tag}
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedTags([])
                        setTimeFilter('')
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recipes Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {recipes.length === 0 ? 'No recipes yet' : 'No recipes found'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {recipes.length === 0 
                    ? "Start building your recipe collection by adding your first recipe!"
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {recipes.length === 0 && (
                  <Button 
                    onClick={() => navigate('/app/add-recipe')}
                    className="min-h-[48px] px-6"
                  >
                    Add Your First Recipe
                  </Button>
                )}
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                  : 'space-y-3 sm:space-y-4'
              }>
                {filteredRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={setSelectedRecipe}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </>
        )
    }
  }
  
  const handleEditRecipe = (recipe: any) => {
    setEditingRecipe(recipe)
    setSelectedRecipe(null) // Close detail modal
    setShowAddModal(true) // Open edit modal
  }
  
  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setEditingRecipe(null)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView}
        onViewChange={handleViewChange}
        onManageSpace={() => setShowSpaceManagement(true)}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Main Content with Smooth Transitions */}
        <div 
          className={`transition-all duration-300 ease-in-out ${
            isTransitioning 
              ? 'opacity-0 transform translate-y-4' 
              : 'opacity-100 transform translate-y-0'
          }`}
        >
          {renderCurrentView()}
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
        onUserMenuToggle={() => setUserMenuOpen(!userMenuOpen)}
        userMenuOpen={userMenuOpen}
      />
      
      {/* Mobile User Menu */}
      {userMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
            onClick={() => setUserMenuOpen(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-40 md:hidden animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-4">
              <div className="text-center pb-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Signed in as</p>
                <p className="text-sm text-gray-600 truncate mt-1">{user?.email}</p>
              </div>
              
              <div className="pt-3 space-y-2">
                <button
                  onClick={() => {
                    setShowSpaceManagement(true)
                    setUserMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-3 transition-colors duration-150"
                >
                  <Settings className="w-4 h-4" />
                  <span>Manage Spaces</span>
                </button>
                
                <button
                  onClick={() => {
                    signOut()
                    setUserMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-3 transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Modals */}
      <AddRecipeModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onAdd={addRecipe}
        recipe={editingRecipe}
        onUpdate={updateRecipe}
      />
      
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={handleEditRecipe}
          onDelete={deleteRecipe}
        />
      )}
      
      {/* Space Management Modal */}
      <SpaceManagement
        isOpen={showSpaceManagement}
        onClose={() => setShowSpaceManagement(false)}
      />
    </div>
  )
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, initialLoad } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (!user) {
    // Store the current location to redirect back after login
    const redirectTo = location.pathname !== '/' ? location.pathname : '/app'
    return <Navigate to="/auth" state={{ from: redirectTo }} replace />
  }
  
  return <>{children}</>
}

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Logo size="lg" className="mx-auto" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 text-sm">Loading Cookaroo...</p>
      </div>
    </div>
  )
}

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const { user, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (user) {
    // Redirect to the intended destination or default to /app
    const from = (location.state as any)?.from || '/app'
    return <Navigate to={from} replace />
  }
  
  return (
    <AuthForm 
      mode={mode} 
      onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
    />
  )
}

// Component to handle root redirect based on auth status
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  // Redirect authenticated users to app, others to landing page
  return <Navigate to={user ? "/app" : "/"} replace />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Marketing pages */}
            {/* Root route - redirect based on auth status */}
            <Route path="/home" element={<LandingPage />} />
            
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            
            {/* Auth page */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* App routes (protected) */}
            <Route path="/app" element={
              <ProtectedRoute>
                <SpacesProvider>
                  <Dashboard />
                </SpacesProvider>
              </ProtectedRoute>
            } />
            
            {/* Add Recipe page */}
            <Route path="/app/add-recipe" element={
              <ProtectedRoute>
                <SpacesProvider>
                  <AddRecipePage />
                </SpacesProvider>
              </ProtectedRoute>
            } />
            
            {/* Join space route */}
            <Route path="/join/:inviteCode" element={
              <SpacesProvider>
                <JoinSpace />
              </SpacesProvider>
            } />
            
            {/* Catch all - redirect to appropriate place */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
