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
  // Get all published travel articles/blogs for public view
  getPublishedBlogs: async (params = {}) => {
    try {
      // Build query parameters for filtering
      const queryParams = new URLSearchParams()

      if (params.category && params.category !== 'ALL') {
        queryParams.append('category', params.category)
      }

      const queryString = queryParams.toString()
      const url = `/api/travel-articles/published${queryString ? `?${queryString}` : ''}`

      const response = await api.get(url)
      const blogs = response.data

      // Filter by search on frontend (for now)
      let filteredBlogs = blogs
      if (params.search) {
        const searchLower = params.search.toLowerCase()
        filteredBlogs = blogs.filter(blog =>
          blog.title.toLowerCase().includes(searchLower) ||
          blog.content.toLowerCase().includes(searchLower) ||
          (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        )
      }

      // Ensure full URLs for images in all blogs
      return filteredBlogs.map(blog => {
        if (blog.thumbnailUrl && !blog.thumbnailUrl.startsWith('http')) {
          blog.thumbnailUrl = `http://localhost:8080${blog.thumbnailUrl}`
        }
        if (blog.imagesUrl && Array.isArray(blog.imagesUrl)) {
          blog.imagesUrl = blog.imagesUrl.map(url =>
            url.startsWith('http') ? url : `http://localhost:8080${url}`
          )
        }
        // Also fix image URLs in blog content HTML
        if (blog.content) {
          blog.content = blog.content.replace(
            /src="(\/api\/travel-articles\/images\/[^"]+)"/g,
            'src="http://localhost:8080$1"'
          )
        }
        return blog
      })
    } catch (error) {
      console.error('Error fetching published blogs:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch blogs')
    }
  },

  // Get all blogs (for backwards compatibility)
  getAllBlogs: async (params = {}) => {
    return blogService.getPublishedBlogs(params)
  },

  // Get draft blogs by author
  getDraftsByAuthor: async (authorId) => {
    try {
      if (!authorId) {
        throw new Error('Author ID is required')
      }

      const response = await api.get(`/api/travel-articles/drafts?authorId=${authorId}`)
      const drafts = response.data

      // Ensure full URLs for images
      return drafts.map(draft => {
        if (draft.thumbnailUrl && !draft.thumbnailUrl.startsWith('http')) {
          draft.thumbnailUrl = `http://localhost:8080${draft.thumbnailUrl}`
        }
        if (draft.imagesUrl && Array.isArray(draft.imagesUrl)) {
          draft.imagesUrl = draft.imagesUrl.map(url =>
            url.startsWith('http') ? url : `http://localhost:8080${url}`
          )
        }
        // Also fix image URLs in blog content HTML
        if (draft.content) {
          draft.content = draft.content.replace(
            /src="(\/api\/travel-articles\/images\/[^"]+)"/g,
            'src="http://localhost:8080$1"'
          )
        }
        return draft
      })
    } catch (error) {
      console.error('Error fetching drafts:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch drafts')
    }
  },

  // Get a single blog by ID
  getBlogById: async (id, userId = null) => {
    try {
      const url = userId ? `/api/travel-articles/${id}?userId=${userId}` : `/api/travel-articles/${id}`
      const response = await api.get(url)
      const blog = response.data

      // Ensure full URLs for images
      if (blog.thumbnailUrl && !blog.thumbnailUrl.startsWith('http')) {
        blog.thumbnailUrl = `http://localhost:8080${blog.thumbnailUrl}`
      }
      if (blog.imagesUrl && Array.isArray(blog.imagesUrl)) {
        blog.imagesUrl = blog.imagesUrl.map(url =>
          url.startsWith('http') ? url : `http://localhost:8080${url}`
        )
      }
      // Also fix image URLs in blog content HTML
      if (blog.content) {
        blog.content = blog.content.replace(
          /src="(\/api\/travel-articles\/images\/[^"]+)"/g,
          'src="http://localhost:8080$1"'
        )
      }

      return blog
    } catch (error) {
      console.error('Error fetching blog by ID:', error)
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this blog')
      }
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
  updateBlog: async (id, blogData, userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required for updating blog')
      }

      // Update the updatedAt timestamp
      const blogPayload = {
        ...blogData,
        updatedAt: new Date().toISOString()
      }

      const response = await api.put(`/api/travel-articles/${id}?userId=${userId}`, blogPayload)
      return response.data
    } catch (error) {
      console.error('Error updating blog:', error)
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this blog')
      }
      throw new Error(error.response?.data?.message || 'Failed to update blog')
    }
  },

  // Delete a blog
  deleteBlog: async (id, userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required for deleting blog')
      }

      await api.delete(`/api/travel-articles/${id}?userId=${userId}`)
      return { success: true }
    } catch (error) {
      console.error('Error deleting blog:', error)
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this blog')
      }
      throw new Error(error.response?.data?.message || 'Failed to delete blog')
    }
  },

  // Get blogs by author
  getBlogsByAuthor: async (authorId, status = null) => {
    try {
      const url = status
        ? `/api/travel-articles/author/${authorId}?status=${status}`
        : `/api/travel-articles/author/${authorId}`

      const response = await api.get(url)
      const blogs = response.data

      // Ensure full URLs for images
      return blogs.map(blog => {
        if (blog.thumbnailUrl && !blog.thumbnailUrl.startsWith('http')) {
          blog.thumbnailUrl = `http://localhost:8080${blog.thumbnailUrl}`
        }
        if (blog.imagesUrl && Array.isArray(blog.imagesUrl)) {
          blog.imagesUrl = blog.imagesUrl.map(url =>
            url.startsWith('http') ? url : `http://localhost:8080${url}`
          )
        }
        return blog
      })
    } catch (error) {
      console.error('Error fetching blogs by author:', error)
      throw new Error(error.response?.data?.message || 'Failed to fetch author blogs')
    }
  },

  // Increment view count
  incrementViews: async (id) => {
    try {
      const response = await api.post(`/api/travel-articles/${id}/view`)
      return response.data
    } catch (error) {
      console.error('Error incrementing views:', error)
      // Don't throw error for view count, it's not critical
      return null
    }
  },

  // Like/Unlike article
  toggleLike: async (articleId, userId) => {
    try {
      const response = await api.post(`/api/travel-articles/${articleId}/like`, null, {
        params: { userId }
      })
      return response.data
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  },

  // Get like status for article
  getLikeStatus: async (articleId, userId) => {
    try {
      const response = await api.get(`/api/travel-articles/${articleId}/like-status`, {
        params: { userId }
      })
      return response.data
    } catch (error) {
      console.error('Error getting like status:', error)
      throw error
    }
  },

  // Get comments for article
  getComments: async (articleId) => {
    try {
      const response = await api.get(`/api/travel-articles/${articleId}/comments`)
      return response.data
    } catch (error) {
      console.error('Error getting comments:', error)
      throw error
    }
  },

  // Create new comment
  createComment: async (articleId, userId, content) => {
    try {
      const response = await api.post(`/api/travel-articles/${articleId}/comments`, null, {
        params: { userId, content }
      })
      return response.data
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  },

  // Update existing comment
  updateComment: async (commentId, userId, content) => {
    try {
      const response = await api.put(`/api/travel-articles/comments/${commentId}`, null, {
        params: { userId, content }
      })
      return response.data
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error
    }
  },

  // Delete comment
  deleteComment: async (commentId, userId) => {
    try {
      const response = await api.delete(`/api/travel-articles/comments/${commentId}`, {
        params: { userId }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  },

  // Like/Unlike comment
  toggleCommentLike: async (commentId, userId) => {
    try {
      const response = await api.post(`/api/travel-articles/comments/${commentId}/like`, null, {
        params: { userId }
      })
      return response.data
    } catch (error) {
      console.error('Error toggling comment like:', error)
      throw error
    }
  },

  // Upload image for blog content or thumbnail
  uploadImage: async (file) => {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file selected')
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed')
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum 10MB allowed')
      }

      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('file', file)

      // Upload to backend
      const response = await api.post('/api/travel-articles/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Return the image URL
      const imageUrl = response.data.url

      // Ensure full URL for display
      if (imageUrl && !imageUrl.startsWith('http')) {
        return `http://localhost:8080${imageUrl}`
      }

      return imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload image')
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