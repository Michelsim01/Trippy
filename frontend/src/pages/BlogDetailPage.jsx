import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, User, Edit, Trash2, Heart, MessageCircle, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import RecommendedTours from '../components/RecommendedTours';
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

    // Like and comment state
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingLike, setLoadingLike] = useState(false);
    const [loadingComment, setLoadingComment] = useState(false);

    // Ref to track if view count has been incremented to prevent React StrictMode double-execution
    const viewIncrementedRef = useRef(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Fetch like status and comments
    const fetchLikeStatus = async () => {
        if (!user?.id || !id) return;
        try {
            const likeData = await blogService.getLikeStatus(id, user.id);
            setIsLiked(likeData.isLiked);
            setLikesCount(likeData.likesCount);
        } catch (error) {
            console.error('Error fetching like status:', error);
        }
    };

    const fetchComments = async () => {
        if (!id) return;
        try {
            const commentsData = await blogService.getComments(id);
            console.log('Fetched comments:', commentsData);
            setComments(commentsData || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setComments([]); // Set empty array on error
        }
    };

    // Handle like toggle
    const handleLikeToggle = async () => {
        if (!user?.id || loadingLike) return;

        setLoadingLike(true);
        try {
            const response = await blogService.toggleLike(id, user.id);
            setIsLiked(response.isLiked);
            setLikesCount(response.likesCount);
        } catch (error) {
            console.error('Error toggling like:', error);
        } finally {
            setLoadingLike(false);
        }
    };

    // Handle comment submission
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id || !newComment.trim() || loadingComment) return;

        setLoadingComment(true);
        try {
            const newCommentData = await blogService.createComment(id, user.id, newComment.trim());
            setComments([...comments, newCommentData]);
            setNewComment('');
            // Update blog comment count
            if (blog) {
                setBlog({ ...blog, commentsCount: (blog.commentsCount || 0) + 1 });
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setLoadingComment(false);
        }
    };

    // Handle comment deletion
    const handleCommentDelete = async (commentId) => {
        if (!user?.id) return;

        try {
            await blogService.deleteComment(commentId, user.id);
            setComments(comments.filter(comment => comment.commentId !== commentId));
            // Update blog comment count
            if (blog) {
                setBlog({ ...blog, commentsCount: Math.max((blog.commentsCount || 1) - 1, 0) });
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                setLoading(true);
                const userId = user?.id;
                const blogData = await blogService.getBlogById(id, userId);
                setBlog(blogData);

                // Increment view count only for published blogs and only once
                if (blogData.status === 'PUBLISHED' && !viewIncrementedRef.current) {
                    viewIncrementedRef.current = true;
                    blogService.incrementViews(id);
                }

                // Fetch like status and comments
                fetchLikeStatus();
                fetchComments();
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

    const handlePublish = async () => {
        if (!window.confirm('Are you sure you want to publish this draft?')) {
            return;
        }

        try {
            const updatedBlog = {
                ...blog,
                status: 'PUBLISHED'
            };
            await blogService.updateBlog(id, updatedBlog, user?.id);
            // Refresh the blog data to show updated status
            setBlog({ ...blog, status: 'PUBLISHED' });
            alert('Draft published successfully!');
        } catch (err) {
            console.error('Error publishing draft:', err);
            alert('Failed to publish draft: ' + err.message);
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
                        <div className="max-w-7xl mx-auto">
                            {/* Back Button */}
                            <button
                                onClick={() => navigate('/blog')}
                                className="flex items-center gap-2 text-neutrals-3 hover:text-neutrals-1 transition-colors mb-8"
                            >
                                <ArrowLeft size={20} />
                                Back to Blog
                            </button>

                            {/* Main Layout with Sidebar */}
                            <div className="flex gap-8">
                                {/* Main Content */}
                                <div className="flex-1">
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
                                                    {blog.status === 'DRAFT' && (
                                                        <button
                                                            onClick={handlePublish}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Send size={16} />
                                                            Publish
                                                        </button>
                                                    )}
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
                                    <div className="max-w-none">
                                        <div
                                            dangerouslySetInnerHTML={{ __html: blog.content }}
                                            className="blog-content"
                                            style={{
                                                '--heading-color': '#1a1a1a',
                                                '--text-color': '#374151',
                                                '--quote-color': '#1e40af',
                                                '--quote-bg': '#eff6ff',
                                                '--quote-border': '#3b82f6',
                                                '--list-bullet': '#3b82f6'
                                            }}
                                        />
                                    </div>

                                    <style>{`
                                        .blog-content h2 {
                                            font-size: 2rem;
                                            font-weight: 700;
                                            line-height: 1.3;
                                            margin: 2rem 0 1rem 0;
                                            color: var(--heading-color);
                                            border-bottom: 2px solid #e5e7eb;
                                            padding-bottom: 0.5rem;
                                        }

                                        .blog-content p {
                                            font-size: 1.125rem;
                                            line-height: 1.75;
                                            margin: 1.5rem 0;
                                            color: var(--text-color);
                                            text-align: justify;
                                        }

                                        .blog-content blockquote {
                                            border-left: 4px solid var(--quote-border);
                                            background-color: var(--quote-bg);
                                            padding: 1.5rem 2rem;
                                            margin: 2rem 0;
                                            border-radius: 0 8px 8px 0;
                                            font-style: italic;
                                            font-size: 1.125rem;
                                            color: var(--quote-color);
                                            position: relative;
                                        }

                                        .blog-content blockquote::before {
                                            content: '"';
                                            font-size: 4rem;
                                            color: var(--quote-border);
                                            position: absolute;
                                            top: -0.5rem;
                                            left: 1rem;
                                            line-height: 1;
                                            opacity: 0.3;
                                        }

                                        .blog-content ul {
                                            margin: 1.5rem 0;
                                            padding-left: 0;
                                            list-style: none;
                                        }

                                        .blog-content ul li {
                                            position: relative;
                                            padding-left: 2rem;
                                            margin: 0.75rem 0;
                                            font-size: 1.125rem;
                                            line-height: 1.6;
                                            color: var(--text-color);
                                        }

                                        .blog-content ul li::before {
                                            content: '•';
                                            color: var(--list-bullet);
                                            font-weight: bold;
                                            position: absolute;
                                            left: 0.5rem;
                                            font-size: 1.5rem;
                                            line-height: 1.2;
                                        }

                                        .blog-content figure {
                                            margin: 2.5rem 0;
                                            text-align: center;
                                        }

                                        .blog-content figure img {
                                            width: 100%;
                                            height: auto;
                                            border-radius: 12px;
                                            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                                            transition: transform 0.3s ease;
                                        }

                                        .blog-content figure img:hover {
                                            transform: scale(1.02);
                                        }

                                        .blog-content figcaption {
                                            margin-top: 1rem;
                                            font-style: italic;
                                            color: #6b7280;
                                            font-size: 0.95rem;
                                            text-align: center;
                                        }

                                        .blog-content > *:first-child {
                                            margin-top: 0;
                                        }

                                        .blog-content > *:last-child {
                                            margin-bottom: 0;
                                        }

                                        @media (max-width: 768px) {
                                            .blog-content h2 {
                                                font-size: 1.75rem;
                                            }

                                            .blog-content p,
                                            .blog-content blockquote,
                                            .blog-content ul li {
                                                font-size: 1rem;
                                            }

                                            .blog-content blockquote {
                                                padding: 1rem 1.5rem;
                                            }
                                        }
                                    `}</style>

                                    {/* Like Button and Comments Section */}
                                    <div className="mt-8 pt-6 border-t border-neutrals-6">
                                        {/* Like and Engagement Stats */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-6">
                                                {/* Like Button */}
                                                {user && (
                                                    <button
                                                        onClick={handleLikeToggle}
                                                        disabled={loadingLike}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                                            isLiked
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        } ${loadingLike ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <Heart
                                                            size={20}
                                                            className={`transition-all duration-200 ${
                                                                isLiked ? 'fill-current text-red-600' : ''
                                                            }`}
                                                        />
                                                        <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                                                    </button>
                                                )}

                                                {/* Comments Count */}
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MessageCircle size={20} />
                                                    <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments Section */}
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-semibold text-neutrals-1">Comments</h3>

                                            {/* Add Comment Form */}
                                            {user ? (
                                                <form onSubmit={handleCommentSubmit} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-1 to-primary-2 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-semibold text-sm">
                                                                {user.firstName?.[0] || user.username?.[0] || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <textarea
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                placeholder="Add a comment..."
                                                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-1 focus:border-transparent"
                                                                rows="3"
                                                            />
                                                            <div className="flex justify-end mt-2">
                                                                <button
                                                                    type="submit"
                                                                    disabled={!newComment.trim() || loadingComment}
                                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                                                        newComment.trim() && !loadingComment
                                                                            ? 'bg-primary-1 text-white hover:bg-primary-2'
                                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    <Send size={16} />
                                                                    {loadingComment ? 'Posting...' : 'Post Comment'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                                    <p className="text-gray-600">
                                                        <Link to="/" className="text-primary-1 hover:text-primary-2 font-medium">
                                                            Sign in
                                                        </Link>
                                                        {' '}to leave a comment
                                                    </p>
                                                </div>
                                            )}

                                            {/* Comments List */}
                                            <div className="space-y-4">
                                                {comments.length === 0 ? (
                                                    <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                                                ) : (
                                                    comments.map((comment, index) => (
                                                        <div key={comment.commentId || `comment-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-3 flex-1">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-1 to-primary-2 rounded-full flex items-center justify-center">
                                                                        <span className="text-white font-semibold text-xs">
                                                                            {comment.user?.firstName?.[0] || comment.user?.username?.[0] || 'U'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-medium text-neutrals-1">
                                                                                {comment.user?.firstName && comment.user?.lastName
                                                                                    ? `${comment.user.firstName} ${comment.user.lastName}`
                                                                                    : comment.user?.username || 'Anonymous'}
                                                                            </span>
                                                                            <span className="text-sm text-gray-500">
                                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-neutrals-2">{comment.content}</p>
                                                                    </div>
                                                                </div>
                                                                {/* Delete button for comment owner */}
                                                                {user && comment.user?.id === user.id && (
                                                                    <button
                                                                        onClick={() => handleCommentDelete(comment.commentId)}
                                                                        className="text-red-500 hover:text-red-700 p-1"
                                                                        title="Delete comment"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
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

                                {/* Sidebar */}
                                <div className="w-80 flex-shrink-0">
                                    <div className="sticky top-8">
                                        <RecommendedTours blogId={id} />
                                    </div>
                                </div>
                            </div>
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
                                <div className="max-w-none">
                                    <div
                                        dangerouslySetInnerHTML={{ __html: blog.content }}
                                        className="blog-content"
                                        style={{
                                            '--heading-color': '#1a1a1a',
                                            '--text-color': '#374151',
                                            '--quote-color': '#1e40af',
                                            '--quote-bg': '#eff6ff',
                                            '--quote-border': '#3b82f6',
                                            '--list-bullet': '#3b82f6'
                                        }}
                                    />
                                </div>
                            </div>
                        </article>

                        {/* Mobile Recommended Tours */}
                        <div className="mt-6">
                            <RecommendedTours blogId={id} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BlogDetailPage;