import React, { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

// Local, simple form for creating an Experience. Backend integration can attach auth/guide later.
const ExperienceForm = ({ compact = false }) => {
    const [formValues, setFormValues] = useState({
        title: '',
        shortDescription: '',
        fullDescription: '',
        highlights: '',
        category: '',
        tags: '', // comma-separated
        coverPhotoUrl: '',
        whatIncluded: '',
        importantInfo: '',
        price: '',
        participantsAllowed: '',
        duration: '',
        location: '',
        cancellationPolicy: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const categoryOptions = useMemo(() => ([
        { value: 'GUIDED_TOUR', label: 'Guided Tour' },
        { value: 'DAYTRIP', label: 'Day Trip' },
        { value: 'ADVENTURE', label: 'Adventure' },
        { value: 'WORKSHOP', label: 'Workshop' },
        { value: 'WATER_ACTIVITY', label: 'Water Activity' },
        { value: 'OTHERS', label: 'Others' },
    ]), []);

    const cancellationOptions = useMemo(() => ([
        { value: 'FREE_24H', label: 'Free cancellation (24h)' },
        { value: 'FREE_48H', label: 'Free cancellation (48h)' },
        { value: 'NO_REFUND', label: 'No refund' },
        { value: 'CUSTOM', label: 'Custom' },
    ]), []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formValues.title?.trim()) return 'Title is required.';
        if (!formValues.location?.trim()) return 'Location is required.';
        if (!formValues.fullDescription?.trim()) return 'Description is required.';
        if (!formValues.category) return 'Category is required.';
        if (!formValues.cancellationPolicy) return 'Cancellation policy is required.';
        if (formValues.price && Number.isNaN(Number(formValues.price))) return 'Price must be a number.';
        if (formValues.participantsAllowed && !Number.isInteger(Number(formValues.participantsAllowed))) return 'Participants must be an integer.';
        if (formValues.duration && Number.isNaN(Number(formValues.duration))) return 'Duration must be a number (hours).';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        const validation = validate();
        if (validation) {
            setErrorMessage(validation);
            return;
        }

        // Prepare payload mapped to backend entity field names
        const payload = {
            title: formValues.title.trim(),
            shortDescription: formValues.shortDescription?.trim() || null,
            fullDescription: formValues.fullDescription.trim(),
            highlights: formValues.highlights?.trim() || null,
            category: formValues.category,
            tags: formValues.tags
                ? formValues.tags.split(',').map((t) => t.trim()).filter(Boolean)
                : [],
            coverPhotoUrl: formValues.coverPhotoUrl?.trim() || null,
            whatIncluded: formValues.whatIncluded?.trim() || null,
            importantInfo: formValues.importantInfo?.trim() || null,
            price: formValues.price ? Number(formValues.price) : null,
            participantsAllowed: formValues.participantsAllowed ? Number(formValues.participantsAllowed) : null,
            duration: formValues.duration ? Number(formValues.duration) : null,
            location: formValues.location.trim(),
            cancellationPolicy: formValues.cancellationPolicy,
            // status will be assigned by backend defaults or separate moderation flow
            // guide is required by backend; backend should infer from auth. Until then, this POST will likely fail.
        };

        try {
            setIsSubmitting(true);
            // Attempt posting; if backend not ready to infer guide, this may 400/500.
            const res = await fetch('/api/experiences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to create experience');
            }
            setSuccessMessage('Experience submitted successfully!');
            // Optionally clear form
            setFormValues({
                title: '', shortDescription: '', fullDescription: '', highlights: '', category: '', tags: '',
                coverPhotoUrl: '', whatIncluded: '', importantInfo: '', price: '', participantsAllowed: '', duration: '', location: '', cancellationPolicy: ''
            });
        } catch (err) {
            // Keep client-friendly message, log technical details
            console.error('Create experience error:', err);
            setErrorMessage('Could not submit. Ensure you are logged in and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const sectionClass = compact ? 'space-y-6' : 'space-y-6';
    const labelClass = 'block text-sm font-medium text-neutrals-2 mb-2';
    const inputClass = 'w-full px-4 py-3 border border-neutrals-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1';

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow-sm">
            <div className={sectionClass}>
                {errorMessage && (
                    <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3">
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="rounded-md bg-green-50 border border-green-200 text-green-700 px-4 py-3">
                        {successMessage}
                    </div>
                )}

                <div>
                    <label className={labelClass}>Experience Title</label>
                    <input name="title" value={formValues.title} onChange={handleChange} type="text" className={inputClass} placeholder="Enter your experience title" />
                </div>

                <div>
                    <label className={labelClass}>Short Description</label>
                    <input name="shortDescription" value={formValues.shortDescription} onChange={handleChange} type="text" className={inputClass} placeholder="A short teaser (optional)" />
                </div>

                <div>
                    <label className={labelClass}>Full Description</label>
                    <textarea name="fullDescription" value={formValues.fullDescription} onChange={handleChange} rows={6} className={inputClass} placeholder="Describe your experience in detail..." />
                </div>

                <div>
                    <label className={labelClass}>Highlights</label>
                    <input name="highlights" value={formValues.highlights} onChange={handleChange} type="text" className={inputClass} placeholder="Key highlights (comma separated or sentence)" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Category</label>
                        <select name="category" value={formValues.category} onChange={handleChange} className={inputClass}>
                            <option value="">Select category</option>
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Cancellation Policy</label>
                        <select name="cancellationPolicy" value={formValues.cancellationPolicy} onChange={handleChange} className={inputClass}>
                            <option value="">Select policy</option>
                            {cancellationOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Tags</label>
                    <input name="tags" value={formValues.tags} onChange={handleChange} type="text" className={inputClass} placeholder="e.g. food, culture, walking" />
                </div>

                <div>
                    <label className={labelClass}>Cover Photo URL</label>
                    <input name="coverPhotoUrl" value={formValues.coverPhotoUrl} onChange={handleChange} type="url" className={inputClass} placeholder="https://..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>Price (SGD)</label>
                        <input name="price" value={formValues.price} onChange={handleChange} type="number" step="0.01" className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                        <label className={labelClass}>Participants Allowed</label>
                        <input name="participantsAllowed" value={formValues.participantsAllowed} onChange={handleChange} type="number" className={inputClass} placeholder="e.g. 10" />
                    </div>
                    <div>
                        <label className={labelClass}>Duration (hours)</label>
                        <input name="duration" value={formValues.duration} onChange={handleChange} type="number" step="0.5" className={inputClass} placeholder="e.g. 2.5" />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Location</label>
                    <input name="location" value={formValues.location} onChange={handleChange} type="text" className={inputClass} placeholder="Where did this experience take place?" />
                </div>

                <div>
                    <label className={labelClass}>What’s Included</label>
                    <textarea name="whatIncluded" value={formValues.whatIncluded} onChange={handleChange} rows={4} className={inputClass} placeholder="List items/services included (optional)" />
                </div>

                <div>
                    <label className={labelClass}>Important Info</label>
                    <textarea name="importantInfo" value={formValues.importantInfo} onChange={handleChange} rows={4} className={inputClass} placeholder="Things to note (optional)" />
                </div>

                {/* Placeholder for media upload - future enhancement */}
                <div>
                    <label className={labelClass}>Photos</label>
                    <div className="border-2 border-dashed border-neutrals-6 rounded-lg p-8 text-center text-neutrals-4">
                        Click to upload or drag and drop (coming soon)
                    </div>
                </div>

                <div className="flex gap-4 pt-2 flex-wrap">
                    <button type="submit" disabled={isSubmitting} className="bg-primary-1 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                        {isSubmitting ? 'Publishing...' : 'Publish Experience'}
                    </button>
                    <button type="button" onClick={() => setFormValues((v) => ({ ...v }))} className="border border-neutrals-6 text-neutrals-2 px-6 py-3 rounded-lg font-medium hover:bg-neutrals-7 transition-colors">
                        Save Draft (Local)
                    </button>
                </div>
            </div>
        </form>
    );
};

const CreateExperiencePage = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
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
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-4xl font-bold text-neutrals-1 mb-6">Create an Experience</h1>
                            <p className="text-lg text-neutrals-3 mb-8">
                                Share your unique travel experience with other travelers.
                            </p>
                            <ExperienceForm />
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
                        <h1 className="text-3xl font-bold text-neutrals-1 mb-6">Create an Experience</h1>
                        <p className="text-base text-neutrals-3 mb-8">
                            Share your unique travel experience with other travelers.
                        </p>
                        <ExperienceForm compact />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreateExperiencePage;
