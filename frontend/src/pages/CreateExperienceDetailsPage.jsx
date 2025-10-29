import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Clock, MapPin, ChevronDown, Flag, Navigation, MapPinIcon } from 'lucide-react';
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

export default function CreateExperienceDetailsPage() {
  const navigate = useNavigate();
  const { formData: contextData, updateFormData } = useFormData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullDescription: contextData?.fullDescription || "",
    whatIsIncluded: contextData?.whatIsIncluded || [],
    importantInfo: contextData?.importantInfo || "",
    itinerary: contextData?.itinerary || []
  });


  // Helper function to suggest the next appropriate type
  const getDefaultItemType = () => {
    const hasStart = formData.itinerary.some(item => item.type === 'start');
    const hasEnd = formData.itinerary.some(item => item.type === 'end');
    
    // If no start exists, suggest start
    if (!hasStart) return 'start';
    
    // If start exists but no end, suggest stop (user can change to end if they want)
    return 'stop';
  };

  const handleNext = async () => {
    if (!formData.fullDescription.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Full Description Required',
        text: 'Please provide a full description of your experience',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    if (formData.whatIsIncluded.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'What Is Included Required',
        text: 'Please add at least one item to what is included',
        confirmButtonColor: '#FF385C'
      });
      return;
    }
    
    // Check if itinerary has items (multi-location) and validate end point
    if (formData.itinerary.length > 0) {
      const hasEndPoint = formData.itinerary.some(item => item.type === 'end');
      if (!hasEndPoint) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing End Point',
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
    
    updateFormData({
      fullDescription: formData.fullDescription.trim(),
      whatIncluded: formData.whatIsIncluded.join(', '),
      importantInfo: formData.importantInfo.trim(),
      itinerary: formData.itinerary
    });
    
    navigate('/create-experience/pricing');
  };

  const handleBack = () => {
    navigate('/create-experience/basic-info');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const addItineraryItem = () => {
    if (newItineraryItem.location.trim()) {
      const newItem = { 
        ...newItineraryItem, 
        type: newItineraryItem.type
      };
      
      const updatedItinerary = [...formData.itinerary];
      const endIndex = updatedItinerary.findIndex(item => item.type === 'end');
      
      // Insert item before end, or at the end if no end exists
      if (endIndex !== -1) {
        updatedItinerary.splice(endIndex, 0, newItem);
      } else {
        updatedItinerary.push(newItem);
      }

      setFormData(prev => ({
        ...prev,
        itinerary: updatedItinerary
      }));
      
      setNewItineraryItem({ location: "", time: "", type: "stop" });
      setShowItineraryForm(false);
    }
  };

  const removeItineraryItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
  };

  const updateItineraryItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
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
          <div className="max-w-7xl mx-auto py-16" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <div className="mb-16">
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{marginBottom: '30px'}}>Create New Experience</h1>
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
                    onClick={handleBack}
                    className="w-1/2 border-2 border-neutrals-5 text-neutrals-2 font-bold py-6 rounded-full hover:bg-neutrals-7 transition-colors text-xl"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-1/2 bg-primary-1 text-white font-bold py-6 rounded-full hover:opacity-90 transition-colors text-xl shadow-lg hover:shadow-xl"
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
          <div className="py-10" style={{paddingLeft: '20px', paddingRight: '20px'}}>
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Create New Experience</h1>
              
              <div className="flex gap-4 items-center" style={{marginBottom: '20px'}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-neutrals-2">
                  2
                </div>
                <span className="text-base font-medium text-neutrals-1">
                  Details
                </span>
              </div>
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
                  meetingPoint={contextData?.location}
                  isMobile={true}
                />
              </div>  

              <div className="flex gap-3" style={{marginBottom: '15px'}}>
                <button
                  onClick={handleBack}
                  className="w-1/2 border-2 border-neutrals-5 text-neutrals-2 font-bold py-4 rounded-full hover:bg-neutrals-7 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="w-1/2 bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors"
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
