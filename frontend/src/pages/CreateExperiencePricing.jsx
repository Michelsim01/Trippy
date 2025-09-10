import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

export default function CreateExperiencePricing() {
  const navigate = useNavigate();
  const { formData: contextData, updateFormData } = useFormData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    pricePerPerson: contextData?.pricePerPerson || "",
    currency: contextData?.currency || "$",
    cancellationPolicy: contextData?.cancellationPolicy || "free_48h",
    cancellationRate: contextData?.cancellationRate || 10
  });

  const [showCancellationPolicyDropdown, setShowCancellationPolicyDropdown] = useState(false);
  const [showCancellationRateDropdown, setShowCancellationRateDropdown] = useState(false);

  const cancellationPolicies = [
    { value: 'free_48h', label: 'Free cancellation up to 48 hours before' },
    { value: 'free_24h', label: 'Free cancellation up to 24 hours before' },
    { value: 'no_refund', label: 'No refund' },
    { value: 'custom', label: 'Custom policy' }
  ];

  const cancellationRates = [0, 5, 10, 15, 20, 25, 30, 50, 100];

  const handlePriceChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const formatted = parts[0] + (parts[1] !== undefined ? '.' + parts[1].slice(0, 2) : '');
    setFormData(prev => ({ ...prev, pricePerPerson: formatted }));
  };

  const handleNext = () => {
    if (!formData.pricePerPerson || parseFloat(formData.pricePerPerson) <= 0) {
      alert('Please enter a valid price per person');
      return;
    }

    updateFormData({
      pricePerPerson: formData.pricePerPerson,
      currency: formData.currency,
      cancellationPolicy: formData.cancellationPolicy,
      cancellationRate: formData.cancellationRate
    });
    
    navigate('/create-experience/availability');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getCancellationPolicyLabel = (value) => {
    const policy = cancellationPolicies.find(p => p.value === value);
    return policy ? policy.label : value;
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
                  { step: 2, label: "Details", active: false },
                  { step: 3, label: "Pricing", active: true },
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
                  {/* Base Pricing */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Base Pricing</label>
                    <div className="border-2 border-dashed border-neutrals-4 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-neutrals-2">Per Person</span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutrals-2 text-lg font-medium">$</span>
                          <input
                            type="text"
                            value={formData.pricePerPerson}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            className="w-24 px-4 py-3 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 text-center transition-colors"
                            placeholder="0.00"
                            style={{padding: '6px'}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Policy */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cancellation Policy</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowCancellationPolicyDropdown(!showCancellationPolicyDropdown)}
                        className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 flex items-center justify-between transition-colors"
                        style={{padding: '6px'}}
                      >
                        <span className="pr-4">{getCancellationPolicyLabel(formData.cancellationPolicy)}</span>
                        <ChevronDown className="w-5 h-5 text-neutrals-4" />
                      </button>
                      {showCancellationPolicyDropdown && (
                        <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-6 rounded-xl shadow-lg z-10">
                          {cancellationPolicies.map(policy => (
                            <button
                              key={policy.value}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, cancellationPolicy: policy.value }));
                                setShowCancellationPolicyDropdown(false);
                              }}
                              className="w-full px-6 py-4 text-left hover:bg-neutrals-7 text-lg font-medium text-neutrals-2 first:rounded-t-xl last:rounded-b-xl transition-colors"
                            >
                              {policy.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Late Cancellation Fee */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Late Cancellation Fee (% of Total)</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowCancellationRateDropdown(!showCancellationRateDropdown)}
                        className="w-full px-6 py-5 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 flex items-center justify-between transition-colors"
                        style={{padding: '6px'}}
                      >
                        <span>{formData.cancellationRate}%</span>
                        <ChevronDown className="w-5 h-5 text-neutrals-4" />
                      </button>
                      {showCancellationRateDropdown && (
                        <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-6 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                          {cancellationRates.map(rate => (
                            <button
                              key={rate}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, cancellationRate: rate }));
                                setShowCancellationRateDropdown(false);
                              }}
                              className="w-full px-6 py-4 text-left hover:bg-neutrals-7 text-lg font-medium text-neutrals-2 first:rounded-t-xl last:rounded-b-xl transition-colors"
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
              <h1 className="text-2xl font-bold text-neutrals-1 mb-8">Create New Experience</h1>
              
              <div className="flex gap-4 items-center" style={{marginBottom: '20px'}}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-neutrals-2">
                  3
                </div>
                <span className="text-base font-medium text-neutrals-1">
                  Pricing
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Base Pricing */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Base Pricing</label>
                <div className="border-2 border-dashed border-neutrals-4 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutrals-2">Per Person</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutrals-2 text-sm font-medium">$</span>
                      <input
                        type="text"
                        value={formData.pricePerPerson}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-20 px-3 py-2 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 text-center transition-colors"
                        placeholder="0.00"
                        style={{padding: '6px'}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cancellation Policy</label>
                <div className="relative">
                  <button
                    onClick={() => setShowCancellationPolicyDropdown(!showCancellationPolicyDropdown)}
                    className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 flex items-center justify-between transition-colors"
                    style={{padding: '6px'}}
                  >
                    <span className="pr-2 text-left">{getCancellationPolicyLabel(formData.cancellationPolicy)}</span>
                    <ChevronDown className="w-4 h-4 text-neutrals-4 flex-shrink-0" />
                  </button>
                  {showCancellationPolicyDropdown && (
                    <div className="absolute top-full mt-1 w-full bg-white border-2 border-neutrals-6 rounded-xl shadow-lg z-10">
                      {cancellationPolicies.map(policy => (
                        <button
                          key={policy.value}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, cancellationPolicy: policy.value }));
                            setShowCancellationPolicyDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-neutrals-7 text-sm font-medium text-neutrals-2 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          {policy.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Late Cancellation Fee */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Late Cancellation Fee (% of Total)</label>
                <div className="relative">
                  <button
                    onClick={() => setShowCancellationRateDropdown(!showCancellationRateDropdown)}
                    className="w-full px-4 py-4 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 flex items-center justify-between transition-colors"
                    style={{padding: '6px'}}
                  >
                    <span>{formData.cancellationRate}%</span>
                    <ChevronDown className="w-4 h-4 text-neutrals-4" />
                  </button>
                  {showCancellationRateDropdown && (
                    <div className="absolute top-full mt-1 w-full bg-white border-2 border-neutrals-6 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      {cancellationRates.map(rate => (
                        <button
                          key={rate}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, cancellationRate: rate }));
                            setShowCancellationRateDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-neutrals-7 text-sm font-medium text-neutrals-2 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  )}
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