import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { blogService, BLOG_CATEGORIES } from '../services/blogService';

const BlogCard = ({
    blog,
    showEditButton = false,
    showDeleteButton = false,
    onBlogDeleted = null,
    variant = 'default'
}) => {
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/blog/${blog.articleId}`);
    };

    // need make sure only admin can delete their own blogs
    const handleDeleteClick = async (e) => {
        e.stopPropagation();

        const confirmed = window.confirm(`Are you sure you want to delete "${blog.title}"? This action cannot be undone.`);
        if (!confirmed) return;

        setIsDeleting(true);

        try {
            await blogService.deleteBlog(blog.articleId);

            if (onBlogDeleted) {
                onBlogDeleted(blog.articleId);
            }
        } catch (error) {
            console.error('Error deleting blog:', error);
            alert(error.message || 'An error occurred while deleting the blog');
        } finally {
            setIsDeleting(false);
        }
    };

    // only allow admins to edit their blogs
    const handleEditClick = (e) => {
        e.stopPropagation();
        navigate(`/edit-blog/${blog.articleId}`);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get category display name
    const getCategoryDisplay = (category) => {
        return BLOG_CATEGORIES[category] || category;
    };

    // Get category color class
    const getCategoryColor = (category) => {
        const colors = {
            TIPSANDTRICKS: 'bg-blue-100 text-blue-800',
            EXPLORING: 'bg-green-100 text-green-800',
            OFFTOPIC: 'bg-purple-100 text-purple-800',
            HOWTO: 'bg-orange-100 text-orange-800',
            TRAVEL: 'bg-pink-100 text-pink-800',
            OTHERS: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div
            className="relative flex flex-col w-full cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg bg-white rounded-[16px] border border-neutrals-6 overflow-hidden"
            onClick={handleCardClick}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-[4/3] bg-neutrals-2 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url(${blog.thumbnailUrl || blog.imagesUrl?.[0] || '/api/placeholder/400/300'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Category Tag */}
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(blog.category)}`}>
                        {getCategoryDisplay(blog.category)}
                    </span>
                </div>

                {/* Edit Button */}
                {showEditButton && (
                    <button
                        className="absolute top-4 right-14 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 z-20 group"
                        onClick={handleEditClick}
                        title="Edit Blog"
                    >
                        <Edit size={20} className="text-neutrals-1 group-hover:text-primary-1 transition-colors duration-200" />
                    </button>
                )}

                {/* Delete Button */}
                {showDeleteButton && (
                    <button
                        className={`absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 z-20 group ${
                            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={handleDeleteClick}
                        title="Delete Blog"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Trash2 size={20} className="text-neutrals-1 group-hover:text-red-500 transition-colors duration-200" />
                        )}
                    </button>
                )}
            </div>

            {/* Card Content */}
            <div className="bg-white p-5 flex flex-col gap-4 flex-1">
                <div className="flex-1">
                    <h3 className="text-[16px] font-medium text-neutrals-1 leading-[24px] mb-2 line-clamp-2">
                        {blog.title}
                    </h3>
                    <p className="text-[14px] text-neutrals-3 leading-[20px] line-clamp-3 mb-4">
                        {blog.content ? blog.content.substring(0, 150) + '...' : 'No description available'}
                    </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-neutrals-6 rounded-[1px]" />

                {/* Footer with Date and Views */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[12px] text-neutrals-4">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(blog.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-neutrals-4">
                        <Eye className="w-4 h-4" />
                        <span>{blog.viewsCount || 0} views</span>
                    </div>
                </div>

                {/* Author info if available */}
                {blog.author && (
                    <div className="flex items-center gap-2 pt-2 border-t border-neutrals-7">
                        <div className="w-6 h-6 bg-primary-1 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                                {blog.author.firstName?.[0] || blog.author.username?.[0] || 'U'}
                            </span>
                        </div>
                        <span className="text-[12px] text-neutrals-4">
                            By {blog.author.firstName && blog.author.lastName
                                ? `${blog.author.firstName} ${blog.author.lastName}`
                                : blog.author.username || 'Unknown Author'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogCard;