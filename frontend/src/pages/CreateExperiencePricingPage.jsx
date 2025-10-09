import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProgressSteps from '../components/create-experience/ProgressSteps';
import FormField from '../components/create-experience/FormField';

export default function CreateExperiencePricingPage() {
  const navigate = useNavigate();
  const { formData: contextData, updateFormData } = useFormData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    pricePerPerson: contextData?.pricePerPerson || "",
    currency: contextData?.currency || "$"
  });


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
      price: formData.pricePerPerson,  // Changed to 'price' to match FormDataContext
      currency: formData.currency
    });
    
    navigate('/create-experience/availability');
  };

  const handleBack = () => {
    navigate('/create-experience/details');
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
              <ProgressSteps currentStep={3} />
            </div>
            <div className="max-w-4xl">
              <div>
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

                  {/* Cancellation Policy Information */}
                  <div style={{marginBottom: '15px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cancellation Policy</label>
                    <div className="border-2 border-neutrals-4 rounded-xl p-6 bg-neutrals-7">
                      <div className="text-sm text-neutrals-2">
                        <p className="mb-2"><strong>Free Cancellation:</strong> 24 hours after purchase for full refund</p>
                        <p className="mb-2"><strong>7+ days before:</strong> Full refund (minus service fee)</p>
                        <p className="mb-2"><strong>3-6 days before:</strong> 50% refund (minus service fee)</p>
                        <p className="mb-2"><strong>Less than 3 days:</strong> Non-refundable</p>
                        <p><strong>No-shows:</strong> Non-refundable</p>
                      </div>
                    </div>
                  </div>
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
              <ProgressSteps currentStep={3} isMobile={true} />
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

              {/* Cancellation Policy Information */}
              <div style={{marginBottom: '10px'}}>
                <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cancellation Policy</label>
                <div className="border-2 border-neutrals-4 rounded-xl p-4 bg-neutrals-7">
                  <div className="text-xs text-neutrals-2">
                    <p className="mb-1"><strong>Free Cancellation:</strong> 24 hours after purchase for full refund</p>
                    <p className="mb-1"><strong>7+ days before:</strong> Full refund (minus service fee)</p>
                    <p className="mb-1"><strong>3-6 days before:</strong> 50% refund (minus service fee)</p>
                    <p className="mb-1"><strong>Less than 3 days:</strong> Non-refundable</p>
                    <p><strong>No-shows:</strong> Non-refundable</p>
                  </div>
                </div>
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