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

export default function EditExperienceDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    formData: contextData,
    updateFormData,
    isEditMode,
    hasBookings,
    toggleBookings,
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


  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare only the Details page data for partial save
      const detailsData = {
        fullDescription: formData.fullDescription.trim(),
        whatIncluded: formData.whatIsIncluded.join(', '),
        importantInfo: formData.importantInfo.trim(),
        itinerary: formData.itinerary
      };

      // Save only Details data with partial save (preserves other page data)
      await savePartialChanges(detailsData);

      alert('Details saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (!formData.fullDescription.trim()) {
      alert('Please enter a full description');
      return;
    }
    if (formData.whatIsIncluded.length === 0) {
      alert('Please add at least one item to what is included');
      return;
    }

    updateFormData({
      fullDescription: formData.fullDescription.trim(),
      whatIncluded: formData.whatIsIncluded.join(', '),
      importantInfo: formData.importantInfo.trim(),
      itinerary: formData.itinerary
    });

    navigate(`/edit-experience/${id}/pricing`);
  };

  const handleBack = () => {
    navigate(`/edit-experience/${id}/basic-info`);
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
          <div className="max-w-7xl mx-auto py-16" style={{paddingLeft: '20px', paddingRight: '20px'}}>

            {/* Booking Toggle Section */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-neutrals-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutrals-1 mb-2">Booking Status</h3>
                  <p className="text-sm text-neutrals-3">
                    Toggle this to simulate whether this experience has existing bookings.
                    When enabled, certain fields will be restricted to prevent conflicts with existing bookings.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${hasBookings ? 'text-neutrals-3' : 'text-neutrals-1 font-medium'}`}>
                    No Bookings
                  </span>
                  <button
                    onClick={toggleBookings}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-1 focus:ring-offset-2 ${
                      hasBookings ? 'bg-primary-1' : 'bg-neutrals-6'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hasBookings ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${hasBookings ? 'text-neutrals-1 font-medium' : 'text-neutrals-3'}`}>
                    Has Bookings
                  </span>
                </div>
              </div>

              {hasBookings && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Restricted Fields</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Price, dates, country, and max participants cannot be modified when bookings exist to prevent conflicts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-16">
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{marginBottom: '30px'}}>Edit Experience - Details</h1>
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
                    style={{height: '192px'}}
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
                    style={{height: '192px'}}
                    isMobile={false}
                  />
                </div>

                <div className="pt-8 flex gap-4" style={{marginBottom: '50px'}}>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-white border-2 border-primary-1 text-primary-1 font-bold py-6 rounded-full hover:bg-primary-1 hover:text-white transition-colors text-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleBack}
                    className="w-1/4 border-2 border-neutrals-5 text-neutrals-2 font-bold py-6 rounded-full hover:bg-neutrals-7 transition-colors text-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-1/4 bg-primary-1 text-white font-bold py-6 rounded-full hover:opacity-90 transition-colors text-xl shadow-lg hover:shadow-xl"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <ItineraryBuilder
                    items={formData.itinerary}
                    onItemsChange={(newItems) => handleInputChange('itinerary', newItems)}
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
          <div className="py-10" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            {/* Booking Toggle Section */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-neutrals-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutrals-1 mb-2">Booking Status</h3>
                  <p className="text-xs text-neutrals-3">
                    Toggle to simulate whether this experience has existing bookings.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${hasBookings ? 'text-neutrals-3' : 'text-neutrals-1 font-medium'}`}>
                    No Bookings
                  </span>
                  <button
                    onClick={toggleBookings}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-1 focus:ring-offset-2 ${
                      hasBookings ? 'bg-primary-1' : 'bg-neutrals-6'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        hasBookings ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs ${hasBookings ? 'text-neutrals-1 font-medium' : 'text-neutrals-3'}`}>
                    Has Bookings
                  </span>
                </div>
              </div>

              {hasBookings && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-orange-800">Restricted Fields</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Price, dates, country, and max participants cannot be modified when bookings exist.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                style={{height: '160px'}}
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
                style={{height: '192px'}}
                isMobile={true}
              />

              <div style={{marginBottom: '50px'}}>
                <ItineraryBuilder
                  items={formData.itinerary}
                  onItemsChange={(newItems) => handleInputChange('itinerary', newItems)}
                  isMobile={true}
                />
              </div>

              <div className="flex gap-3" style={{marginBottom: '15px'}}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-white border-2 border-primary-1 text-primary-1 font-bold py-4 rounded-full hover:bg-primary-1 hover:text-white transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleBack}
                  className="w-1/4 border-2 border-neutrals-5 text-neutrals-2 font-bold py-4 rounded-full hover:bg-neutrals-7 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="w-1/4 bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors"
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