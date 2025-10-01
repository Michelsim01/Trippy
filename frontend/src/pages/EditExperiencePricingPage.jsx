import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProgressSteps from '../components/create-experience/ProgressSteps';

export default function EditExperiencePricingPage() {
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
    pricePerPerson: "",
    currency: "$"
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
        pricePerPerson: contextData?.price || "",
        currency: "$" // Default currency
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

  const handlePriceChange = (value) => {
    // Don't allow changes to price if field is restricted
    if (isFieldRestricted('price')) {
      return;
    }

    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const formatted = parts[0] + (parts[1] !== undefined ? '.' + parts[1].slice(0, 2) : '');
    setFormData(prev => ({ ...prev, pricePerPerson: formatted }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare only the Pricing page data for partial save
      const pricingData = {
        price: formData.pricePerPerson,
        currency: formData.currency
      };

      // Save only Pricing data with partial save (preserves other page data)
      await savePartialChanges(pricingData);

      alert('Pricing saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (!formData.pricePerPerson || parseFloat(formData.pricePerPerson) <= 0) {
      alert('Please enter a valid price per person');
      return;
    }

    updateFormData({
      price: formData.pricePerPerson,
      currency: formData.currency
    });

    navigate(`/edit-experience/${id}/availability`);
  };

  const handleBack = () => {
    navigate(`/edit-experience/${id}/details`);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
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
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{marginBottom: '30px'}}>Edit Experience - Pricing</h1>
              <ProgressSteps currentStep={3} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-20">
              <div className="lg:col-span-3">
                <div className="space-y-8">
                  {/* Base Pricing */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Base Pricing</label>
                    {getFieldWarning('price') && (
                      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-orange-700">{getFieldWarning('price')}</p>
                        </div>
                      </div>
                    )}
                    <div className={`border-2 border-dashed rounded-xl p-6 ${
                      isFieldDisabled('price') ? 'border-neutrals-6 bg-neutrals-7' : 'border-neutrals-4'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-neutrals-2">Per Person</span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutrals-2 text-lg font-medium">$</span>
                          <input
                            type="text"
                            value={formData.pricePerPerson}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            disabled={isFieldDisabled('price')}
                            className={`w-24 px-4 py-3 border-2 rounded-xl focus:outline-none text-lg font-medium text-center transition-colors ${
                              isFieldDisabled('price')
                                ? 'border-neutrals-6 bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                                : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                            }`}
                            placeholder="0.00"
                            style={{padding: '6px'}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Policy Information */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cancellation Policy</label>
                    <div className="border-2 border-neutrals-4 rounded-xl p-6 bg-neutrals-7">
                      <div className="text-sm text-neutrals-2">
                        <p className="mb-2"><strong>Free Cancellation:</strong> 24 hours after purchase for full refund</p>
                        <p className="mb-2"><strong>7+ days before:</strong> Full refund (minus service fee)</p>
                        <p className="mb-2"><strong>3-6 days before:</strong> 50% refund</p>
                        <p className="mb-2"><strong>Less than 48 hours:</strong> Non-refundable</p>
                        <p><strong>No-shows:</strong> Non-refundable</p>
                      </div>
                    </div>
                  </div>
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
                  <div className="bg-white border-2 border-neutrals-6 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Pricing Preview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-neutrals-3">Base price per person</span>
                        <span className="font-medium text-neutrals-1">
                          ${formData.pricePerPerson || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutrals-3">Platform fee (5%)</span>
                        <span className="font-medium text-neutrals-1">
                          ${formData.pricePerPerson ? (parseFloat(formData.pricePerPerson) * 0.05).toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="border-t border-neutrals-6 pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-neutrals-1">You receive per person</span>
                          <span className="font-bold text-primary-1">
                            ${formData.pricePerPerson ? (parseFloat(formData.pricePerPerson) * 0.95).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
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
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Edit Experience - Pricing</h1>
              <ProgressSteps currentStep={3} isMobile={true} />
            </div>

            <div className="space-y-6">
              {/* Base Pricing */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Base Pricing</label>
                {getFieldWarning('price') && (
                  <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-orange-700">{getFieldWarning('price')}</p>
                    </div>
                  </div>
                )}
                <div className={`border-2 border-dashed rounded-xl p-4 ${
                  isFieldDisabled('price') ? 'border-neutrals-6 bg-neutrals-7' : 'border-neutrals-4'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutrals-2">Per Person</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutrals-2 text-sm font-medium">$</span>
                      <input
                        type="text"
                        value={formData.pricePerPerson}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        disabled={isFieldDisabled('price')}
                        className={`w-20 px-3 py-2 border-2 rounded-xl focus:outline-none text-sm font-medium text-center transition-colors ${
                          isFieldDisabled('price')
                            ? 'border-neutrals-6 bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                            : 'border-neutrals-5 focus:border-primary-1 text-neutrals-2'
                        }`}
                        placeholder="0.00"
                        style={{padding: '6px'}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy Information */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cancellation Policy</label>
                <div className="border-2 border-neutrals-4 rounded-xl p-4 bg-neutrals-7">
                  <div className="text-xs text-neutrals-2">
                    <p className="mb-1"><strong>Free Cancellation:</strong> 24 hours after purchase for full refund</p>
                    <p className="mb-1"><strong>7+ days before:</strong> Full refund (minus service fee)</p>
                    <p className="mb-1"><strong>3-6 days before:</strong> 50% refund</p>
                    <p className="mb-1"><strong>Less than 48 hours:</strong> Non-refundable</p>
                    <p><strong>No-shows:</strong> Non-refundable</p>
                  </div>
                </div>
              </div>

              {/* Mobile Pricing Preview */}
              <div className="bg-white border-2 border-neutrals-6 rounded-xl p-4" style={{marginBottom: '10px'}}>
                <h3 className="text-sm font-semibold text-neutrals-1 mb-3">Pricing Preview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutrals-3">Base price per person</span>
                    <span className="text-sm font-medium text-neutrals-1">
                      ${formData.pricePerPerson || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutrals-3">Platform fee (5%)</span>
                    <span className="text-sm font-medium text-neutrals-1">
                      ${formData.pricePerPerson ? (parseFloat(formData.pricePerPerson) * 0.05).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="border-t border-neutrals-6 pt-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold text-neutrals-1">You receive per person</span>
                      <span className="text-sm font-bold text-primary-1">
                        ${formData.pricePerPerson ? (parseFloat(formData.pricePerPerson) * 0.95).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
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