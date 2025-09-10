import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Clock, MapPin } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function CreateExperienceDetails() {
  const navigate = useNavigate();
  const { formData: contextData, updateFormData } = useFormData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullDescription: contextData?.fullDescription || "",
    whatIsIncluded: contextData?.whatIsIncluded || [
      "Expert English-speaking guide",
      "Walking tour", 
      "13 Japanese dishes at 4 eateries",
      "2 complimentary drinks (alcoholic and non-alcoholic)",
      "Food at 1 stall, 1 izakaya, 1 traditional eatery and 1 gastrobar",
      "Get advice on plans for your stay from our experienced guide"
    ],
    importantInfo: contextData?.importantInfo || "",
    itinerary: contextData?.itinerary || [
      { location: "Starbucks Coffee - Shinjuku Nishiguchu", time: "", type: "start" },
      { location: "Golden Gai", time: "1 hour", type: "stop" },
      { location: "Omoide Yokocho", time: "1 hour", type: "stop" },
      { location: "Kabukicho", time: "1 hour", type: "stop" },
      { location: "Starbucks Coffee - Shinjuku Nishiguchu", time: "", type: "end" }
    ]
  });

  const [newIncludedItem, setNewIncludedItem] = useState("");
  const [showItineraryForm, setShowItineraryForm] = useState(false);
  const [newItineraryItem, setNewItineraryItem] = useState({ location: "", time: "" });

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
      whatIsIncluded: formData.whatIsIncluded,
      importantInfo: formData.importantInfo.trim(),
      itinerary: formData.itinerary
    });
    
    navigate('/create-experience/pricing');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addIncludedItem = () => {
    if (newIncludedItem.trim()) {
      setFormData(prev => ({
        ...prev,
        whatIsIncluded: [...prev.whatIsIncluded, newIncludedItem.trim()]
      }));
      setNewIncludedItem("");
    }
  };

  const removeIncludedItem = (index) => {
    setFormData(prev => ({
      ...prev,
      whatIsIncluded: prev.whatIsIncluded.filter((_, i) => i !== index)
    }));
  };

  const addItineraryItem = () => {
    if (newItineraryItem.location.trim()) {
      const newItem = { 
        ...newItineraryItem, 
        type: 'stop'
      };
      
      const updatedItinerary = [...formData.itinerary];
      const endIndex = updatedItinerary.findIndex(item => item.type === 'end');
      
      if (endIndex !== -1) {
        updatedItinerary.splice(endIndex, 0, newItem);
      } else {
        updatedItinerary.push(newItem);
      }
      
      setFormData(prev => ({
        ...prev,
        itinerary: updatedItinerary
      }));
      
      setNewItineraryItem({ location: "", time: "" });
      setShowItineraryForm(false);
    }
  };

  const removeItineraryItem = (index) => {
    if (formData.itinerary[index].type === 'stop') {
      setFormData(prev => ({
        ...prev,
        itinerary: prev.itinerary.filter((_, i) => i !== index)
      }));
    }
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
              <div className="flex items-start gap-16" style={{marginBottom: '30px'}}>
                {[
                  { step: 1, label: "Basic Info", active: false },
                  { step: 2, label: "Details", active: true },
                  { step: 3, label: "Pricing", active: false },
                  { step: 4, label: "Availability", active: false }
                ].map((item) => (
                  <div key={item.step} className="flex flex-col">
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
                    <div 
                      style={{
                        backgroundColor: item.active ? '#000' : '#d1d5db',
                        width: '240px',
                        height: item.active ? '4px' : '2px',
                        marginTop: '4px'
                      }} 
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              <div className="lg:col-span-3">
                <div className="space-y-8">
                  {/* Full Description */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Full Description</label>
                    <textarea style={{padding: '6px'}}
                      value={formData.fullDescription}
                      onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                      className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 h-48 resize-none text-lg font-medium text-neutrals-2 transition-colors"
                      placeholder="This small group tour led by a local guide is a great way to discover hidden local dining spots that are missed by most tourists. Our knowledgeable guides are well-versed in the local food scene, taking you to hidden spots where locals enjoy their authentic, flavorful comfort food. Along the way, you'll experience a blend of history, culture, and plenty of fun!"
                    />
                  </div>
                  
                  {/* What is Included */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">What is Included?</label>
                    <div className="border-2 border-neutrals-5 rounded-xl p-6 bg-white">
                      {formData.whatIsIncluded.length > 0 && (
                        <ul className="mb-4" style={{padding: '6px'}}>
                          {formData.whatIsIncluded.map((item, index) => (
                            <li key={index} className="group flex items-start justify-between mb-3">
                              <div className="flex items-start flex-1 gap-3">
                                <span className="text-primary-1 font-bold text-lg">•</span>
                                <span className="text-lg font-medium text-neutrals-2">{item}</span>
                              </div>
                              <button 
                                onClick={() => removeIncludedItem(index)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-3 items-center" style={{padding: '4px 8px'}}>
                        <input style={{padding: '6px'}}
                          type="text"
                          value={newIncludedItem}
                          onChange={(e) => setNewIncludedItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addIncludedItem();
                            }
                          }}
                          placeholder="Add included item..."
                          className="flex-1 px-4 py-3 text-lg font-medium text-neutrals-2 bg-transparent focus:outline-none border-b-2 border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all"
                        />
                        <button 
                          onClick={addIncludedItem}
                          className="w-8 h-8 rounded-full bg-primary-1 flex items-center justify-center hover:opacity-90 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Important Info */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Important Info</label>
                    <textarea style={{padding: '6px'}}
                      value={formData.importantInfo}
                      onChange={(e) => handleInputChange('importantInfo', e.target.value)}
                      className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 h-32 resize-none text-lg font-medium text-neutrals-2 transition-colors"
                      placeholder="Any important information guests should know (e.g., dress code, physical requirements, meeting instructions)..."
                    />
                  </div>
                </div>
                
                <div className="pt-8" style={{marginBottom: '50px'}}>
                  <button
                    onClick={handleNext}
                    className="w-full bg-primary-1 text-white font-bold py-6 rounded-full hover:opacity-90 transition-colors text-xl shadow-lg hover:shadow-xl"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Itinerary Builder</label>
                    <div className="border-2 border-dashed border-neutrals-4 rounded-xl p-8">
                      <div className="space-y-6" style={{padding: '10px'}}>
                        {formData.itinerary.map((item, index) => (
                          <div key={index} className="relative">
                            <div className="flex items-start gap-5">
                              <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                                  item.type === 'start' ? 'bg-green-500' :
                                  item.type === 'end' ? 'bg-red-500' : 'bg-blue-500'
                                }`}>
                                  {item.type === 'start' ? 'S' : 
                                   item.type === 'end' ? 'E' : index}
                                </div>
                                {index < formData.itinerary.length - 1 && (
                                  <div className="w-1 h-20 bg-neutrals-5 mt-3 rounded-full"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 pt-2">
                                <div className="flex items-center gap-3 mb-2">
                                  <MapPin className="w-5 h-5 text-neutrals-4" />
                                  <input
                                    type="text"
                                    value={item.location}
                                    onChange={(e) => updateItineraryItem(index, 'location', e.target.value)}
                                    className="flex-1 text-lg font-semibold text-neutrals-1 bg-transparent focus:outline-none border-b-2 border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all py-1"
                                    placeholder="Enter location name"
                                  />
                                  {item.type === 'stop' && (
                                    <button 
                                      onClick={() => removeItineraryItem(index)}
                                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                                {item.type === 'stop' && (
                                  <div className="flex items-center gap-2 text-neutrals-4 ml-8">
                                    <Clock className="w-4 h-4" />
                                    <input
                                      type="text"
                                      value={item.time}
                                      onChange={(e) => updateItineraryItem(index, 'time', e.target.value)}
                                      className="text-sm text-neutrals-3 bg-transparent focus:outline-none border-b border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all py-1"
                                      placeholder="Duration (e.g., 1 hour)"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Itinerary Item Form */}
                      {showItineraryForm ? (
                        <div style={{
                          border: '2px dashed #d1d5db',
                          borderRadius: '12px',
                          padding: '16px',
                          margin: '16px',
                          backgroundColor: 'white'
                        }}>
                          <div style={{marginBottom: '12px'}}>
                            <input
                              type="text"
                              value={newItineraryItem.location}
                              onChange={(e) => setNewItineraryItem(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="Location name"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '500',
                                color: '#374151',
                                outline: 'none'
                              }}
                            />
                          </div>
                          <div style={{marginBottom: '16px'}}>
                            <input
                              type="text"
                              value={newItineraryItem.time}
                              onChange={(e) => setNewItineraryItem(prev => ({ ...prev, time: e.target.value }))}
                              placeholder="Duration (e.g., 1 hour)"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: '500',
                                color: '#374151',
                                outline: 'none'
                              }}
                            />
                          </div>
                          <div style={{display: 'flex', gap: '8px'}}>
                            <button
                              onClick={addItineraryItem}
                              style={{
                                flex: 1,
                                backgroundColor: '#10b981',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Add Stop
                            </button>
                            <button
                              onClick={() => {
                                setShowItineraryForm(false);
                                setNewItineraryItem({ location: "", time: "" });
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: '#6b7280',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          paddingTop: '0px',
                          paddingBottom: '12px',
                          paddingLeft: '12px',
                          paddingRight: '12px'
                        }}>
                          <button
                            onClick={() => setShowItineraryForm(true)}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              padding: '12px 24px',
                              borderRadius: '20px',
                              border: 'none',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Plus style={{width: '16px', height: '16px'}} />
                            Add Itinerary Item
                          </button>
                        </div>
                      )}
                    </div>
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
              {/* Full Description */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Full Description</label>
                <textarea style={{padding: '6px'}}
                  value={formData.fullDescription}
                  onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 h-40 resize-none text-sm font-medium text-neutrals-2 transition-colors"
                  placeholder="Describe your experience in detail..."
                />
              </div>
              
              {/* What is Included */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">What is Included?</label>
                <div className="border-2 border-neutrals-5 rounded-xl p-4 bg-white">
                  {formData.whatIsIncluded.length > 0 && (
                    <ul className="mb-4" style={{padding: '5px'}}>
                      {formData.whatIsIncluded.map((item, index) => (
                        <li key={index} className="group flex items-start justify-between mb-3">
                          <div className="flex items-start flex-1 gap-2">
                            <span className="text-primary-1 font-bold text-sm">•</span>
                            <span className="text-sm font-medium text-neutrals-2">{item}</span>
                          </div>
                          <button 
                            onClick={() => removeIncludedItem(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 items-center" style={{padding: '4px 6px' }}>
                    <input style={{padding: '6px'}}
                      type="text"
                      value={newIncludedItem}
                      onChange={(e) => setNewIncludedItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addIncludedItem();
                        }
                      }}
                      placeholder="Add included item..."
                      className="flex-1 px-3 py-3 text-sm font-medium text-neutrals-2 bg-transparent focus:outline-none border-b-2 border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all"
                    />
                    <button 
                      onClick={addIncludedItem}
                      className="w-6 h-6 rounded-full bg-primary-1 flex items-center justify-center hover:opacity-90 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Important Info */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Important Info</label>
                <textarea style={{padding: '6px'}}
                  value={formData.importantInfo}
                  onChange={(e) => handleInputChange('importantInfo', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 h-32 resize-none text-sm font-medium text-neutrals-2 transition-colors"
                  placeholder="Any important information guests should know..."
                />
              </div>
              
              {/* Mobile Itinerary Builder */}
              <div style={{marginBottom: '15px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Itinerary Builder</label>
                <div className="border-2 border-dashed border-neutrals-4 rounded-xl p-4">
                  <div className="space-y-4" style={{padding: '10px'}}>
                    {formData.itinerary.map((item, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              item.type === 'start' ? 'bg-green-500' :
                              item.type === 'end' ? 'bg-red-500' : 'bg-blue-500'
                            }`}>
                              {item.type === 'start' ? 'S' : 
                               item.type === 'end' ? 'E' : index}
                            </div>
                            {index < formData.itinerary.length - 1 && (
                              <div className="w-0.5 h-12 bg-neutrals-5 mt-2 rounded-full"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-neutrals-4" />
                              <input
                                type="text"
                                value={item.location}
                                onChange={(e) => updateItineraryItem(index, 'location', e.target.value)}
                                className="flex-1 text-lg font-semibold text-neutrals-1 bg-transparent focus:outline-none border-b-2 border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all py-1"
                                placeholder="Enter location name"
                              />
                              {item.type === 'stop' && (
                                <button 
                                  onClick={() => removeItineraryItem(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                                  style={{marginRight: '8px'}}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {item.type === 'stop' && (
                              <div className="flex items-center gap-2 text-neutrals-4 ml-6">
                                <Clock className="w-4 h-4" />
                                <input
                                  type="text"
                                  value={item.time}
                                  onChange={(e) => updateItineraryItem(index, 'time', e.target.value)}
                                  className="text-sm text-neutrals-3 bg-transparent focus:outline-none border-b border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all py-1"
                                  placeholder="Duration (e.g., 1 hour)"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Button */}
                  {!showItineraryForm && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      paddingTop: '0px',
                      paddingBottom: '8px',
                      paddingLeft: '8px',
                      paddingRight: '8px'
                    }}>
                      <button
                        onClick={() => setShowItineraryForm(true)}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '10px 20px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Plus style={{width: '16px', height: '16px'}} />
                        Add Itinerary Item
                      </button>
                    </div>
                  )}
                  
                  {/* Mobile Add Form */}
                  {showItineraryForm && (
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px',
                      padding: '16px',
                      margin: '16px 12px',
                      backgroundColor: 'white'
                    }}>
                      <div style={{marginBottom: '12px'}}>
                        <input
                          type="text"
                          value={newItineraryItem.location}
                          onChange={(e) => setNewItineraryItem(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Location name"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '500',
                            color: '#374151',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{marginBottom: '16px'}}>
                        <input
                          type="text"
                          value={newItineraryItem.time}
                          onChange={(e) => setNewItineraryItem(prev => ({ ...prev, time: e.target.value }))}
                          placeholder="Duration (e.g., 1 hour)"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '500',
                            color: '#374151',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button
                          onClick={addItineraryItem}
                          style={{
                            flex: 1,
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Add Stop
                        </button>
                        <button
                          onClick={() => {
                            setShowItineraryForm(false);
                            setNewItineraryItem({ location: "", time: "" });
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: '#6b7280',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{marginBottom: '15px'}}>
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
