import React, { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/blogService';
import BlogCard from '../BlogCard';
import { useAuth } from '../../contexts/AuthContext';

const BlogsTab = ({ userId, isOwnProfile }) => {
    const { user } = useAuth();
    const [publishedBlogs, setPublishedBlogs] = useState([]);
    const [draftsCount, setDraftsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchUserBlogs();
        }
    }, [userId]);

    const fetchUserBlogs = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching blogs for userId:', userId);

            // Fetch published blogs by author
            const published = await blogService.getBlogsByAuthor(userId, 'PUBLISHED');
            console.log('Published blogs fetched:', published);
            setPublishedBlogs(published);

            // Fetch drafts count
            const drafts = await blogService.getDraftsByAuthor(userId);
            console.log('Drafts fetched:', drafts);
            setDraftsCount(drafts.length);
        } catch (err) {
            console.error('Error fetching user blogs:', err);
            setError('Failed to load blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleBlogDeleted = (deletedBlogId) => {
        setPublishedBlogs(prevBlogs => prevBlogs.filter(blog => blog.articleId !== deletedBlogId));
    };

    if (loading) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-neutrals-1 mb-6">Blogs</h3>
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h3 className="text-xl font-semibold text-neutrals-1 mb-6">Blogs</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchUserBlogs}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-neutrals-1">Blogs</h3>
                <div className="flex gap-3">
                    {draftsCount > 0 && (
                        <Link
                            to="/drafts"
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            <FileText size={16} />
                            {draftsCount} Draft{draftsCount !== 1 ? 's' : ''}
                        </Link>
                    )}
                    {isOwnProfile && (
                        <Link
                            to="/create-blog"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Plus size={16} />
                            New Blog
                        </Link>
                    )}
                </div>
            </div>

            {publishedBlogs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-neutrals-3 mb-2">No published blogs yet</h4>
                    <p className="text-neutrals-4 mb-4">Share your travel experiences with the community!</p>
                    <Link
                        to="/create-blog"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Write Your First Blog
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publishedBlogs.map((blog) => (
                        <BlogCard
                            key={blog.articleId}
                            blog={blog}
                            showEditButton={user?.id === userId}
                            showDeleteButton={user?.id === userId}
                            onBlogDeleted={handleBlogDeleted}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogsTab;
