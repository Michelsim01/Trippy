import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    Type,
    FileText,
    Quote,
    List,
    Image as ImageIcon,
    Eye,
    Save,
    X,
    ChevronDown,
    Calendar,
    Upload
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { blogService, BLOG_CATEGORIES } from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';

const CreateBlogPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const fileInputRef = useRef(null);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

    // Form Data State
    const [blogData, setBlogData] = useState({
        title: '',
        category: 'TRAVEL',
        tags: [],
        thumbnailUrl: '',
        content: '',
        status: 'DRAFT'
    });

    // Content Blocks State
    const [contentBlocks, setContentBlocks] = useState([
        { id: 1, type: 'paragraph', content: '' }
    ]);

    const [currentTag, setCurrentTag] = useState('');

    // Clear error when step changes
    useEffect(() => {
        setError(null);
    }, [currentStep]);

    // Load blog data for editing
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && user?.id) {
            setIsEditMode(true);
            loadBlogForEdit(editId);
        }
    }, [searchParams, user?.id]);

    const loadBlogForEdit = async (blogId) => {
        try {
            setLoading(true);
            setError(null);
            const blog = await blogService.getBlogById(blogId, user?.id);

            // Parse content back to blocks for editing
            const parsedBlocks = parseContentToBlocks(blog.content);

            setBlogData({
                title: blog.title || '',
                category: blog.category || 'TRAVEL',
                tags: blog.tags || [],
                thumbnailUrl: blog.thumbnailUrl || '',
                content: blog.content || '',
                status: blog.status || 'DRAFT'
            });

            setContentBlocks(parsedBlocks);
        } catch (error) {
            console.error('Error loading blog for edit:', error);
            setError('Failed to load blog for editing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const parseContentToBlocks = (htmlContent) => {
        if (!htmlContent || htmlContent.trim() === '') {
            return [{ id: 1, type: 'paragraph', content: '' }];
        }

        // Simple HTML parsing to convert back to blocks
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        const blocks = [];
        let blockId = 1;

        const elements = tempDiv.children;
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const tagName = element.tagName.toLowerCase();

            if (tagName === 'h2') {
                blocks.push({
                    id: blockId++,
                    type: 'heading',
                    content: element.textContent || ''
                });
            } else if (tagName === 'p') {
                blocks.push({
                    id: blockId++,
                    type: 'paragraph',
                    content: element.textContent || ''
                });
            } else if (tagName === 'blockquote') {
                blocks.push({
                    id: blockId++,
                    type: 'quote',
                    content: element.textContent || ''
                });
            } else if (tagName === 'ul') {
                const listItems = Array.from(element.querySelectorAll('li')).map(li => li.textContent);
                blocks.push({
                    id: blockId++,
                    type: 'list',
                    content: listItems.join('\n')
                });
            } else if (tagName === 'figure') {
                const img = element.querySelector('img');
                const caption = element.querySelector('figcaption');
                if (img) {
                    blocks.push({
                        id: blockId++,
                        type: 'image',
                        content: '',
                        imageUrl: img.src || '',
                        caption: caption ? caption.textContent : ''
                    });
                }
            }
        }

        return blocks.length > 0 ? blocks : [{ id: 1, type: 'paragraph', content: '' }];
    };

    // ===== UI HANDLERS =====
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    // ===== BASIC INFO HANDLERS =====
    const handleBasicInfoChange = (field, value) => {
        setBlogData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!blogData.tags.includes(currentTag.trim())) {
                setBlogData(prev => ({
                    ...prev,
                    tags: [...prev.tags, currentTag.trim()]
                }));
            }
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setBlogData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    // ===== THUMBNAIL UPLOAD HANDLERS =====
    const handleThumbnailUpload = async (file) => {
        if (!file) return;

        setUploadingThumbnail(true);
        setError(null);

        try {
            const imageUrl = await blogService.uploadImage(file);
            setBlogData(prev => ({
                ...prev,
                thumbnailUrl: imageUrl
            }));
        } catch (error) {
            console.error('Error uploading thumbnail:', error);
            setError(error.message);
        } finally {
            setUploadingThumbnail(false);
        }
    };

    const handleThumbnailRemove = () => {
        setBlogData(prev => ({
            ...prev,
            thumbnailUrl: ''
        }));
    };

    // ===== CONTENT BLOCK HANDLERS =====
    const addContentBlock = (type) => {
        const newBlock = {
            id: Date.now(),
            type: type,
            content: type === 'image' ? '' : '',
            imageUrl: type === 'image' ? '' : undefined,
            caption: type === 'image' ? '' : undefined
        };
        setContentBlocks([...contentBlocks, newBlock]);
    };

    const updateContentBlock = (id, field, value) => {
        setContentBlocks(blocks =>
            blocks.map(block =>
                block.id === id ? { ...block, [field]: value } : block
            )
        );
    };

    const handleContentImageUpload = async (blockId, file) => {
        if (!file) return;

        setUploadingImage(true);
        setError(null);

        try {
            const imageUrl = await blogService.uploadImage(file);
            updateContentBlock(blockId, 'imageUrl', imageUrl);
        } catch (error) {
            console.error('Error uploading content image:', error);
            setError(error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const removeContentBlock = (id) => {
        if (contentBlocks.length > 1) {
            setContentBlocks(blocks => blocks.filter(block => block.id !== id));
        }
    };

    const moveBlockUp = (index) => {
        if (index > 0) {
            const newBlocks = [...contentBlocks];
            [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
            setContentBlocks(newBlocks);
        }
    };

    const moveBlockDown = (index) => {
        if (index < contentBlocks.length - 1) {
            const newBlocks = [...contentBlocks];
            [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
            setContentBlocks(newBlocks);
        }
    };

    // ===== CONTENT CONVERSION =====
    const convertBlocksToContent = () => {
        try {
            return contentBlocks.map(block => {
                switch (block.type) {
                    case 'heading':
                        return block.content ? `<h2>${block.content}</h2>` : '';
                    case 'paragraph':
                        return block.content ? `<p>${block.content}</p>` : '';
                    case 'quote':
                        return block.content ? `<blockquote>${block.content}</blockquote>` : '';
                    case 'list':
                        if (!block.content) return '';
                        const items = block.content.split('\n').filter(item => item.trim());
                        return items.length > 0 ? `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>` : '';
                    case 'image':
                        if (!block.imageUrl) return '';
                        return `<figure style="margin: 2rem 0;"><img src="${block.imageUrl}" alt="${block.caption || ''}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />${block.caption ? `<figcaption style="margin-top: 0.5rem; font-style: italic; color: #666; text-align: center;">${block.caption}</figcaption>` : ''}</figure>`;
                    default:
                        return block.content ? `<p>${block.content}</p>` : '';
                }
            }).filter(html => html.trim() !== '').join('\n');
        } catch (error) {
            console.error('Error converting blocks to content:', error);
            throw error;
        }
    };

    // ===== NAVIGATION HANDLERS =====
    const validateStep1 = () => {
        if (!blogData.title.trim()) {
            setError('Please enter a title for your blog');
            return false;
        }
        if (!blogData.category) {
            setError('Please select a category');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        const hasContent = contentBlocks.some(block =>
            block.content?.trim() || block.imageUrl
        );
        if (!hasContent) {
            setError('Please add some content to your blog');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        setError(null);

        if (currentStep === 1) {
            if (validateStep1()) {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                try {
                    const contentString = convertBlocksToContent();
                    setBlogData(prev => ({ ...prev, content: contentString }));
                    setCurrentStep(3);
                } catch (error) {
                    console.error('Error converting content blocks:', error);
                    setError('There was an error processing your content. Please check your content blocks and try again.');
                }
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // ===== SAVE HANDLERS =====
    const handleSaveDraft = async () => await saveBlog('DRAFT');
    const handlePublish = async () => await saveBlog('PUBLISHED');

    const saveBlog = async (status) => {
        setSaving(true);
        setError(null);

        try {
            const contentString = blogData.content || convertBlocksToContent();
            const blogPayload = {
                ...blogData,
                content: contentString,
                status: status,
                author: { id: user?.id || user?.userId }
            };

            if (isEditMode) {
                const editId = searchParams.get('edit');
                await blogService.updateBlog(editId, blogPayload, user?.id);
            } else {
                await blogService.createBlog(blogPayload);
            }

            navigate('/blog');
        } catch (error) {
            console.error('Error saving blog:', error);
            setError(`Failed to ${status.toLowerCase()} blog. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    // ===== RENDER STEP CONTENT =====
    const renderStep1 = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-neutrals-1">
                {isEditMode ? 'Edit Blog Information' : 'Basic Information'}
            </h2>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                    Blog Title *
                </label>
                <input
                    type="text"
                    value={blogData.title}
                    onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                    placeholder="Enter an engaging title for your blog"
                    className="w-full px-4 py-3 rounded-lg border border-neutrals-6 focus:outline-none focus:border-primary-1 transition-colors"
                    maxLength={100}
                />
                <p className="text-xs text-neutrals-4 mt-1">
                    {blogData.title.length}/100 characters
                </p>
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                    Category *
                </label>
                <div className="relative">
                    <button
                        onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-neutrals-6 hover:border-primary-1 transition-colors"
                    >
                        <span>{BLOG_CATEGORIES[blogData.category]}</span>
                        <ChevronDown
                            size={20}
                            className={`text-neutrals-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {categoryDropdownOpen && (
                        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-neutrals-6 z-10">
                            {Object.entries(BLOG_CATEGORIES)
                                .filter(([key]) => key !== 'ALL')
                                .map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            handleBasicInfoChange('category', key);
                                            setCategoryDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-neutrals-7 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                            blogData.category === key ? 'bg-primary-1 text-white hover:bg-primary-2' : ''
                                        }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                    Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {blogData.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-primary-1 text-white rounded-full text-sm flex items-center gap-2"
                        >
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-red-200 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type a tag and press Enter"
                    className="w-full px-4 py-3 rounded-lg border border-neutrals-6 focus:outline-none focus:border-primary-1 transition-colors"
                />
            </div>

            {/* Thumbnail Upload */}
            <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                    Thumbnail Image
                </label>
                {blogData.thumbnailUrl ? (
                    <div className="relative">
                        <img
                            src={blogData.thumbnailUrl}
                            alt="Thumbnail preview"
                            className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                            onClick={handleThumbnailRemove}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                            title="Remove thumbnail"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div
                        className="w-full h-64 border-2 border-dashed border-neutrals-6 rounded-lg flex flex-col items-center justify-center text-neutrals-4 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploadingThumbnail ? (
                            <>
                                <div className="w-12 h-12 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="font-medium">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <Upload size={48} className="mb-3" />
                                <p className="font-medium">Click to upload thumbnail</p>
                                <p className="text-sm">PNG, JPG up to 10MB</p>
                            </>
                        )}
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            handleThumbnailUpload(file);
                        }
                    }}
                    className="hidden"
                />
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-neutrals-1">
                        {isEditMode ? 'Edit Your Content' : 'Write Your Content'}
                    </h2>
                    <p className="text-neutrals-4 text-sm mt-1">
                        {isEditMode ? 'Update your blog content with our rich text editor' : 'Create engaging content with our rich text editor'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <ContentBlockButton
                        onClick={() => addContentBlock('heading')}
                        icon={<Type size={20} />}
                        title="Add Heading"
                    />
                    <ContentBlockButton
                        onClick={() => addContentBlock('paragraph')}
                        icon={<FileText size={20} />}
                        title="Add Paragraph"
                    />
                    <ContentBlockButton
                        onClick={() => addContentBlock('quote')}
                        icon={<Quote size={20} />}
                        title="Add Quote"
                    />
                    <ContentBlockButton
                        onClick={() => addContentBlock('list')}
                        icon={<List size={20} />}
                        title="Add List"
                    />
                    <ContentBlockButton
                        onClick={() => addContentBlock('image')}
                        icon={<ImageIcon size={20} />}
                        title="Add Image"
                    />
                </div>
            </div>

            {/* Content Blocks */}
            <div className="space-y-6">
                {contentBlocks.map((block, index) => (
                    <ContentBlock
                        key={block.id}
                        block={block}
                        index={index}
                        totalBlocks={contentBlocks.length}
                        onUpdate={(field, value) => updateContentBlock(block.id, field, value)}
                        onRemove={() => removeContentBlock(block.id)}
                        onMoveUp={() => moveBlockUp(index)}
                        onMoveDown={() => moveBlockDown(index)}
                        onImageUpload={(file) => handleContentImageUpload(block.id, file)}
                        uploadingImage={uploadingImage}
                    />
                ))}
            </div>
        </div>
    );

    // Move useMemo to top level to avoid hooks violation
    const contentHtml = useMemo(() => {
        if (currentStep !== 3) return '';
        if (blogData.content) return blogData.content;
        try {
            return convertBlocksToContent();
        } catch (error) {
            console.error('Error in preview step:', error);
            return '<p>Error loading preview content. Please go back and check your content.</p>';
        }
    }, [currentStep, blogData.content, contentBlocks]);

    const renderStep3 = () => {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-neutrals-1">
                        {isEditMode ? 'Preview Your Updated Blog' : 'Preview Your Blog'}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-neutrals-4">
                        <Eye size={16} />
                        <span>Preview Mode</span>
                    </div>
                </div>

                {/* Blog Preview */}
                <BlogPreview
                    blogData={blogData}
                    contentHtml={contentHtml}
                    user={user}
                />

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-8 py-4 bg-white border-2 border-neutrals-6 text-neutrals-1 rounded-xl hover:border-neutrals-4 hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                        <Save size={20} />
                        {saving && blogData.status === 'DRAFT' ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save as Draft'}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={saving}
                        className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                        {saving && blogData.status === 'PUBLISHED' ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {isEditMode ? 'Updating...' : 'Publishing...'}
                            </>
                        ) : (
                            <>
                                <Eye size={20} />
                                {isEditMode ? 'Update Blog' : 'Publish Blog'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            default: return renderStep1();
        }
    };

    // Show loading state when loading blog for edit
    if (loading) {
        return (
            <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-1 mx-auto"></div>
                    <p className="mt-4 text-neutrals-4">Loading blog for editing...</p>
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
                        <div className="max-w-5xl mx-auto">
                            {/* Progress Steps */}
                            <ProgressSteps currentStep={currentStep} onBack={() => navigate('/blog')} />

                            {/* Error Message */}
                            {error && (
                                <ErrorMessage message={error} onClose={() => setError(null)} />
                            )}

                            {/* Step Content */}
                            <div className="bg-white rounded-lg shadow-sm p-8">
                                {renderStepContent()}
                            </div>

                            {/* Navigation Buttons */}
                            {currentStep < 3 && (
                                <NavigationButtons
                                    currentStep={currentStep}
                                    onBack={handleBack}
                                    onNext={handleNext}
                                />
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
                        <div className="bg-white rounded-lg p-4">
                            {renderStepContent()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

// ===== COMPONENT HELPERS =====

const ContentBlockButton = ({ onClick, icon, title, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-3 bg-white rounded-lg border border-neutrals-6 transition-all duration-200 group ${
            disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-primary-1 hover:bg-primary-1/5'
        }`}
        title={title}
    >
        <div className={`transition-colors duration-200 ${disabled ? 'text-neutrals-4' : 'text-neutrals-4 group-hover:text-primary-1'}`}>
            {icon}
        </div>
    </button>
);

const ContentBlock = ({
    block,
    index,
    totalBlocks,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    onImageUpload,
    uploadingImage
}) => (
    <div className="relative group bg-white p-6 rounded-lg border border-neutrals-6 hover:border-primary-1/50 hover:shadow-md transition-all duration-200">
        {/* Move Controls */}
        <div className="absolute -left-16 top-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-2 bg-white rounded-lg shadow-md border border-neutrals-6 hover:border-primary-1 hover:bg-primary-1/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move up"
            >
                <ArrowUp size={16} className="text-neutrals-4" />
            </button>
            <button
                onClick={onMoveDown}
                disabled={index === totalBlocks - 1}
                className="p-2 bg-white rounded-lg shadow-md border border-neutrals-6 hover:border-primary-1 hover:bg-primary-1/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move down"
            >
                <ArrowDown size={16} className="text-neutrals-4" />
            </button>
            <button
                onClick={onRemove}
                disabled={totalBlocks === 1}
                className="p-2 bg-white rounded-lg shadow-md border border-red-200 hover:border-red-400 hover:bg-red-50 text-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete block"
            >
                <X size={16} />
            </button>
        </div>

        {/* Block Type Indicator */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-neutrals-7 text-neutrals-3 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
        </div>

        {/* Block Content */}
        {block.type === 'heading' && (
            <input
                type="text"
                value={block.content}
                onChange={(e) => onUpdate('content', e.target.value)}
                placeholder="Enter heading..."
                className="w-full px-0 py-2 text-2xl font-bold bg-transparent border-none outline-none text-neutrals-1 placeholder-neutrals-4"
            />
        )}

        {block.type === 'paragraph' && (
            <textarea
                value={block.content}
                onChange={(e) => onUpdate('content', e.target.value)}
                placeholder="Write your paragraph..."
                rows={4}
                className="w-full px-0 py-2 bg-transparent border-none outline-none text-neutrals-2 placeholder-neutrals-4 resize-none leading-relaxed"
            />
        )}

        {block.type === 'quote' && (
            <div className="border-l-4 border-primary-1 pl-6 bg-primary-1/5 rounded-r-lg py-3">
                <textarea
                    value={block.content}
                    onChange={(e) => onUpdate('content', e.target.value)}
                    placeholder="Enter quote..."
                    rows={3}
                    className="w-full px-0 py-2 italic bg-transparent border-none outline-none text-neutrals-2 placeholder-neutrals-4 resize-none leading-relaxed"
                />
            </div>
        )}

        {block.type === 'list' && (
            <div className="pl-4">
                <textarea
                    value={block.content}
                    onChange={(e) => onUpdate('content', e.target.value)}
                    placeholder="• First item&#10;• Second item&#10;• Third item"
                    rows={4}
                    className="w-full px-0 py-2 bg-transparent border-none outline-none text-neutrals-2 placeholder-neutrals-4 resize-none leading-relaxed"
                />
            </div>
        )}

        {block.type === 'image' && (
            <div className="w-full">
                {block.imageUrl ? (
                    <div className="relative">
                        <img
                            src={block.imageUrl}
                            alt={block.caption || 'Blog image'}
                            className="w-full h-auto max-h-96 object-cover rounded-lg"
                        />
                        <button
                            onClick={() => onUpdate('imageUrl', '')}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                            title="Remove image"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div
                        className="w-full h-48 border-2 border-dashed border-neutrals-6 rounded-lg flex flex-col items-center justify-center text-neutrals-4 hover:border-primary-1 hover:text-primary-1 transition-colors cursor-pointer"
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                                const file = e.target.files?.[0];
                                if (file && onImageUpload) {
                                    onImageUpload(file);
                                }
                            };
                            input.click();
                        }}
                    >
                        {uploadingImage ? (
                            <>
                                <div className="w-12 h-12 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <p className="font-medium">Uploading...</p>
                            </>
                        ) : (
                            <>
                                <ImageIcon size={36} className="mb-2" />
                                <p className="font-medium">Click to upload image</p>
                                <p className="text-xs">PNG, JPG up to 10MB</p>
                            </>
                        )}
                    </div>
                )}
                {/* Caption input */}
                <input
                    type="text"
                    value={block.caption || ''}
                    onChange={(e) => onUpdate('caption', e.target.value)}
                    placeholder="Add a caption (optional)"
                    className="w-full mt-3 px-3 py-2 text-sm text-neutrals-3 bg-neutrals-8 border border-neutrals-6 rounded-lg focus:outline-none focus:border-primary-1 transition-colors"
                />
            </div>
        )}
    </div>
);

const ProgressSteps = ({ currentStep, onBack }) => (
    <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-neutrals-3 hover:text-neutrals-1 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Blogs
            </button>
            <div className="flex items-center gap-4">
                {[1, 2, 3].map((step, index) => (
                    <React.Fragment key={step}>
                        <div className={`flex items-center gap-2 ${currentStep >= step ? 'text-primary-1' : 'text-neutrals-4'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                currentStep >= step ? 'bg-primary-1 text-white' : 'bg-neutrals-6 text-neutrals-3'
                            }`}>
                                {step}
                            </div>
                            <span className="hidden sm:inline">
                                {step === 1 ? 'Basic Info' : step === 2 ? 'Content' : 'Preview'}
                            </span>
                        </div>
                        {index < 2 && (
                            <div className={`w-16 h-0.5 ${currentStep >= step + 1 ? 'bg-primary-1' : 'bg-neutrals-6'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    </div>
);

const ErrorMessage = ({ message, onClose }) => (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
        <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">!</div>
        <div className="flex-1">
            <p className="text-red-800 font-medium">{message}</p>
        </div>
        <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition-colors"
        >
            <X size={20} />
        </button>
    </div>
);

const NavigationButtons = ({ currentStep, onBack, onNext }) => (
    <div className="flex justify-between mt-8">
        <button
            onClick={onBack}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                currentStep === 1
                    ? 'bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                    : 'bg-white border border-neutrals-6 text-neutrals-1 hover:border-primary-1'
            }`}
        >
            <ArrowLeft size={20} />
            Back
        </button>
        <button
            onClick={onNext}
            className="px-6 py-3 bg-primary-1 text-white rounded-lg flex items-center gap-2 hover:bg-primary-2 transition-colors"
        >
            Next
            <ArrowRight size={20} />
        </button>
    </div>
);

const BlogPreview = ({ blogData, contentHtml, user }) => (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-neutrals-6">
        {/* Thumbnail placeholder */}
        {blogData.thumbnailUrl && (
            <div className="relative w-full h-80 overflow-hidden">
                <img
                    src={blogData.thumbnailUrl}
                    alt={blogData.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-6 left-6">
                    <span className="px-4 py-2 bg-primary-1 text-white rounded-full text-sm font-medium shadow-lg">
                        {BLOG_CATEGORIES[blogData.category]}
                    </span>
                </div>
                <div className="absolute top-6 right-6">
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium shadow-lg">
                        PREVIEW
                    </span>
                </div>
            </div>
        )}

        <div className="p-8 lg:p-12">
            {/* Category & Tags if no thumbnail */}
            {!blogData.thumbnailUrl && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-4 py-2 bg-primary-1 text-white rounded-full text-sm font-medium">
                        {BLOG_CATEGORIES[blogData.category]}
                    </span>
                    {blogData.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-neutrals-7 text-neutrals-2 rounded-full text-sm">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-neutrals-1 mb-6 leading-tight">
                {blogData.title}
            </h1>

            {/* Author & Meta Info */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutrals-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-1 to-primary-2 rounded-full flex items-center justify-center ring-4 ring-primary-1/20">
                        <span className="text-white font-semibold text-lg">
                            {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-neutrals-1 text-lg">
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.username || 'Unknown Author'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-neutrals-4">
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{new Date().toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye size={14} />
                                <span>0 views</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags if thumbnail exists */}
                {blogData.thumbnailUrl && blogData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-w-xs">
                        {blogData.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-neutrals-7 text-neutrals-2 rounded-full text-sm">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-w-none">
                <div
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
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

            {/* Empty state */}
            {!contentHtml.trim() && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-neutrals-7 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Type size={32} className="text-neutrals-4" />
                    </div>
                    <p className="text-neutrals-4 text-lg">No content added yet</p>
                    <p className="text-neutrals-5 text-sm">Go back to the content editor to add your blog content</p>
                </div>
            )}

            {/* Reading stats */}
            <div className="mt-12 pt-6 border-t border-neutrals-6">
                <div className="flex items-center justify-between text-sm text-neutrals-4">
                    <span>Estimated reading time: {(() => {
                        const plainText = contentHtml.replace(/<[^>]*>/g, '');
                        const wordCount = plainText.split(' ').filter(word => word.trim()).length;
                        return Math.max(1, Math.ceil(wordCount / 200));
                    })()} min read</span>
                    <span>Status: {blogData.status === 'DRAFT' ? 'Draft' : 'Published'}</span>
                </div>
            </div>
        </div>
    </div>
);


export default CreateBlogPage;