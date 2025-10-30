import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X, Plus, AlertCircle } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import { useExperienceAuth } from '../hooks/useExperienceAuth';
import { isMultiDayTour } from '../utils/scheduleGenerator';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProgressSteps from '../components/create-experience/ProgressSteps';
import FormField from '../components/create-experience/FormField';
import ListManager from '../components/create-experience/ListManager';
import PhotoUpload from '../components/create-experience/PhotoUpload';
import LocationSearchInput from '../components/create-experience/LocationSearchInput';
import Swal from 'sweetalert2';

export default function CreateExperienceBasicInfoPage() {
  const navigate = useNavigate();
  const { formData: contextData, updateFormData, categoryMapping } = useFormData();
  const { user, isAuthenticated, isLoading, authError } = useExperienceAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [currentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: contextData?.title || "",
    shortDescription: contextData?.shortDescription || "",
    highlights: Array.isArray(contextData?.highlights) ? contextData.highlights : [],
    category: contextData?.category || "",
    duration: contextData?.duration || "",
    startDateTime: contextData?.startDateTime || "",
    endDateTime: contextData?.endDateTime || "",
    location: contextData?.location || null, // Now expects object with {name, latitude, longitude, country, city}
    country: contextData?.country || "",
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

  // Show loading or error state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-4 font-poppins">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutrals-1 mb-2">Access Denied</h2>
          <p className="text-neutrals-4 mb-4">{authError}</p>
          <p className="text-sm text-neutrals-3">Redirecting you shortly...</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (!formData.title.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Title',
        text: 'Please enter a title for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.shortDescription.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Description',
        text: 'Please enter a short description for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!Array.isArray(formData.highlights) || formData.highlights.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Highlights',
        text: 'Please add at least one highlight for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.category) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Category',
        text: 'Please select a category for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.startDateTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Start Date/Time',
        text: 'Please select a start date and time for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.endDateTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing End Date/Time',
        text: 'Please select an end date and time for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.location || !formData.location.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Location',
        text: 'Please select a location for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (!formData.participantsAllowed || formData.participantsAllowed <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Participants',
        text: 'Please enter the maximum number of participants',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    if (!formData.coverPhotoUrl) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Cover Photo',
        text: 'Please upload a cover photo for your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    updateFormData({
      title: formData.title.trim(),
      shortDescription: formData.shortDescription.trim(),
      highlights: formData.highlights,
      category: formData.category,
      duration: formData.duration,
      startDateTime: formData.startDateTime,
      endDateTime: formData.endDateTime,
      location: formData.location,
      country: formData.location?.country || formData.country.trim(),
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



  // Helper function to check if tour spans multiple days
  const isMultiDay = (startDateTime, endDateTime) => {
    if (!startDateTime || !endDateTime) return false;
    return isMultiDayTour(startDateTime, endDateTime);
  };

  // Helper function to calculate duration between start and end times
  const calculateDuration = (startDateTime, endDateTime) => {
    if (!startDateTime || !endDateTime) return '';
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs <= 0) return '';
    
    const totalHours = diffMs / (1000 * 60 * 60);
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    // Always show duration in hours (backend expects hours)
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} hours`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  };


  const handleDateTimeChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    if (field === 'startDateTime' || field === 'endDateTime') {
      const duration = calculateDuration(
        field === 'startDateTime' ? value : formData.startDateTime,
        field === 'endDateTime' ? value : formData.endDateTime
      );
      newData.duration = duration;
    }
    
    setFormData(newData);
  };

  const handlePhotoChange = (photo, isMain = true, isBulkUpdate = false) => {
    if (isBulkUpdate) {
      // For removing additional photos (photo is the new array)
      setFormData(prev => ({ ...prev, additionalPhotos: photo }));
    } else if (isMain) {
      // Cover photo
      setFormData(prev => ({ ...prev, coverPhotoUrl: photo }));
    } else {
      // Adding additional photo
      setFormData(prev => ({
        ...prev,
        additionalPhotos: [...prev.additionalPhotos, photo]
      }));
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
              <ProgressSteps currentStep={1} />
            </div>

            {/* Two Column Layout - Better proportions */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              {/* Left Column - Form Fields (3/5 width) */}
              <div className="lg:col-span-3">
                {/* Title */}
                <FormField
                  label="Title"
                  value={formData.title}
                  onChange={(value) => handleInputChange('title', value)}
                  placeholder="Enter your experience title"
                />

                {/* Short Description */}
                <FormField
                  label="Short Description"
                  type="textarea"
                  value={formData.shortDescription}
                  onChange={(value) => handleInputChange('shortDescription', value)}
                  placeholder="Brief description of your experience"
                  style={{height: '144px'}}
                />

                {/* Highlights */}
                <ListManager
                  label="Highlights"
                  items={formData.highlights}
                  onItemsChange={(newHighlights) => handleInputChange('highlights', newHighlights)}
                  placeholder="Add highlight..."
                />

                <FormField
                  label="Category"
                  type="dropdown"
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value)}
                  placeholder="Select category"
                  options={categories}
                  isOpen={dropdownOpen.category}
                  onToggle={() => toggleDropdown('category')}
                  onSelect={(value) => handleDropdownSelect('category', value)}
                  isMobile={false}
                />

                {/* Start and End Date/Time */}
                <div className="grid grid-cols-2 gap-12" style={{marginBottom: '5px'}}>
                  <FormField
                    label="Start Date & Time"
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(value) => handleDateTimeChange('startDateTime', value)}
                    isMobile={false}
                  />

                  <FormField
                    label="End Date & Time"
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(value) => handleDateTimeChange('endDateTime', value)}
                    isMobile={false}
                  />
                </div>

                {/* Duration Display and Multi-day Indicator */}
                {formData.startDateTime && formData.endDateTime && (
                  <div style={{marginBottom: '15px'}}>
                    <div className="flex items-center gap-4 bg-neutrals-7 px-6 py-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold uppercase text-neutrals-5">Duration:</span>
                        <span className="text-lg font-semibold text-neutrals-1">{formData.duration}</span>
                      </div>
                      {isMultiDay(formData.startDateTime, formData.endDateTime) && (
                        <div className="flex items-center gap-2 ml-auto">
                          <AlertCircle className="w-5 h-5 text-primary-1" />
                          <span className="text-sm font-semibold text-primary-1">Multi-day Experience</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                <FormField
                  label="Country"
                  value={formData.location?.country || formData.country}
                  onChange={(value) => handleInputChange('country', value)}
                  placeholder="Enter country"
                  isMobile={false}
                />

                <FormField
                  label="Max Participants"
                  type="number"
                  value={formData.participantsAllowed}
                  onChange={(value) => handleInputChange('participantsAllowed', value)}
                  placeholder="Enter max participants"
                  min="1"
                  max="50"
                  isMobile={false}
                />

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
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        
        <main className="w-full">
          <div className="py-10" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            {/* Title and Progress */}
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Create New Experience</h1>
              
              {/* Mobile Progress Steps - Current Step Only */}
              <ProgressSteps currentStep={1} isMobile={true} />
            </div>

            {/* Mobile Form Fields - Full Width */}
            <div>
              {/* Title */}
              <FormField
                label="Title"
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                placeholder="Enter your experience title"
                isMobile={true}
              />

              {/* Short Description */}
              <FormField
                label="Short Description"
                type="textarea"
                value={formData.shortDescription}
                onChange={(value) => handleInputChange('shortDescription', value)}
                placeholder="Brief description of your experience"
                style={{height: '128px'}}
                isMobile={true}
              />

              {/* Highlights */}
              <ListManager
                label="Highlights"
                items={formData.highlights}
                onItemsChange={(newHighlights) => handleInputChange('highlights', newHighlights)}
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
                onToggle={() => toggleDropdown('category')}
                onSelect={(value) => handleDropdownSelect('category', value)}
                isMobile={true}
              />

              {/* Start and End Date/Time */}
              <div className="grid grid-cols-2 gap-4" style={{marginBottom: '5px'}}>
                <FormField
                  label="Start Date & Time"
                  type="datetime-local"
                  value={formData.startDateTime}
                  onChange={(value) => handleDateTimeChange('startDateTime', value)}
                  isMobile={true}
                />

                <FormField
                  label="End Date & Time"
                  type="datetime-local"
                  value={formData.endDateTime}
                  onChange={(value) => handleDateTimeChange('endDateTime', value)}
                  isMobile={true}
                />
              </div>

              {/* Duration Display and Multi-day Indicator */}
              {formData.startDateTime && formData.endDateTime && (
                <div style={{marginBottom: '10px'}}>
                  <div className="flex items-center gap-3 bg-neutrals-7 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-neutrals-5">Duration:</span>
                      <span className="text-sm font-semibold text-neutrals-1">{formData.duration}</span>
                    </div>
                    {isMultiDay(formData.startDateTime, formData.endDateTime) && (
                      <div className="flex items-center gap-1 ml-auto">
                        <AlertCircle className="w-4 h-4 text-primary-1" />
                        <span className="text-xs font-semibold text-primary-1">Multi-day</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              <FormField
                label="Country"
                value={formData.location?.country || formData.country}
                onChange={(value) => handleInputChange('country', value)}
                placeholder="Enter country"
                isMobile={true}
              />

              <FormField
                label="Max Participants"
                type="number"
                value={formData.participantsAllowed}
                onChange={(value) => handleInputChange('participantsAllowed', value)}
                placeholder="Enter max participants"
                min="1"
                max="50"
                isMobile={true}
              />

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