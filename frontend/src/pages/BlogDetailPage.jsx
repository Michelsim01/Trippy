import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, User, Edit, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { blogService, BLOG_CATEGORIES } from '../services/blogService';

const BlogDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                setLoading(true);
                const userId = user?.id;
                const blogData = await blogService.getBlogById(id, userId);
                setBlog(blogData);

                // Increment view count only for published blogs
                if (blogData.status === 'PUBLISHED') {
                    blogService.incrementViews(id);
                }
            } catch (err) {
                console.error('Error fetching blog:', err);
                if (err.message.includes('permission')) {
                    setError('You do not have permission to view this blog post');
                } else {
                    setError('Failed to load blog post');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBlog();
        }
    }, [id, user]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
            return;
        }

        try {
            await blogService.deleteBlog(id, user?.id);
            navigate('/blog');
        } catch (err) {
            console.error('Error deleting blog:', err);
            alert('Failed to delete blog post: ' + err.message);
        }
    };

    const isAuthor = user && blog && blog.author?.id === user.id;

    if (loading) {
        return (
            <div className="min-h-screen bg-neutrals-8">
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
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-neutrals-8">
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
                            <div className="max-w-4xl mx-auto text-center">
                                <h1 className="text-2xl font-bold text-neutrals-1 mb-4">Blog Post Not Found</h1>
                                <p className="text-neutrals-3 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
                                <button
                                    onClick={() => navigate('/blog')}
                                    className="px-6 py-3 bg-primary-1 text-white rounded-lg hover:bg-primary-2 transition-colors"
                                >
                                    Back to Blog
                                </button>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
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
                        <div className="max-w-4xl mx-auto">
                            {/* Back Button */}
                            <button
                                onClick={() => navigate('/blog')}
                                className="flex items-center gap-2 text-neutrals-3 hover:text-neutrals-1 transition-colors mb-8"
                            >
                                <ArrowLeft size={20} />
                                Back to Blog
                            </button>

                            {/* Blog Content */}
                            <article className="bg-white rounded-xl shadow-xl overflow-hidden border border-neutrals-6">
                                {/* Hero Image */}
                                {blog.thumbnailUrl && (
                                    <div className="relative w-full h-80 overflow-hidden">
                                        <img
                                            src={blog.thumbnailUrl}
                                            alt={blog.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                                        {/* Category Badge */}
                                        <div className="absolute top-6 left-6">
                                            <span className="px-4 py-2 bg-primary-1 text-white rounded-full text-sm font-medium shadow-lg">
                                                {BLOG_CATEGORIES[blog.category]}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 lg:p-12">
                                    {/* Category & Tags if no thumbnail */}
                                    {!blog.thumbnailUrl && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <span className="px-4 py-2 bg-primary-1 text-white rounded-full text-sm font-medium">
                                                {BLOG_CATEGORIES[blog.category]}
                                            </span>
                                            {blog.tags?.map((tag, index) => (
                                                <span key={index} className="px-3 py-1 bg-neutrals-7 text-neutrals-2 rounded-full text-sm">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Title */}
                                    <h1 className="text-4xl lg:text-5xl font-bold text-neutrals-1 mb-6 leading-tight">
                                        {blog.title}
                                    </h1>

                                    {/* Author & Meta Info */}
                                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutrals-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-primary-1 to-primary-2 rounded-full flex items-center justify-center ring-4 ring-primary-1/20">
                                                <span className="text-white font-semibold text-lg">
                                                    {blog.author?.firstName?.[0] || blog.author?.username?.[0] || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutrals-1 text-lg">
                                                    {blog.author?.firstName && blog.author?.lastName
                                                        ? `${blog.author.firstName} ${blog.author.lastName}`
                                                        : blog.author?.username || 'Unknown Author'}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-neutrals-4">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        <span>{formatDate(blog.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Eye size={14} />
                                                        <span>{blog.viewsCount || 0} views</span>
                                                    </div>
                                                    {blog.status === 'DRAFT' && (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                                            Draft
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Tags if thumbnail exists */}
                                            {blog.thumbnailUrl && blog.tags?.length > 0 && (
                                                <div className="flex flex-wrap gap-2 max-w-xs">
                                                    {blog.tags.map((tag, index) => (
                                                        <span key={index} className="px-3 py-1 bg-neutrals-7 text-neutrals-2 rounded-full text-sm">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Author Actions */}
                                            {isAuthor && (
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/create-blog?edit=${blog.articleId}`}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        <Edit size={16} />
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={handleDelete}
                                                        className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="prose prose-lg prose-headings:text-neutrals-1 prose-p:text-neutrals-2 prose-a:text-primary-1 prose-strong:text-neutrals-1 prose-img:rounded-lg prose-img:shadow-md max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                                    </div>

                                    {/* Reading stats */}
                                    <div className="mt-12 pt-6 border-t border-neutrals-6">
                                        <div className="flex items-center justify-between text-sm text-neutrals-4">
                                            <span>Published on {formatDate(blog.createdAt)}</span>
                                            <span>Status: {blog.status === 'DRAFT' ? 'Draft' : 'Published'}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
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
                        {/* Mobile Back Button */}
                        <button
                            onClick={() => navigate('/blog')}
                            className="flex items-center gap-2 text-neutrals-3 hover:text-neutrals-1 transition-colors mb-6"
                        >
                            <ArrowLeft size={20} />
                            Back to Blog
                        </button>

                        {/* Mobile content - same structure but simpler */}
                        <article className="bg-white rounded-lg overflow-hidden border border-neutrals-6">
                            {blog.thumbnailUrl && (
                                <img
                                    src={blog.thumbnailUrl}
                                    alt={blog.title}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <h1 className="text-2xl font-bold text-neutrals-1 mb-4">{blog.title}</h1>
                                <div className="prose max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                                </div>
                            </div>
                        </article>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BlogDetailPage;