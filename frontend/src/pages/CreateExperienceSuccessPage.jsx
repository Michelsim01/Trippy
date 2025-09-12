import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormData } from '../contexts/FormDataContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

export default function CreateExperienceSuccessPage() {
  const navigate = useNavigate()
  const { formData } = useFormData()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const handleViewExperience = () => {
    // Navigate to the dynamic route with the created experience ID
    if (formData.createdExperience?.experienceId) {
      navigate(`/experience/${formData.createdExperience.experienceId}`)
    } else {
      // Fallback to the static page if no ID available
      navigate('/experience-details')
    }
  }

  const handleCreateAnother = () => {
    navigate('/create-experience/basic-info')
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
          
          <div className="flex-1 flex items-center justify-center" style={{ paddingTop: '40px', paddingBottom: '100px' }}>
          <div className="max-w-2xl mx-auto px-10 text-center">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-primary-1 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold text-neutrals-1 mb-4">
              Experience Created Successfully!
            </h1>
            
            <p className="text-lg text-neutrals-3 mb-4">
              Congratulations! Your experience "{formData.title || 'Your Experience'}" has been created and is ready to welcome guests.
            </p>
            
            {/* Experience ID Display */}
            {formData.createdExperience?.experienceId && (
              <div className="bg-primary-1 bg-opacity-10 border border-primary-1 rounded-lg p-4 mb-8">
                <div className="text-center">
                  <span className="text-sm font-semibold text-primary-1 uppercase tracking-wide">Experience ID</span>
                  <div className="text-2xl font-bold text-primary-1 mt-1">#{formData.createdExperience.experienceId}</div>
                  <p className="text-xs text-neutrals-4 mt-2">Share this ID with travelers for easy booking</p>
                </div>
              </div>
            )}

            {/* Experience Summary */}
            <div className="bg-neutrals-7 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-neutrals-1 mb-4">Experience Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutrals-3">Title:</span>
                  <span className="text-neutrals-1 font-medium">{formData.title || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-3">Location:</span>
                  <span className="text-neutrals-1 font-medium">{formData.location || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-3">Duration:</span>
                  <span className="text-neutrals-1 font-medium">{formData.duration ? `${formData.duration} hours` : 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-3">Price:</span>
                  <span className="text-neutrals-1 font-medium">{formData.price ? `$${formData.price}` : 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutrals-3">Max Participants:</span>
                  <span className="text-neutrals-1 font-medium">{formData.participantsAllowed || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleViewExperience}
                className="bg-primary-1 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
              >
                View Your Experience
              </button>
              <button
                onClick={handleCreateAnother}
                className="border-2 border-neutrals-5 text-neutrals-2 px-8 py-3 rounded-lg font-semibold hover:bg-neutrals-7 transition-colors"
              >
                Create Another Experience
              </button>
            </div>

            {/* Next Steps */}
            <div className="mt-12 text-left">
              <h3 className="text-lg font-semibold text-neutrals-1 mb-4">What's Next?</h3>
              <ul className="space-y-3 text-neutrals-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <span>Your experience is now live and available for booking</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <span>Guests can discover and book your experience through our platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <span>Manage bookings and edit your experience from your profile page</span>
                </li>
              </ul>
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
          variant="mobile"
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        
        <div className="flex-1 min-h-screen" style={{ paddingTop: '20px', paddingBottom: '60px', paddingLeft: '16px', paddingRight: '16px' }}>
          {/* Success Icon */}
          <div className="w-16 h-16 bg-primary-1 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-neutrals-1 mb-4 text-center">
            Experience Created!
          </h1>
          
          <p className="text-neutrals-3 mb-4 text-center">
            "{formData.title || 'Your Experience'}" is ready for guests!
          </p>
          
          {/* Mobile Experience ID Display */}
          {formData.createdExperience?.experienceId && (
            <div className="bg-primary-1 bg-opacity-10 border border-primary-1 rounded-lg p-3 mb-6">
              <div className="text-center">
                <span className="text-xs font-semibold text-primary-1 uppercase tracking-wide">Experience ID</span>
                <div className="text-xl font-bold text-primary-1 mt-1">#{formData.createdExperience.experienceId}</div>
                <p className="text-xs text-neutrals-4 mt-1">Share with travelers for booking</p>
              </div>
            </div>
          )}

          {/* Mobile Summary */}
          <div className="bg-neutrals-7 rounded-2xl p-4 mb-6">
            <h3 className="text-lg font-semibold text-neutrals-1 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutrals-3">Price:</span>
                <span className="text-neutrals-1 font-medium">{formData.price ? `$${formData.price}` : 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutrals-3">Duration:</span>
                <span className="text-neutrals-1 font-medium">{formData.duration ? `${formData.duration}h` : 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutrals-3">Max Guests:</span>
                <span className="text-neutrals-1 font-medium">{formData.participantsAllowed || 'TBD'}</span>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewExperience}
              className="w-full bg-primary-1 text-white py-3 rounded-lg font-semibold"
            >
              View Your Experience
            </button>
            <button
              onClick={handleCreateAnother}
              className="w-full border-2 border-neutrals-5 text-neutrals-2 py-3 rounded-lg font-semibold"
            >
              Create Another
            </button>
          </div>

          {/* Mobile Next Steps */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-neutrals-1 mb-4">What's Next?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span className="text-neutrals-3">Your experience is now live</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <span className="text-neutrals-3">Guests can book through our platform</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-1 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <span className="text-neutrals-3">Manage from your profile page</span>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}