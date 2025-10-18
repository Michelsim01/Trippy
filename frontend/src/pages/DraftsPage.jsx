import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { blogService } from '../services/blogService'
import { BLOG_CATEGORIES } from '../services/blogService'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const DraftsPage = () => {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const userId = user?.id

  useEffect(() => {
    if (!userId) {
      navigate('/login')
      return
    }
    fetchDrafts()
  }, [userId, navigate])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const fetchDrafts = async () => {
    try {
      setLoading(true)
      setError('')
      const draftsData = await blogService.getDraftsByAuthor(userId)
      setDrafts(draftsData)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching drafts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return
    }

    try {
      await blogService.deleteBlog(draftId, userId)
      setDrafts(drafts.filter(draft => draft.articleId !== draftId))
    } catch (err) {
      setError(err.message)
      console.error('Error deleting draft:', err)
    }
  }

  const handlePublish = async (draft) => {
    try {
      const updatedDraft = {
        ...draft,
        status: 'PUBLISHED'
      }
      await blogService.updateBlog(draft.articleId, updatedDraft, userId)
      setDrafts(drafts.filter(d => d.articleId !== draft.articleId))
      alert('Draft published successfully!')
    } catch (err) {
      setError(err.message)
      console.error('Error publishing draft:', err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto"></div>
          <p className="mt-4 text-neutrals-4">Loading your drafts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />
          <main className="w-full p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutrals-6 p-6 mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-neutrals-1 font-dm-sans">My Drafts</h1>
                    <p className="text-neutrals-4 mt-2 font-dm-sans">Manage your unpublished blog posts</p>
                  </div>
                  <Link
                    to="/create-blog"
                    className="bg-primary-1 hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-colors font-dm-sans"
                  >
                    Create New Blog
                  </Link>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 font-dm-sans">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Drafts List */}
              {drafts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-neutrals-6 p-12 text-center">
                  <div className="text-neutrals-5 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutrals-2 mb-2 font-dm-sans">No drafts yet</h3>
                  <p className="text-neutrals-4 mb-6 font-dm-sans">Start writing your first blog post!</p>
                  <Link
                    to="/create-blog"
                    className="bg-primary-1 hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-semibold inline-block transition-colors font-dm-sans"
                  >
                    Create Your First Blog
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6">
                  {drafts.map((draft) => (
                    <div key={draft.articleId} className="bg-white rounded-2xl shadow-sm border border-neutrals-6 hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-neutrals-1 mb-2 font-dm-sans">
                              {draft.title || 'Untitled Draft'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-neutrals-4 mb-3 font-dm-sans">
                              <span className="bg-neutrals-7 text-neutrals-2 px-3 py-1 rounded-full">
                                {BLOG_CATEGORIES[draft.category] || draft.category}
                              </span>
                              <span>Last updated: {formatDate(draft.updatedAt)}</span>
                              {draft.tags && draft.tags.length > 0 && (
                                <span>Tags: {draft.tags.join(', ')}</span>
                              )}
                            </div>
                            <p className="text-neutrals-3 line-clamp-3 font-dm-sans">
                              {draft.content ?
                                draft.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' :
                                'No content yet...'
                              }
                            </p>
                          </div>
                          {draft.thumbnailUrl && (
                            <img
                              src={draft.thumbnailUrl}
                              alt="Draft thumbnail"
                              className="w-24 h-24 object-cover rounded-xl ml-4"
                            />
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-neutrals-6">
                          <Link
                            to={`/blog/${draft.articleId}`}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors font-dm-sans"
                          >
                            Preview
                          </Link>
                          <Link
                            to={`/create-blog?edit=${draft.articleId}`}
                            className="bg-primary-1 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors font-dm-sans"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handlePublish(draft)}
                            className="bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors font-dm-sans"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => handleDelete(draft.articleId)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors font-dm-sans"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar
          isAuthenticated={true}
          variant="mobile"
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        <main className="w-full p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutrals-6 p-6 mb-8">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-neutrals-1 font-dm-sans">My Drafts</h1>
                  <p className="text-neutrals-4 mt-2 font-dm-sans">Manage your unpublished blog posts</p>
                </div>
                <Link
                  to="/create-blog"
                  className="bg-primary-1 hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-colors font-dm-sans text-center"
                >
                  Create New Blog
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 font-dm-sans">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Drafts List */}
            {drafts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-neutrals-6 p-8 text-center">
                <div className="text-neutrals-5 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutrals-2 mb-2 font-dm-sans">No drafts yet</h3>
                <p className="text-neutrals-4 mb-6 font-dm-sans">Start writing your first blog post!</p>
                <Link
                  to="/create-blog"
                  className="bg-primary-1 hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-semibold inline-block transition-colors font-dm-sans"
                >
                  Create Your First Blog
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div key={draft.articleId} className="bg-white rounded-2xl shadow-sm border border-neutrals-6">
                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-neutrals-1 mb-2 font-dm-sans">
                          {draft.title || 'Untitled Draft'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutrals-4 mb-3 font-dm-sans">
                          <span className="bg-neutrals-7 text-neutrals-2 px-2 py-1 rounded-full">
                            {BLOG_CATEGORIES[draft.category] || draft.category}
                          </span>
                          <span>Updated: {formatDate(draft.updatedAt)}</span>
                        </div>
                        <p className="text-neutrals-3 text-sm line-clamp-2 font-dm-sans">
                          {draft.content ?
                            draft.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' :
                            'No content yet...'
                          }
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-neutrals-6">
                        <Link
                          to={`/blog/${draft.articleId}`}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-xs font-medium transition-colors font-dm-sans"
                        >
                          Preview
                        </Link>
                        <Link
                          to={`/create-blog?edit=${draft.articleId}`}
                          className="bg-primary-1 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors font-dm-sans"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handlePublish(draft)}
                          className="bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg text-xs font-medium transition-colors font-dm-sans"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleDelete(draft.articleId)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-medium transition-colors font-dm-sans"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DraftsPage