import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X, Camera, Upload } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function CreateExperienceBasicInfoPage() {
  const navigate = useNavigate();
  const { formData: contextData, updateFormData, categoryMapping } = useFormData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: contextData?.title || "",
    shortDescription: contextData?.shortDescription || "",
    highlights: contextData?.highlights || "",
    category: contextData?.category || "",
    duration: contextData?.duration || "",
    location: contextData?.location || "",
    tags: contextData?.tags || [],
    languages: contextData?.languages || [],
    participantsAllowed: contextData?.participantsAllowed || "",
    coverPhotoUrl: contextData?.coverPhotoUrl || "",
    additionalPhotos: contextData?.additionalPhotos || []
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    category: false,
    duration: false
  });

  const categories = Object.keys(categoryMapping);
  const durations = ["0.5", "1", "2", "3", "4", "6", "8", "12"];
  const durationLabels = {
    "0.5": "30 minutes", "1": "1 hour", "2": "2 hours", "3": "3 hours",
    "4": "4 hours", "6": "6 hours", "8": "8 hours", "12": "12 hours"
  };

  const handleNext = () => {
    if (!formData.title.trim()) {
      alert('Please enter a title for your experience');
      return;
    }
    if (!formData.category) {
      alert('Please select a category');
      return;
    }
    if (!formData.location.trim()) {
      alert('Please enter a location');
      return;
    }

    updateFormData({
      title: formData.title.trim(),
      shortDescription: formData.shortDescription.trim(),
      highlights: formData.highlights.trim(),
      category: formData.category,
      duration: formData.duration,
      location: formData.location.trim(),
      tags: formData.tags,
      languages: formData.languages,
      participantsAllowed: formData.participantsAllowed,
      coverPhotoUrl: formData.coverPhotoUrl,
      additionalPhotos: formData.additionalPhotos
    });
    
    navigate('/create-experience/details');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDropdownSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDropdownOpen(prev => ({ ...prev, [field]: false }));
  };

  const toggleDropdown = (field) => {
    setDropdownOpen(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const removeLanguage = (language) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.filter((l) => l !== language) }));
  };

  const handlePhotoUpload = (event, isMain = true) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          if (isMain) {
            setFormData(prev => ({ ...prev, coverPhotoUrl: result }));
          } else {
            setFormData(prev => ({
              ...prev,
              additionalPhotos: [...prev.additionalPhotos, result]
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

          {/* Main Content - Centered with max width */}
          <div className="max-w-7xl mx-auto py-16" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            {/* Header */}
            <div className="mb-16">
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{marginBottom: '30px'}}>Create New Experience</h1>
              
              {/* Progress Steps - Fixed Structure */}
              <div className="flex items-start gap-16" style={{marginBottom: '30px'}}>
                {[
                  { step: 1, label: "Basic Info", active: true },
                  { step: 2, label: "Details", active: false },
                  { step: 3, label: "Pricing", active: false },
                  { step: 4, label: "Availability", active: false }
                ].map((item) => (
                  <div key={item.step} className="flex flex-col">
                    {/* Step Circle and Label */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                        item.active ? 'bg-neutrals-1' : 'bg-neutrals-5'
                      }`}>
                        {item.step}
                      </div>
                      <span className={`text-lg font-semibold ${
                        item.active ? 'text-neutrals-1' : 'text-neutrals-5'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {/* Underline - extends to start of next circle */}
                    <div 
                      style={{
                        backgroundColor: item.active ? '#000' : '#d1d5db',
                        width: item.active ? '240px' : '240px',
                        height: item.active ? '4px' : '2px',
                        marginTop: '4px'
                      }} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Two Column Layout - Better proportions */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              {/* Left Column - Form Fields (3/5 width) */}
              <div className="lg:col-span-3">
                {/* Title */}
                <div style={{marginBottom: '15px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Title</label>
                  <input style={{padding: '6px'}}
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors"
                    placeholder="Tokyo: Shinjuku Food Tour (15 Dishes and 4 Eateries)"
                  />
                </div>

                {/* Short Description */}
                <div style={{marginBottom: '15px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Short Description</label>
                  <textarea style={{padding: '6px'}}
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 h-36 resize-none text-lg font-medium text-neutrals-2 transition-colors"
                    placeholder="Explore Tokyo's nightlife like a local on this small-group tour through Shinjuku, learning its history and culture while enjoying 13 traditional dishes from a izakaya, gastro bar, and food stalls!"
                  />
                </div>

                {/* Highlights */}
                <div style={{marginBottom: '15px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Highlights</label>
                  <div className="border-2 border-neutrals-5 rounded-xl p-6">
                    <textarea style={{padding: '6px'}}
                      value={formData.highlights}
                      onChange={(e) => handleInputChange('highlights', e.target.value)}
                      className="w-full focus:outline-none text-lg font-medium h-48 resize-none"
                      placeholder="• Explore hidden gems and uncover Tokyo's authentic local cuisine&#10;• Great introduction to the nightlife in Shinjuku&#10;• Enjoy a variety of up to 13 distinct Japanese dishes&#10;• Step into a Japanese culture with culinary history and traditions&#10;• Small-group tour (Maximum 10 guests for a more personal and intimate experience)"
                    />
                  </div>
                </div>

                {/* Category and Duration */}
                <div className="grid grid-cols-2 gap-12" style={{marginBottom: '15px'}}>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Category</label>
                    <div className="relative">
                      <button style={{padding: '6px'}}
                        onClick={() => toggleDropdown('category')}
                        className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl flex items-center justify-between text-left text-lg font-medium text-neutrals-2 transition-colors hover:border-neutrals-4"
                      >
                        <span className={formData.category ? "" : "text-neutrals-5"}>{formData.category || "Select category"}</span>
                        <ChevronDown className="w-6 h-6 text-neutrals-4" />
                      </button>
                      {dropdownOpen.category && (
                        <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-10">
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => handleDropdownSelect('category', cat)}
                              className="w-full px-6 py-4 text-left hover:bg-neutrals-7 text-lg font-medium first:rounded-t-xl last:rounded-b-xl transition-colors"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Duration</label>
                    <div className="relative">
                      <button style={{padding: '6px'}}
                        onClick={() => toggleDropdown('duration')}
                        className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl flex items-center justify-between text-left text-lg font-medium text-neutrals-2 transition-colors hover:border-neutrals-4"
                      >
                        <span className={formData.duration ? "" : "text-neutrals-5"}>{formData.duration ? durationLabels[formData.duration] : "Select duration"}</span>
                        <ChevronDown className="w-6 h-6 text-neutrals-4" />
                      </button>
                      {dropdownOpen.duration && (
                        <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-10">
                          {durations.map(dur => (
                            <button
                              key={dur}
                              onClick={() => handleDropdownSelect('duration', dur)}
                              className="w-full px-6 py-4 text-left hover:bg-neutrals-7 text-lg font-medium first:rounded-t-xl last:rounded-b-xl transition-colors"
                            >
                              {durationLabels[dur]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div style={{marginBottom: '15px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Location/Meeting Point</label>
                  <input style={{padding: '6px'}}
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors"
                    placeholder="Starbucks Coffee - Shinjuku Nishiguchi"
                  />
                </div>

                {/* Max Participants */}
                <div style={{marginBottom: '15px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Max Participants</label>
                  <input style={{padding: '6px'}}
                    type="number"
                    min="1"
                    max="50"
                    value={formData.participantsAllowed}
                    onChange={(e) => handleInputChange('participantsAllowed', e.target.value)}
                    className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors"
                    placeholder="10"
                  />
                </div>

                {/* Tags */}
                <div style={{marginBottom: '50px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Tags/Keywords</label>
                  <div className="border-2 border-neutrals-5 rounded-xl p-6">
                    <div className="flex flex-wrap gap-3 mb-4" style={{paddingLeft: '6px'}}>
                      {formData.tags.map((tag) => (
                        <div key={tag} className="bg-neutrals-1 text-white px-4 py-2 rounded-full flex items-center gap-3 text-base font-medium">
                          <span>{tag}</span>
                          <button onClick={() => removeTag(tag)} className="hover:opacity-70 transition-opacity">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input style={{padding: '6px'}}
                      type="text"
                      placeholder="Add tags..."
                      className="w-full focus:outline-none text-lg font-medium placeholder-neutrals-4"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.target.value.trim()) {
                            handleInputChange('tags', [...formData.tags, e.target.value.trim()]);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Next Button */}
                <div className="pt-8">
                  <button
                    onClick={handleNext}
                    className="w-full bg-primary-1 text-white font-bold py-6 rounded-full hover:opacity-90 transition-colors text-xl shadow-lg hover:shadow-xl"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Right Column - Photo Upload (2/5 width) */}
              <div className="lg:col-span-2 space-y-12">
                {/* Cover Photo */}
                <div>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cover Photo</label>
                  <div className="relative" style={{marginBottom: '30px'}}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, true)}
                      className="hidden"
                      id="cover-photo-desktop"
                    />
                    <label
                      htmlFor="cover-photo-desktop"
                      className="block w-full h-[500px] border-2 border-dashed border-neutrals-4 rounded-2xl cursor-pointer hover:border-primary-1 transition-all duration-300 hover:shadow-lg"
                    >
                      {formData.coverPhotoUrl ? (
                        <img src={formData.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-12">
                          <Camera className="w-24 h-24 text-neutrals-4 mb-8" />
                          <p className="text-xl font-semibold  mb-4">Click to upload your main experience photo</p>
                          <p className="text-lg text-neutrals-4 mb-2">JPG, PNG up to 5MB</p>
                          <p className="text-base text-neutrals-5">Recommended: 1200x800px</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Additional Photos */}
                <div>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Additional Photos (Optional)</label>
                  
                  {/* Display uploaded photos */}
                  {formData.additionalPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {formData.additionalPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={photo} 
                            alt={`Additional photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl"
                          />
                          <button
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                additionalPhotos: prev.additionalPhotos.filter((_, i) => i !== index)
                              }));
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Upload area */}
                  <div className="relative" style={{marginBottom: '30px'}}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, false)}
                      className="hidden"
                      id="additional-photos-desktop"
                      multiple
                    />
                    <label
                      htmlFor="additional-photos-desktop"
                      className="block w-full h-80 border-2 border-dashed border-neutrals-4 rounded-2xl cursor-pointer hover:border-primary-1 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex flex-col items-center justify-center h-full text-center p-10">
                        <Upload className="w-20 h-20 text-neutrals-4 mb-6" />
                        <p className="text-xl font-semibold  mb-4">Upload additional photos (up to 8)</p>
                        <p className="text-lg text-neutrals-4">Show different aspects of your experience</p>
                        {formData.additionalPhotos.length > 0 && (
                          <p className="text-sm text-primary-1 mt-2">{formData.additionalPhotos.length} photo(s) uploaded</p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar
          isAuthenticated={true}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        
        <main className="w-full">
          <div className="py-10" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            {/* Title and Progress */}
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Create New Experience</h1>
              
              {/* Mobile Progress Steps - Current Step Only */}
              <div className="flex gap-4 items-center" style={{marginBottom: '20px'}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-neutrals-2">
                  1
                </div>
                <span className="text-base font-medium text-neutrals-1">
                  Basic Info
                </span>
              </div>
            </div>

            {/* Mobile Form Fields - Full Width */}
            <div>
              {/* Title */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Title</label>
                <input style={{padding: '6px'}}
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors"
                  placeholder="Enter your experience title"
                />
              </div>

              {/* Short Description */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Short Description</label>
                <textarea style={{padding: '6px'}}
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors  h-32 resize-none"
                  placeholder="Brief description for the experience"
                />
              </div>

              {/* Highlights */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Highlights</label>
                <textarea style={{padding: '6px'}}
                  value={formData.highlights}
                  onChange={(e) => handleInputChange('highlights', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors  h-40 resize-none"
                  placeholder="Key highlights of your experience"
                />
              </div>

              {/* Category and Duration */}
              <div className="grid grid-cols-2 gap-4" style={{marginBottom: '10px'}}>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Category</label>
                  <div className="relative">
                    <button style={{padding: '6px'}}
                      onClick={() => toggleDropdown('category')}
                      className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl flex items-center justify-between text-left text-sm font-medium text-neutrals-2 transition-colors "
                    >
                      <span className={formData.category ? "" : "text-neutrals-5"}>{formData.category || "Select category"}</span>
                      <ChevronDown className="w-4 h-4 text-neutrals-4" />
                    </button>
                    {dropdownOpen.category && (
                      <div className="absolute top-full mt-1 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-10">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => handleDropdownSelect('category', cat)}
                            className="w-full px-4 py-3 text-left hover:bg-neutrals-7 text-sm first:rounded-t-xl last:rounded-b-xl"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Duration</label>
                  <div className="relative">
                    <button style={{padding: '6px'}}
                      onClick={() => toggleDropdown('duration')}
                      className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl flex items-center justify-between text-left text-sm font-medium text-neutrals-2 transition-colors "
                    >
                      <span className={formData.duration ? "" : "text-neutrals-5"}>{formData.duration ? durationLabels[formData.duration] : "Select duration"}</span>
                      <ChevronDown className="w-4 h-4 text-neutrals-4" />
                    </button>
                    {dropdownOpen.duration && (
                      <div className="absolute top-full mt-1 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-10">
                        {durations.map(dur => (
                          <button
                            key={dur}
                            onClick={() => handleDropdownSelect('duration', dur)}
                            className="w-full px-4 py-3 text-left hover:bg-neutrals-7 text-sm first:rounded-t-xl last:rounded-b-xl"
                          >
                            {durationLabels[dur]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Location/Meeting Point</label>
                <input style={{padding: '6px'}}
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors "
                  placeholder="Where does your experience take place?"
                />
              </div>

              {/* Max Participants */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Max Participants</label>
                <input style={{padding: '6px'}}
                  type="number"
                  min="1"
                  max="50"
                  value={formData.participantsAllowed}
                  onChange={(e) => handleInputChange('participantsAllowed', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors "
                  placeholder="e.g. 10"
                />
              </div>

              {/* Tags */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Tags/Keywords</label>
                <div className="border-2 border-neutrals-5 rounded-xl p-3">
                  <div className="flex flex-wrap gap-2 mb-3" style={{paddingLeft: '6px'}}>
                    {formData.tags.map((tag) => (
                      <div key={tag} className="bg-neutrals-1 text-white px-4 py-1 rounded-full flex items-center gap-2">
                        <span className="text-sm">{tag}</span>
                        <button onClick={() => removeTag(tag)} className="hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input style={{padding: '6px'}}
                    type="text"
                    placeholder="Add tags..."
                    className="w-full focus:outline-none text-sm font-medium text-neutrals-2 transition-colors "
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.target.value.trim()) {
                          handleInputChange('tags', [...formData.tags, e.target.value.trim()]);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>


              {/* Cover Photo */}
              <div>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cover Photo</label>
                <div className="relative" style={{marginBottom: '15px'}}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, true)}
                    className="hidden"
                    id="cover-photo-mobile"
                  />
                  <label
                    htmlFor="cover-photo-mobile"
                    className="block w-full h-64 border-2 border-dashed border-neutrals-4 rounded-xl cursor-pointer hover:border-primary-1 transition-colors"
                  >
                    {formData.coverPhotoUrl ? (
                      <img src={formData.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <Camera className="w-16 h-16 text-neutrals-4 mb-4" />
                        <p className="text-sm font-bold  mb-2">Click to upload your main</p>
                        <p className="text-sm font-bold  mb-2">experience photo</p>
                        <p className="text-xs text-neutrals-4">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Additional Photos */}
              <div style={{marginBottom: '20px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Additional Photos (Optional)</label>
                    
                {/* Display uploaded photos */}
                {formData.additionalPhotos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {formData.additionalPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={photo} 
                          alt={`Additional photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              additionalPhotos: prev.additionalPhotos.filter((_, i) => i !== index)
                            }));
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload area */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, false)}
                    className="hidden"
                    id="additional-photos-mobile"
                    multiple
                  />
                  <label
                    htmlFor="additional-photos-mobile"
                    className="block w-full h-64 border-2 border-dashed border-neutrals-4 rounded-xl cursor-pointer hover:border-primary-1 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <Camera className="w-16 h-16 text-neutrals-4 mb-4" />
                      <p className="text-sm font-bold  mb-2">Upload additional photos (up to 8)</p>
                      <p className="text-xs text-neutrals-4">Show different aspects of your experience</p>
                      {formData.additionalPhotos.length > 0 && (
                        <p className="text-xs text-primary-1 mt-2">{formData.additionalPhotos.length} photo(s) uploaded</p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Next Button */}
              <div style={{marginBottom: '20px'}}>
                <button
                  onClick={handleNext}
                  className="w-full bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}