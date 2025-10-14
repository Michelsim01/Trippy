import axios from 'axios'

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if it's not a login/register request
      const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') ||
                            error.config?.url?.includes('/api/auth/register')

      if (!isAuthEndpoint) {
        // Token expired or invalid for protected routes
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// Blog service functions
export const blogService = {
  // Get all travel articles/blogs
  getAllBlogs: async (params = {}) => {
    try {
      // Build query parameters for filtering
      const queryParams = new URLSearchParams()

      if (params.category && params.category !== 'ALL') {
        queryParams.append('category', params.category)
      }
      if (params.search) {
        queryParams.append('search', params.search)
      }
      if (params.status) {
        queryParams.append('status', params.status)
      }
      if (params.tags) {
        queryParams.append('tags', params.tags)
      }

      const queryString = queryParams.toString()
      const url = `/api/travel-articles${queryString ? `?${queryString}` : ''}`

      const response = await api.get(url)
      const blogs = response.data

      // Ensure full URLs for images in all blogs
      return blogs.map(blog => {
        if (blog.thumbnailUrl && !blog.thumbnailUrl.startsWith('http')) {
          blog.thumbnailUrl = `http://localhost:8080${blog.thumbnailUrl}`
        }
        if (blog.imagesUrl) {
          blog.imagesUrl = blog.imagesUrl.map(url =>
            url.startsWith('http') ? url : `http://localhost:8080${url}`
          )
        }
        return blog
      })
    } catch (error) {
      console.error('Error fetching all blogs:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch blogs')
    }
  },

  // Get a single blog by ID
  getBlogById: async (id) => {
    try {
      const response = await api.get(`/api/travel-articles/${id}`)
      const blog = response.data

      // Ensure full URLs for images
      if (blog.thumbnailUrl && !blog.thumbnailUrl.startsWith('http')) {
        blog.thumbnailUrl = `http://localhost:8080${blog.thumbnailUrl}`
      }
      if (blog.imagesUrl) {
        blog.imagesUrl = blog.imagesUrl.map(url =>
          url.startsWith('http') ? url : `http://localhost:8080${url}`
        )
      }

      return blog
    } catch (error) {
      console.error('Error fetching blog by ID:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch blog')
    }
  },

  // Create a new blog
  createBlog: async (blogData) => {
    try {
      // Ensure timestamps are set
      const blogPayload = {
        ...blogData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewsCount: 0
      }

      const response = await api.post('/api/travel-articles', blogPayload)
      return response.data
    } catch (error) {
      console.error('Error creating blog:', error)
      throw new Error(error.response?.data?.message || 'Failed to create blog')
    }
  },

  // Update an existing blog
  updateBlog: async (id, blogData) => {
    try {
      // Update the updatedAt timestamp
      const blogPayload = {
        ...blogData,
        updatedAt: new Date().toISOString()
      }

      const response = await api.put(`/api/travel-articles/${id}`, blogPayload)
      return response.data
    } catch (error) {
      console.error('Error updating blog:', error)
      throw new Error(error.response?.data?.message || 'Failed to update blog')
    }
  },

  // Delete a blog
  deleteBlog: async (id) => {
    try {
      await api.delete(`/api/travel-articles/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error deleting blog:', error)
      throw new Error(error.response?.data?.message || 'Failed to delete blog')
    }
  },

  // Get blogs by author (will need to be implemented in backend)
  getBlogsByAuthor: async (authorId) => {
    try {
      const response = await api.get(`/api/travel-articles/author/${authorId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching blogs by author:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch author blogs')
    }
  },

  // Increment view count (will need to be implemented in backend)
  incrementViews: async (id) => {
    try {
      const response = await api.post(`/api/travel-articles/${id}/view`)
      return response.data
    } catch (error) {
      console.error('Error incrementing views:', error)
      // Don't throw error for view count, it's not critical
      return null
    }
  }
}

// Category mappings that match your ArticleCategoryEnum
export const BLOG_CATEGORIES = {
  ALL: 'All',
  TIPSANDTRICKS: 'Tips and Tricks',
  EXPLORING: 'Exploring',
  OFFTOPIC: 'Off Topic',
  HOWTO: 'How To',
  TRAVEL: 'Travel',
  OTHERS: 'Others'
}

// Status mappings that match your ArticleStatusEnum
export const BLOG_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived'
}

// Utility function to format blog data for backend
export const formatBlogForBackend = (blogData, author) => {
  return {
    title: blogData.title,
    content: blogData.content,
    slug: blogData.slug || blogData.title?.toLowerCase().replace(/\s+/g, '-'),
    tags: blogData.tags || [],
    status: blogData.status || 'DRAFT',
    category: blogData.category,
    viewsCount: blogData.viewsCount || 0,
    imagesUrl: blogData.imagesUrl || [],
    videosUrl: blogData.videosUrl || [],
    thumbnailUrl: blogData.thumbnailUrl || '',
    author: author,
    createdAt: blogData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export default blogService