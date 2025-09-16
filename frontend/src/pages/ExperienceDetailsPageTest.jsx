import { useState } from 'react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const ExperienceDetailsPageTest = () => {
  const { formData } = useFormData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:flex-col">
        <Navbar />
        
        <div className="flex-1" style={{ paddingTop: '40px', paddingBottom: '100px' }}>
          <div className="max-w-7xl mx-auto px-10">
            <h1 className="text-5xl font-bold text-neutrals-2 leading-tight mb-4">
              {formData.title || 'Test Experience Page'}
            </h1>
            <p className="text-neutrals-3">
              This is a test page to check if the basic layout works.
            </p>
            <p className="text-neutrals-4 mt-4">
              FormData title: {formData.title || 'No title'}
            </p>
          </div>
        </div>

        <Footer />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar
          isAuthenticated={true}
          variant="mobile"
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        
        <div className="flex-1 min-h-screen" style={{ paddingTop: '20px', paddingBottom: '60px', paddingLeft: '16px', paddingRight: '16px' }}>
          <h1 className="text-2xl font-bold text-neutrals-2 mb-4">
            {formData.title || 'Test Mobile Experience Page'}
          </h1>
          <p className="text-neutrals-3">
            Mobile test page working.
          </p>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default ExperienceDetailsPageTest;