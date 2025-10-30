import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Clock, MapPin, ChevronDown, Flag, Navigation, MapPinIcon, AlertCircle } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProgressSteps from '../components/create-experience/ProgressSteps';
import FormField from '../components/create-experience/FormField';
import ListManager from '../components/create-experience/ListManager';
import ItineraryBuilder from '../components/create-experience/ItineraryBuilder';
import Swal from 'sweetalert2';
import { validateItineraryDuration, checkAdjacentStopsDistance } from '../utils/itineraryValidation';

export default function EditExperienceDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    formData: contextData,
    updateFormData,
    isEditMode,
    isFieldRestricted,
    loadExistingExperience,
    saveCurrentChanges,
    savePartialChanges
  } = useFormData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullDescription: "",
    whatIsIncluded: [],
    importantInfo: "",
    itinerary: []
  });


  // Load existing experience data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (id && !isEditMode) {
        await loadExistingExperience(id);
      }
      setIsLoading(false);
    };
    loadData();
  }, [id, isEditMode, loadExistingExperience]);

  // Update form data when context data changes (for edit mode)
  useEffect(() => {
    if (contextData && isEditMode) {
      setFormData({
        fullDescription: contextData?.fullDescription || "",
        whatIsIncluded: contextData?.whatIncluded ?
          (typeof contextData.whatIncluded === 'string' ?
            contextData.whatIncluded.split(', ').filter(item => item.trim()) :
            contextData.whatIncluded) : [],
        importantInfo: contextData?.importantInfo || "",
        itinerary: contextData?.itinerary || []
      });
    }
  }, [contextData, isEditMode]);


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
    if (!formData.fullDescription.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Description Required',
        text: 'Please enter a full description',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (formData.whatIsIncluded.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'What\'s Included Required',
        text: 'Please add at least one item to what is included',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    // Check if itinerary has items (multi-location) and validate end point
    if (formData.itinerary.length > 0) {
      const hasEndPoint = formData.itinerary.some(item => item.type === 'end');
      if (!hasEndPoint) {
        await Swal.fire({
          icon: 'warning',
          title: 'End Point Required',
          text: 'Please add an end point to complete your itinerary',
          confirmButtonColor: '#FF385C'
        });
        return;
      }

      // Validation 1: Check that total stop durations don't exceed experience duration
      const durationValidation = validateItineraryDuration(
        formData.itinerary,
        contextData?.startDateTime,
        contextData?.endDateTime
      );

      if (!durationValidation.valid) {
        await Swal.fire({
          icon: 'error',
          title: 'Duration Mismatch',
          html: durationValidation.message,
          confirmButtonColor: '#FF385C',
          confirmButtonText: 'OK'
        });
        return;
      }

      // Validation 2: Check for unrealistic distances between adjacent stops
      const distanceWarnings = checkAdjacentStopsDistance(formData.itinerary);

      if (distanceWarnings.length > 0) {
        // Build warning message
        let warningHtml = '<div style="text-align: left;">';
        warningHtml += '<p style="margin-bottom: 10px;">The following stops are very far apart:</p>';
        warningHtml += '<ul style="margin-left: 20px; margin-bottom: 10px;">';

        distanceWarnings.forEach(warning => {
          const fromLabel = warning.fromType === 'start' ? 'Start' :
            warning.fromType === 'end' ? 'End' : 'Stop';
          const toLabel = warning.toType === 'start' ? 'Start' :
            warning.toType === 'end' ? 'End' : 'Stop';

          warningHtml += `<li style="margin-bottom: 8px;">
            <strong>${fromLabel}:</strong> ${warning.fromLocation}<br/>
            <strong>${toLabel}:</strong> ${warning.toLocation}<br/>
            <span style="color: #FF385C; font-weight: bold;">Distance: ${warning.distance} km</span>
          </li>`;
        });

        warningHtml += '</ul>';
        warningHtml += '<p>Please verify that the locations are correct. This might make the itinerary unrealistic.</p>';
        warningHtml += '</div>';

        const result = await Swal.fire({
          icon: 'warning',
          title: 'Large Distance Between Stops',
          html: warningHtml,
          showCancelButton: true,
          confirmButtonColor: '#FF385C',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Continue Anyway',
          cancelButtonText: 'Go Back and Fix'
        });

        if (!result.isConfirmed) {
          return;
        }
      }
    }

    // Prepare current page data
    const detailsData = {
      fullDescription: formData.fullDescription.trim(),
      whatIncluded: formData.whatIsIncluded.join(', '),
      importantInfo: formData.importantInfo.trim(),
      itinerary: formData.itinerary
    };

    // Update context first
    updateFormData(detailsData);

    // Auto-save changes before navigating
    try {
      setIsSaving(true);
      await savePartialChanges(detailsData);
      // Navigate to next page after successful save
      navigate(`/edit-experience/${id}/pricing`);
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

  const handleBack = async () => {
    // Prepare current page data
    const detailsData = {
      fullDescription: formData.fullDescription.trim(),
      whatIncluded: formData.whatIsIncluded.join(', '),
      importantInfo: formData.importantInfo.trim(),
      itinerary: formData.itinerary
    };

    // Update context first
    updateFormData(detailsData);

    // Auto-save changes before navigating
    try {
      setIsSaving(true);
      await savePartialChanges(detailsData);
      // Navigate back after successful save
      navigate(`/edit-experience/${id}/basic-info`);
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
          <div className="max-w-7xl mx-auto py-16" style={{ paddingLeft: '20px', paddingRight: '20px' }}>


            <div className="mb-16">
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{ marginBottom: '30px' }}>Edit Experience - Details</h1>
              <ProgressSteps currentStep={2} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              <div className="lg:col-span-3">
                <div className="space-y-8">
                  <FormField
                    label="Full Description"
                    type="textarea"
                    value={formData.fullDescription}
                    onChange={(value) => handleInputChange('fullDescription', value)}
                    placeholder="Provide a detailed description of your experience, including what guests will do, see, and learn"
                    style={{ height: '192px' }}
                    isMobile={false}
                  />

                  <ListManager
                    label="What is Included?"
                    items={formData.whatIsIncluded}
                    onItemsChange={(newItems) => handleInputChange('whatIsIncluded', newItems)}
                    placeholder="Add included item..."
                    isMobile={false}
                  />

                  <FormField
                    label="Important Info"
                    type="textarea"
                    value={formData.importantInfo}
                    onChange={(value) => handleInputChange('importantInfo', value)}
                    placeholder="Provide relevant information for guests

e.g.

Not Allowed
1. Vapes
2. Weapons

Know before you go
1. Wear comfortable shoes
2. Bring water bottle"
                    style={{ height: '192px' }}
                    isMobile={false}
                  />
                </div>

                <div className="pt-8 flex gap-4" style={{ marginBottom: '50px' }}>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-red-500 border-2 border-neutrals-5 text-white font-bold py-6 rounded-full hover:bg-red-600 transition-colors text-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBack}
                    disabled={isSaving}
                    className="flex-1 border-2 border-neutrals-5 text-neutrals-2 font-bold py-6 rounded-full hover:bg-neutrals-7 transition-colors text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Back'}
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
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <ItineraryBuilder
                    items={formData.itinerary}
                    onItemsChange={(newItems) => handleInputChange('itinerary', newItems)}
                    meetingPoint={contextData?.location}
                    isMobile={false}
                  />
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
          <div className="py-10" style={{ paddingLeft: '20px', paddingRight: '20px' }}>

            <div className="mb-10">
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Edit Experience - Details</h1>
              <ProgressSteps currentStep={2} isMobile={true} />
            </div>

            <div className="space-y-6">
              <FormField
                label="Full Description"
                type="textarea"
                value={formData.fullDescription}
                onChange={(value) => handleInputChange('fullDescription', value)}
                placeholder="Provide a detailed description of your experience, including what guests will do, see, and learn"
                style={{ height: '160px' }}
                isMobile={true}
              />

              <ListManager
                label="What is Included?"
                items={formData.whatIsIncluded}
                onItemsChange={(newItems) => handleInputChange('whatIsIncluded', newItems)}
                placeholder="Add included item..."
                isMobile={true}
              />

              <FormField
                label="Important Info"
                type="textarea"
                value={formData.importantInfo}
                onChange={(value) => handleInputChange('importantInfo', value)}
                placeholder="Provide relevant information for guests

e.g.

Not Allowed
1. Vapes
2. Weapons

Know before you go
1. Wear comfortable shoes
2. Bring water bottle"
                style={{ height: '192px' }}
                isMobile={true}
              />

              <div style={{ marginBottom: '50px' }}>
                <ItineraryBuilder
                  items={formData.itinerary}
                  onItemsChange={(newItems) => handleInputChange('itinerary', newItems)}
                  meetingPoint={contextData?.location}
                  isMobile={true}
                />
              </div>

              <div className="flex gap-3" style={{ marginBottom: '15px' }}>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-red-500 border-2 border-neutrals-5 text-white font-bold py-4 rounded-full hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBack}
                  disabled={isSaving}
                  className="flex-1 border-2 border-neutrals-5 text-neutrals-2 font-bold py-4 rounded-full hover:bg-neutrals-7 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Back'}
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="flex-1 bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}