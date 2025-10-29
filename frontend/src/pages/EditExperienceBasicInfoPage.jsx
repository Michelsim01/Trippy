import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, X, Camera, Upload, Plus, AlertCircle } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import { useExperienceAuth } from '../hooks/useExperienceAuth';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProgressSteps from '../components/create-experience/ProgressSteps';
import FormField from '../components/create-experience/FormField';
import ListManager from '../components/create-experience/ListManager';
import PhotoUpload from '../components/create-experience/PhotoUpload';
import LocationSearchInput from '../components/create-experience/LocationSearchInput';
import Swal from 'sweetalert2';

export default function EditExperienceBasicInfoPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    formData: contextData,
    updateFormData,
    categoryMapping,
    isEditMode,
    experienceId: contextExperienceId,
    isFieldRestricted,
    loadExistingExperience,
    saveCurrentChanges,
    savePartialChanges
  } = useFormData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoading: authLoading, authError } = useExperienceAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [currentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    highlights: [],
    category: "",
    location: null, // Now expects object with {name, latitude, longitude, country, city}
    country: "",
    tags: [],
    languages: [],
    participantsAllowed: "",
    coverPhotoUrl: "",
    additionalPhotos: []
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    category: false,
    duration: false
  });

  const [newHighlightItem, setNewHighlightItem] = useState("");

  const categories = Object.keys(categoryMapping);

  // Load existing experience data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Wait for authentication to be ready before loading experience data
      if (authLoading) {
        return; // Don't load data while auth is still loading
      }
      
      if (authError) {
        setIsLoading(false);
        return; // Don't load data if there's an auth error
      }
      
      if (id && (!isEditMode || contextExperienceId !== parseInt(id))) {
        try {
          await loadExistingExperience(id);
        } catch (error) {
          console.error('Failed to load experience data:', error);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [id, isEditMode, contextExperienceId, authLoading, authError]);

  // Update form data when context data changes
  useEffect(() => {
    if (contextData && isEditMode) {
      setFormData({
        title: contextData?.title || "",
        shortDescription: contextData?.shortDescription || "",
        highlights: contextData?.highlights || [],
        category: contextData?.category || "",
        location: contextData?.location || null,
        country: contextData?.country || "",
        tags: contextData?.tags || [],
        languages: contextData?.languages || [],
        participantsAllowed: contextData?.participantsAllowed || "",
        coverPhotoUrl: contextData?.coverPhotoUrl || "",
        additionalPhotos: contextData?.additionalPhotos || []
      });
    }
  }, [contextData, isEditMode]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-1"></div>
          <p className="mt-4 text-neutrals-3">Loading experience data...</p>
        </div>
      </div>
    );
  }

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: 'Cancel Editing?',
      text: 'Any unsaved changes will be lost. Are you sure you want to cancel?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF385C',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'Continue Editing'
    });

    if (result.isConfirmed) {
      navigate('/my-tours');
    }
  };

  const handleNext = async () => {
    if (!formData.title.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Title Required',
        text: 'Please enter a title for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.shortDescription.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Description Required',
        text: 'Please enter a short description for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.highlights || formData.highlights.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Highlights Required',
        text: 'Please add at least one highlight for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.category) {
      await Swal.fire({
        icon: 'warning',
        title: 'Category Required',
        text: 'Please select a category',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.location || !formData.location.name) {
      await Swal.fire({
        icon: 'warning',
        title: 'Location Required',
        text: 'Please select a location',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.participantsAllowed || parseInt(formData.participantsAllowed) <= 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Participants Required',
        text: 'Please enter maximum number of participants',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    // Prepare current page data
    const currentData = {
      title: formData.title.trim(),
      shortDescription: formData.shortDescription.trim(),
      highlights: formData.highlights,
      category: formData.category,
      location: formData.location,
      country: formData.location?.country || formData.country.trim(),
      tags: formData.tags,
      languages: formData.languages,
      participantsAllowed: formData.participantsAllowed,
      coverPhotoUrl: formData.coverPhotoUrl,
      additionalPhotos: formData.additionalPhotos
    };

    // Update context first
    updateFormData(currentData);

    // Auto-save changes before navigating
    try {
      setIsSaving(true);
      await savePartialChanges(currentData);
      // Navigate to next page after successful save
      navigate(`/edit-experience/${id}/details`);
    } catch (error) {
      console.error('Error auto-saving changes:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save changes. Please try again.',
        confirmButtonColor: '#FF385C'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addHighlightItem = () => {
    if (newHighlightItem.trim()) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, newHighlightItem.trim()]
      }));
      setNewHighlightItem("");
    }
  };

  const removeHighlightItem = (index) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = (event, isMain = true) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          if (isMain) {
            handleInputChange('coverPhotoUrl', result);
          } else {
            if (formData.additionalPhotos.length < 8) {
              handleInputChange('additionalPhotos', [...formData.additionalPhotos, result]);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for PhotoUpload component
  const handlePhotoChange = (data, isMain = true, isBulkUpdate = false) => {
    if (isMain) {
      handleInputChange('coverPhotoUrl', data);
    } else {
      if (isBulkUpdate) {
        // For bulk updates (like removing photos)
        handleInputChange('additionalPhotos', data);
      } else {
        // For adding new photos
        if (formData.additionalPhotos.length < 8) {
          handleInputChange('additionalPhotos', [...formData.additionalPhotos, data]);
        }
      }
    }
  };


  const handleInputChange = (field, value) => {
    // Don't allow changes to restricted fields when bookings exist
    if (isFieldRestricted(field)) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFieldDisabled = (fieldName) => {
    return isFieldRestricted(fieldName);
  };

  const getFieldWarning = (fieldName) => {
    if (isFieldRestricted(fieldName)) {
      return "This field cannot be modified because there are existing bookings for this experience.";
    }
    return null;
  };

  // Show loading while authentication is being checked
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1 mx-auto mb-4"></div>
          <p className="text-neutrals-3">Loading experience data...</p>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutrals-1 mb-2">Authentication Error</h2>
          <p className="text-neutrals-3 mb-4">{authError}</p>
          <button 
            onClick={() => navigate('/signin')}
            className="bg-primary-1 text-white px-6 py-2 rounded-full hover:opacity-90 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} variant="desktop" />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* Main Content - Centered with max width */}
          <div className="max-w-7xl mx-auto py-16" style={{paddingLeft: '20px', paddingRight: '20px'}}>

            <ProgressSteps currentStep={1} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              {/* Left Column - Form Fields */}
              <div className="lg:col-span-3">

                  <FormField
                    label="Title"
                    type="text"
                    value={formData.title}
                    onChange={(value) => handleInputChange('title', value)}
                    placeholder="Enter your experience title"
                    isMobile={false}
                  />

                  <FormField
                    label="Short Description"
                    type="textarea"
                    value={formData.shortDescription}
                    onChange={(value) => handleInputChange('shortDescription', value)}
                    placeholder="Brief description of your experience"
                    style={{height: '144px'}}
                    isMobile={false}
                  />

                  <ListManager
                    label="Highlights"
                    items={formData.highlights}
                    onItemsChange={(newItems) => handleInputChange('highlights', newItems)}
                    placeholder="Add highlight..."
                    isMobile={false}
                  />

                  <FormField
                    label="Category"
                    type="dropdown"
                    value={formData.category}
                    onChange={(value) => handleInputChange('category', value)}
                    placeholder="Select category"
                    options={categories}
                    isOpen={dropdownOpen.category}
                    onToggle={() => setDropdownOpen(prev => ({ ...prev, category: !prev.category }))}
                    onSelect={(value) => {
                      handleInputChange('category', value);
                      setDropdownOpen(prev => ({ ...prev, category: false }));
                    }}
                    isMobile={false}
                  />


                  {/* Country */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Country</label>
                    {getFieldWarning('country') && (
                      <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-orange-700">{getFieldWarning('country')}</p>
                        </div>
                      </div>
                    )}
                    <input style={{padding: '6px'}}
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled={isFieldDisabled('country')}
                      className={`w-full px-6 py-5 border-2 rounded-xl focus:outline-none text-lg font-medium transition-colors ${
                        isFieldDisabled('country')
                          ? 'border-neutrals-6 bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                          : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                      }`}
                      placeholder="Enter country"
                    />
                  </div>

                  <LocationSearchInput
                    label="Location/Meeting Point"
                    value={formData.location}
                    onChange={(locationData) => {
                      handleInputChange('location', locationData);
                      // Auto-populate country from location data
                      if (locationData?.country) {
                        handleInputChange('country', locationData.country);
                      }
                    }}
                    placeholder="Search for a location..."
                    isMobile={false}
                    required={true}
                  />

                  {/* Max Participants */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Max Participants</label>
                    {getFieldWarning('participantsAllowed') && (
                      <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-orange-700">{getFieldWarning('participantsAllowed')}</p>
                        </div>
                      </div>
                    )}
                    <input style={{padding: '6px'}}
                      type="number"
                      min="1"
                      max="50"
                      value={formData.participantsAllowed}
                      onChange={(e) => handleInputChange('participantsAllowed', e.target.value)}
                      disabled={isFieldDisabled('participantsAllowed')}
                      className={`w-full px-6 py-5 border-2 rounded-xl focus:outline-none text-lg font-medium transition-colors ${
                        isFieldDisabled('participantsAllowed')
                          ? 'border-neutrals-6 bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                          : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                      }`}
                      placeholder="Enter max participants"
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
                            <button
                              onClick={() => handleInputChange('tags', formData.tags.filter(t => t !== tag))}
                              className="hover:opacity-70 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input style={{padding: '6px'}}
                        type="text"
                        placeholder="Add tags..."
                        className="w-full focus:outline-none text-lg font-medium placeholder-neutrals-4"
                        onKeyDown={(e) => {
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

                  {/* Action Buttons */}
                  <div className="pt-8 flex gap-4">
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-red-500 border-2 border-neutrals-5 text-white font-bold py-6 rounded-full hover:bg-red-600 transition-colors text-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={isSaving}
                      className="flex-1 bg-primary-1 text-white font-bold py-6 rounded-full hover:opacity-90 transition-colors text-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Next'}
                    </button>
                  </div>

                </div>

                {/* Right Column - Photo Upload (2/5 width) */}
                <div className="lg:col-span-2 space-y-12">
                  <PhotoUpload
                    type="cover"
                    coverPhoto={formData.coverPhotoUrl}
                    onPhotoChange={handlePhotoChange}
                    isMobile={false}
                  />

                  <PhotoUpload
                    type="additional"
                    additionalPhotos={formData.additionalPhotos}
                    onPhotoChange={handlePhotoChange}
                    isMobile={false}
                  />
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
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} variant="mobile" />

        <main className="w-full">
          <div className="py-10" style={{paddingLeft: '20px', paddingRight: '20px'}}>

            {/* Title and Progress */}
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Edit Experience - Basic Information</h1>
              <ProgressSteps currentStep={1} isMobile={true} />
            </div>

            {/* Mobile Form Fields - Full Width */}
            <div>
              <FormField
                label="Title"
                type="text"
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                placeholder="Enter your experience title"
                isMobile={true}
              />

              <FormField
                label="Short Description"
                type="textarea"
                value={formData.shortDescription}
                onChange={(value) => handleInputChange('shortDescription', value)}
                placeholder="Brief description of your experience"
                style={{height: '128px'}}
                isMobile={true}
              />

              <ListManager
                label="Highlights"
                items={formData.highlights}
                onItemsChange={(newItems) => handleInputChange('highlights', newItems)}
                placeholder="Add highlight..."
                isMobile={true}
              />

              <FormField
                label="Category"
                type="dropdown"
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
                placeholder="Select category"
                options={categories}
                isOpen={dropdownOpen.category}
                onToggle={() => setDropdownOpen(prev => ({ ...prev, category: !prev.category }))}
                onSelect={(value) => {
                  handleInputChange('category', value);
                  setDropdownOpen(prev => ({ ...prev, category: false }));
                }}
                isMobile={true}
              />


              {/* Country */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Country</label>
                {getFieldWarning('country') && (
                  <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-1">
                      <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-orange-700">{getFieldWarning('country')}</p>
                    </div>
                  </div>
                )}
                <input style={{padding: '6px'}}
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  disabled={isFieldDisabled('country')}
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none text-sm font-medium transition-colors ${
                    isFieldDisabled('country')
                      ? 'border-neutrals-6 bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                      : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                  }`}
                  placeholder="Enter country"
                />
              </div>

              <LocationSearchInput
                label="Location/Meeting Point"
                value={formData.location}
                onChange={(locationData) => {
                  handleInputChange('location', locationData);
                  // Auto-populate country from location data
                  if (locationData?.country) {
                    handleInputChange('country', locationData.country);
                  }
                }}
                placeholder="Search for a location..."
                isMobile={true}
                required={true}
              />

              {/* Max Participants */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Max Participants</label>
                {getFieldWarning('participantsAllowed') && (
                  <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-1">
                      <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-orange-700">{getFieldWarning('participantsAllowed')}</p>
                    </div>
                  </div>
                )}
                <input style={{padding: '6px'}}
                  type="number"
                  min="1"
                  max="50"
                  value={formData.participantsAllowed}
                  onChange={(e) => handleInputChange('participantsAllowed', e.target.value)}
                  disabled={isFieldDisabled('participantsAllowed')}
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none text-sm font-medium transition-colors ${
                    isFieldDisabled('participantsAllowed')
                      ? 'border-neutrals-6 bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                      : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                  }`}
                  placeholder="Enter max participants"
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
                        <button
                          onClick={() => handleInputChange('tags', formData.tags.filter(t => t !== tag))}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input style={{padding: '6px'}}
                    type="text"
                    placeholder="Add tags..."
                    className="w-full focus:outline-none text-sm font-medium text-neutrals-2 transition-colors"
                    onKeyDown={(e) => {
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

              <PhotoUpload
                type="cover"
                coverPhoto={formData.coverPhotoUrl}
                onPhotoChange={handlePhotoChange}
                isMobile={true}
              />

              <PhotoUpload
                type="additional"
                additionalPhotos={formData.additionalPhotos}
                onPhotoChange={handlePhotoChange}
                isMobile={true}
              />

              {/* Action Buttons */}
              <div style={{marginBottom: '20px'}}>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-red-500 border-2 border-neutrals-5 text-neutrals-2 font-bold py-4 rounded-full hover:bg-neutrals-7 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={isSaving}
                    className="flex-1 bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}