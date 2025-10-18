import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BlogCard from '../components/BlogCard';
import { blogService, BLOG_CATEGORIES } from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';

const BlogPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [blogs, setBlogs] = useState([]);
    const [spotlightBlog, setSpotlightBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Fetch blogs on mount and when filters change
    useEffect(() => {
        fetchBlogs();
    }, [selectedCategory, searchTerm]);

    const fetchBlogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
                search: searchTerm
            };

            // Use getPublishedBlogs to only fetch published blogs from server
            const data = await blogService.getPublishedBlogs(params);

            setBlogs(data);

            // Set spotlight blog (highest view count)
            if (data.length > 0) {
                const spotlight = data.reduce((prev, current) =>
                    (current.viewsCount || 0) > (prev.viewsCount || 0) ? current : prev
                );
                setSpotlightBlog(spotlight);
            } else {
                setSpotlightBlog(null);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
            setError('Failed to load blogs. Please try again later.');
            setBlogs([]);
            setSpotlightBlog(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchBlogs();
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            fetchBlogs();
        }
    };

    // Handle blog deletion
    const handleBlogDeleted = (blogId) => {
        setBlogs(blogs.filter(blog => blog.articleId !== blogId));
        if (spotlightBlog?.articleId === blogId) {
            setSpotlightBlog(blogs[0] || null);
        }
    };

    // Check if user can create blogs (similar to experience creation)
    const canCreateBlog = user?.canCreateExperiences && user?.kycStatus === 'APPROVED';

    const handleCreateBlog = () => {
        navigate('/create-blog/basic-info');
    };

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
                            {/* Header Section with Create Button */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-neutrals-1 mb-2">Travel Blog</h1>
                                    <p className="text-neutrals-4">Discover travel stories, tips, and inspiration from fellow travelers</p>
                                </div>
                                {canCreateBlog && (
                                    <div className="flex gap-3 mt-4 sm:mt-0">
                                        <Link
                                            to="/drafts"
                                            className="flex items-center gap-2 px-4 py-2 border-2 border-primary-1 text-primary-1 rounded-lg hover:bg-primary-1 hover:text-white transition-colors font-semibold"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            My Drafts
                                        </Link>
                                        <button
                                            onClick={handleCreateBlog}
                                            className="btn btn-primary btn-md"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Write New Blog
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Filter and Search Section */}
                            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                                {/* Category Tags on the Left */}
                                <div className="flex flex-wrap gap-2 flex-1">
                                    {Object.entries(BLOG_CATEGORIES).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedCategory(key)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                selectedCategory === key
                                                    ? 'bg-primary-1 text-white'
                                                    : 'bg-white border border-neutrals-6 text-neutrals-3 hover:border-primary-1 hover:text-primary-1'
                                            }`}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>

                                {/* Search Bar on the Right - Navbar Style */}
                                <div className="relative lg:w-[300px]">
                                    {/* Search Icon */}
                                    <div className="w-6 h-6 absolute" style={{ left: '20px', top: '50%', transform: 'translateY(-50%)' }}>
                                        <svg className="w-5 h-5" fill="none" stroke="#777E90" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    {/* Search Input */}
                                    <input
                                        type="text"
                                        placeholder="Search blogs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleSearchKeyDown}
                                        className="input-field white w-full"
                                        style={{
                                            paddingLeft: '50px',
                                            paddingRight: '24px',
                                            fontSize: '14px',
                                            lineHeight: '24px',
                                            borderRadius: '9999px',
                                            height: '48px',
                                            backgroundColor: 'white',
                                            border: '1px solid #E6E8EC'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Spotlight Blog Section */}
                            {spotlightBlog && !loading && (
                                <div className="mb-12">
                                    <h2 className="text-2xl font-semibold text-neutrals-1 mb-6">Featured Blog</h2>
                                    <div
                                        className="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                        onClick={() => navigate(`/blog/${spotlightBlog.articleId}`)}
                                    >
                                        <div className="flex flex-col lg:flex-row">
                                            <div className="lg:w-2/3 h-64 lg:h-96 bg-neutrals-2">
                                                <img
                                                    src={spotlightBlog.thumbnailUrl || spotlightBlog.imagesUrl?.[0] || '/api/placeholder/800/400'}
                                                    alt={spotlightBlog.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="lg:w-1/3 p-8 flex flex-col justify-between">
                                                <div>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                                                        spotlightBlog.category === 'TIPSANDTRICKS' ? 'bg-blue-100 text-blue-800' :
                                                        spotlightBlog.category === 'TRAVEL' ? 'bg-pink-100 text-pink-800' :
                                                        spotlightBlog.category === 'EXPLORING' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {BLOG_CATEGORIES[spotlightBlog.category]}
                                                    </span>
                                                    <h3 className="text-2xl font-bold text-neutrals-1 mb-4 line-clamp-2">
                                                        {spotlightBlog.title}
                                                    </h3>
                                                    <p className="text-neutrals-3 line-clamp-4 mb-6">
                                                        {spotlightBlog.content?.substring(0, 200)}...
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-neutrals-4">
                                                    <span>{new Date(spotlightBlog.createdAt).toLocaleDateString()}</span>
                                                    <span>{spotlightBlog.viewsCount || 0} views</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-neutrals-4">Loading blogs...</p>
                                    </div>
                                </div>
                            )}

                            {/* Error State */}
                            {error && !loading && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                    <p className="text-red-600">{error}</p>
                                    <button
                                        onClick={fetchBlogs}
                                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* Blog Grid */}
                            {!loading && !error && (
                                <div>
                                    <h2 className="text-2xl font-semibold text-neutrals-1 mb-6">All Blogs</h2>
                                    {blogs.length > 0 ? (
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {blogs.filter(blog => blog.articleId !== spotlightBlog?.articleId).map((blog) => (
                                                <BlogCard
                                                    key={blog.articleId}
                                                    blog={blog}
                                                    showEditButton={user?.id === blog.author?.id}
                                                    showDeleteButton={user?.id === blog.author?.id}
                                                    onBlogDeleted={handleBlogDeleted}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-white rounded-lg">
                                            <div className="text-gray-400 mb-4">
                                                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-semibold text-neutrals-3 mb-2">
                                                {searchTerm || selectedCategory !== 'ALL'
                                                    ? 'No blogs match your search'
                                                    : 'No published blogs yet'
                                                }
                                            </h3>
                                            <p className="text-neutrals-4 mb-6">
                                                {searchTerm || selectedCategory !== 'ALL'
                                                    ? 'Try adjusting your search terms or browse different categories.'
                                                    : 'Be the first to share your travel experiences!'
                                                }
                                            </p>
                                            {canCreateBlog && (
                                                <button
                                                    onClick={handleCreateBlog}
                                                    className="px-6 py-3 bg-primary-1 text-white rounded-lg hover:bg-primary-2 transition-colors font-semibold"
                                                >
                                                    Write Your First Blog
                                                </button>
                                            )}
                                            {(searchTerm || selectedCategory !== 'ALL') && (
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setSelectedCategory('ALL');
                                                    }}
                                                    className="ml-4 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    )}
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
                        {/* Mobile Header with Create Button */}
                        <div className="flex flex-col mb-6">
                            <div className="flex justify-between items-start mb-2">
                                <h1 className="text-3xl font-bold text-neutrals-1">Travel Blog</h1>
                                {canCreateBlog && (
                                    <button
                                        onClick={handleCreateBlog}
                                        className="btn btn-primary btn-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <p className="text-base text-neutrals-3 mb-8">
                                Discover travel stories, tips, and inspiration from fellow travelers around the world.
                            </p>
                        </div>

                        {/* Mobile Search */}
                        <div className="relative mb-4">
                            <div className="w-6 h-6 absolute" style={{ left: '20px', top: '50%', transform: 'translateY(-50%)' }}>
                                <svg className="w-5 h-5" fill="none" stroke="#777E90" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search blogs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="input-field white w-full"
                                style={{
                                    paddingLeft: '50px',
                                    paddingRight: '24px',
                                    fontSize: '14px',
                                    lineHeight: '24px',
                                    borderRadius: '9999px',
                                    height: '48px'
                                }}
                            />
                        </div>

                        {/* Mobile Category Tags */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {Object.entries(BLOG_CATEGORIES).map(([key, value]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedCategory(key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                        selectedCategory === key
                                            ? 'bg-primary-1 text-white'
                                            : 'bg-white border border-neutrals-6 text-neutrals-3'
                                    }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Blog List */}
                        <div className="space-y-6">
                            {!loading && blogs.map((blog) => (
                                <BlogCard
                                    key={blog.articleId}
                                    blog={blog}
                                    showEditButton={user?.id === blog.author?.id}
                                    showDeleteButton={user?.id === blog.author?.id}
                                    onBlogDeleted={handleBlogDeleted}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BlogPage;