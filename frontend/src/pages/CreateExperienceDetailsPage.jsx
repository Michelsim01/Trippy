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
