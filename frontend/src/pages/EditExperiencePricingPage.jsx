import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProgressSteps from '../components/create-experience/ProgressSteps';
import Swal from 'sweetalert2';

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
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const formatted = parts[0] + (parts[1] !== undefined ? '.' + parts[1].slice(0, 2) : '');
    setFormData(prev => ({ ...prev, pricePerPerson: formatted }));
  };

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
    if (!formData.pricePerPerson || parseFloat(formData.pricePerPerson) <= 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Price Required',
        text: 'Please enter a valid price per person',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    // Check for price update warnings
    const newPrice = parseFloat(formData.pricePerPerson);
    const oldPrice = contextData?.price ? parseFloat(contextData.price) : null;
    const originalPrice = contextData?.originalPrice ? parseFloat(contextData.originalPrice) : oldPrice;
    
    if (oldPrice && newPrice !== oldPrice) {
      // HIGHEST PRIORITY: Check if price is lowered but discount is less than 10%
      // This warning takes precedence over all other warnings
      if (newPrice < oldPrice && originalPrice) {
        const discountPercentage = ((originalPrice - newPrice) / originalPrice) * 100;
        
        if (discountPercentage > 0 && discountPercentage < 10) {
          const result = await Swal.fire({
            title: 'Discount Too Small',
            html: `You're lowering the price by ${discountPercentage.toFixed(1)}%, but this is less than the 10% threshold.<br><br>
                   <strong>Your listing will NOT show a discount badge.</strong><br><br>
                   To display the discount badge, the price must be at least 10% lower than the original price of $${originalPrice.toFixed(2)}.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#FF385C',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Continue Anyway',
            cancelButtonText: 'Adjust Price'
          });

          // If user cancelled, stop here
          if (!result.isConfirmed) {
            return;
          }
          // If user confirmed, skip other warnings and proceed
          // Don't check backend warnings since discount warning is higher priority
        }
      }
      
      // Only check other backend validations if discount warning didn't trigger or user continued
      // Skip if we already showed the discount warning
      const showedDiscountWarning = newPrice < oldPrice && originalPrice && 
        ((originalPrice - newPrice) / originalPrice) * 100 > 0 && 
        ((originalPrice - newPrice) / originalPrice) * 100 < 10;
      
      if (!showedDiscountWarning) {
        try {
          // Validate price update with backend
          const response = await fetch(`http://localhost:8080/api/experiences/${id}/validate-price`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ price: newPrice })
          });

          if (response.ok) {
            const validation = await response.json();
            
            // If there are warnings, show SweetAlert confirmation
            if (validation.hasWarnings) {
              const warningText = validation.warnings.join('\n\n');
              const result = await Swal.fire({
                title: 'Price Update Warnings',
                html: warningText.replace(/\n/g, '<br>'),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#FF385C',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Continue Anyway',
                cancelButtonText: 'Cancel'
              });

              // If user cancelled, stop here
              if (!result.isConfirmed) {
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error validating price:', error);
          // Continue anyway if validation fails
        }
      }
    }

    // Prepare current page data
    const pricingData = {
      price: formData.pricePerPerson,
      currency: formData.currency
    };

    // Update context first
    updateFormData(pricingData);

    // Auto-save changes before navigating
    try {
      setIsSaving(true);
      await savePartialChanges(pricingData);
      // Navigate to next page after successful save
      navigate(`/edit-experience/${id}/availability`);
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
    const pricingData = {
      price: formData.pricePerPerson,
      currency: formData.currency
    };

    // Update context first
    updateFormData(pricingData);

    // Auto-save changes before navigating
    try {
      setIsSaving(true);
      await savePartialChanges(pricingData);
      // Navigate back after successful save
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
              <h1 className="text-4xl font-bold text-neutrals-1 mb-12" style={{marginBottom: '30px'}}>Edit Experience - Pricing</h1>
              <ProgressSteps currentStep={3} />
            </div>
            <div className="max-w-4xl">
              <div>
                <div className="space-y-8">
                  {/* Original Price (Read-only Reference) */}
                  {contextData?.originalPrice && (
                    <div style={{marginBottom: '15px'}}>
                      <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Original Price (Reference)</label>
                      <div className="border-2 rounded-xl p-6 bg-neutrals-7 border-neutrals-6">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-neutrals-3">Per Person</span>
                          <div className="flex items-center gap-3">
                            <span className="text-neutrals-3 text-lg font-medium">$</span>
                            <div className="w-24 px-4 py-3 border-2 rounded-xl text-lg font-medium text-center bg-neutrals-6 border-neutrals-5 text-neutrals-3 cursor-not-allowed" style={{padding: '6px'}}>
                              {parseFloat(contextData.originalPrice).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-neutrals-4 mt-3 italic">This is your baseline price and cannot be changed</p>
                      </div>
                    </div>
                  )}

                  {/* Discount Badge Information */}
                  {contextData?.originalPrice && (
                    <div style={{marginBottom: '15px'}}>
                      <div className="border-2 rounded-xl p-6 bg-blue-50 border-blue-300">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-blue-900 mb-2">Want to show a discount badge on your listing?</h4>
                            <p className="text-sm text-blue-800 mb-2">
                              To display the discount badge, your <strong>current price must be at least 10% lower than your original price of ${parseFloat(contextData.originalPrice).toFixed(2)}</strong>.
                            </p>
                            <p className="text-sm text-blue-800">
                              💡 Example: Set current price to <strong>${(parseFloat(contextData.originalPrice) * 0.9).toFixed(2)}</strong> or lower to show a 10% OFF badge.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Base Pricing */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Current Price</label>
                    <div className="border-2 border-dashed rounded-xl p-6 border-neutrals-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-neutrals-2">Per Person</span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutrals-2 text-lg font-medium">$</span>
                          <input
                            type="text"
                            value={formData.pricePerPerson}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            className="w-24 px-4 py-3 border-2 rounded-xl focus:outline-none text-lg font-medium text-center transition-colors border-neutrals-5 focus:border-primary-1 text-neutrals-2"
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
              {/* Original Price (Read-only Reference) - Mobile */}
              {contextData?.originalPrice && (
                <div style={{marginBottom: '10px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Original Price (Reference)</label>
                  <div className="border-2 rounded-xl p-4 bg-neutrals-7 border-neutrals-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutrals-3">Per Person</span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutrals-3 text-sm font-medium">$</span>
                        <div className="w-20 px-3 py-2 border-2 rounded-xl text-sm font-medium text-center bg-neutrals-6 border-neutrals-5 text-neutrals-3 cursor-not-allowed" style={{padding: '6px'}}>
                          {parseFloat(contextData.originalPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-neutrals-4 mt-2 italic">This is your baseline price and cannot be changed</p>
                  </div>
                </div>
              )}

              {/* Discount Badge Information - Mobile */}
              {contextData?.originalPrice && (
                <div style={{marginBottom: '10px'}}>
                  <div className="border-2 rounded-xl p-4 bg-blue-50 border-blue-300">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-blue-900 mb-1">Want to show a discount badge?</h4>
                        <p className="text-xs text-blue-800 mb-1">
                          Current price must be <strong>at least 10% lower than ${parseFloat(contextData.originalPrice).toFixed(2)}</strong>.
                        </p>
                        <p className="text-xs text-blue-800">
                          💡 Set to <strong>${(parseFloat(contextData.originalPrice) * 0.9).toFixed(2)}</strong> or lower for 10% OFF badge.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Base Pricing */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Current Price</label>
                <div className="border-2 border-dashed rounded-xl p-4 border-neutrals-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutrals-2">Per Person</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutrals-2 text-sm font-medium">$</span>
                      <input
                        type="text"
                        value={formData.pricePerPerson}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-20 px-3 py-2 border-2 rounded-xl focus:outline-none text-sm font-medium text-center transition-colors border-neutrals-5 focus:border-primary-1 text-neutrals-2"
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


              <div className="flex gap-3" style={{marginBottom: '15px'}}>
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