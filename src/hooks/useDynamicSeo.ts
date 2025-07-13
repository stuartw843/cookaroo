import { useEffect, useState } from 'react'
import { DynamicSeoOptimizer } from '../utils/dynamicSeo'
import { DynamicContentOptimizer } from '../utils/contentOptimizer'
import { SocialSignalGenerator } from '../utils/socialSignalGenerator'

interface SeoState {
  title: string
  description: string
  keywords: string[]
  structuredData: any
  socialContent: any[]
  isOptimizing: boolean
}

export const useDynamicSeo = (page: string, userContext?: any) => {
  const [seoState, setSeoState] = useState<SeoState>({
    title: '',
    description: '',
    keywords: [],
    structuredData: {},
    socialContent: [],
    isOptimizing: false
  })

  const seoOptimizer = new DynamicSeoOptimizer()
  const contentOptimizer = new DynamicContentOptimizer()
  const socialGenerator = new SocialSignalGenerator()

  useEffect(() => {
    optimizePage()
  }, [page, userContext])

  const optimizePage = async () => {
    setSeoState(prev => ({ ...prev, isOptimizing: true }))

    try {
      // Generate dynamic SEO configuration
      const seoConfig = seoOptimizer.generateDynamicMeta(page, userContext)
      
      // Generate social content for sharing
      const socialContent = socialGenerator.createTrafficDrivingPosts('recipe-tips')
      
      // Update page meta tags
      updateMetaTags(seoConfig)
      
      setSeoState({
        title: seoConfig.title,
        description: seoConfig.description,
        keywords: seoConfig.keywords,
        structuredData: seoConfig.structuredData,
        socialContent,
        isOptimizing: false
      })

    } catch (error) {
      console.error('SEO optimization failed:', error)
      setSeoState(prev => ({ ...prev, isOptimizing: false }))
    }
  }

  const updateMetaTags = (config: any) => {
    // Update document title
    document.title = config.title

    // Update meta description
    updateMetaTag('description', config.description)
    
    // Update keywords
    updateMetaTag('keywords', config.keywords.join(', '))
    
    // Update Open Graph tags
    updateMetaTag('og:title', config.title, 'property')
    updateMetaTag('og:description', config.description, 'property')
    
    // Update Twitter tags
    updateMetaTag('twitter:title', config.title)
    updateMetaTag('twitter:description', config.description)
    
    // Update canonical URL
    updateCanonicalUrl(config.canonicalUrl)
    
    // Update structured data
    updateStructuredData(config.structuredData)
  }

  const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`)
    
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, name)
      document.head.appendChild(element)
    }
    
    element.setAttribute('content', content)
  }

  const updateCanonicalUrl = (url: string) => {
    let canonical = document.querySelector('link[rel="canonical"]')
    
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    
    canonical.setAttribute('href', url)
  }

  const updateStructuredData = (data: any) => {
    // Remove existing structured data
    const existing = document.querySelector('script[type="application/ld+json"]')
    if (existing) {
      existing.remove()
    }
    
    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  const generateSocialShare = (platform: string) => {
    const content = socialGenerator.generateSocialContent({
      title: seoState.title,
      description: seoState.description
    }, platform)
    
    return content
  }

  const trackPerformance = () => {
    // Track page performance metrics
    const performanceData = {
      loadTime: performance.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    }
    
    // In production, send to analytics
    console.log('Performance tracked:', performanceData)
  }

  return {
    ...seoState,
    optimizePage,
    generateSocialShare,
    trackPerformance
  }
}