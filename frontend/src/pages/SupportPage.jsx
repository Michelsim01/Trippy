import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { supportService } from '../services/supportService'

const TICKET_TYPES = [
  { value: 'GENERAL_INQUIRY', label: 'General Inquiry' },
  { value: 'TECHNICAL_SUPPORT', label: 'Technical Support' },
  { value: 'BOOKING_HELP', label: 'Booking Help' },
  { value: 'SUSPENSION_APPEAL', label: 'Suspension Appeal' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'FEEDBACK', label: 'Feedback' }
]

export default function SupportPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [ticketType, setTicketType] = useState('GENERAL_INQUIRY')
  const [description, setDescription] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [suspensionInfo, setSuspensionInfo] = useState(null)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  const disabled = useMemo(() => {
    return !userEmail || !userName || !description || isSubmitting
  }, [userEmail, userName, description, isSubmitting])

  const checkSuspension = async (email) => {
    if (!email) return
    try {
      setChecking(true)
      const info = await supportService.checkSuspensionStatus(email)
      setSuspensionInfo(info)
      if (info && info.exists && info.isActive === false) {
        setTicketType('SUSPENSION_APPEAL')
        setStatusMsg('Your account appears suspended. You can submit a suspension appeal below.')
      } else {
        setStatusMsg('')
      }
    } catch (e) {
      // noop; allow ticket submission regardless
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      checkSuspension(userEmail)
    }, 400)
    return () => clearTimeout(timeout)
  }, [userEmail])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatusMsg('')
    try {
      const ticketData = { userEmail, userName, ticketType, description }
      console.log('Frontend sending ticket data:', ticketData)
      console.log('Description value:', description)
      console.log('Description type:', typeof description)
      const res = await supportService.createTicket(ticketData)
      setSubmitted(true)
      setStatusMsg('Your ticket was submitted successfully. We will get back to you via email.')
      // Reset form fields
      setUserEmail('')
      setUserName('')
      setTicketType('GENERAL_INQUIRY')
      setDescription('')
    } catch (err) {
      setStatusMsg('Failed to submit ticket. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar column */}
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
        </div>
        {/* Main content */}
        <div className="flex-1 w-full transition-all duration-300">
          <Navbar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
          <main className="w-full px-4 py-8">
            {submitted && (
              <div className="max-w-2xl mx-auto mb-4">
                <div className="text-green-900 bg-green-100 border border-green-300 rounded-xl px-4 py-4 text-base md:text-lg font-medium">
                  {statusMsg || 'Your ticket was submitted successfully. We will get back to you via email.'}
                </div>
              </div>
            )}
            <div className={`max-w-2xl mx-auto rounded-2xl shadow p-6 bg-white`}>
              <h1 className="text-2xl font-poppins font-semibold text-neutrals-1 mb-2">Support</h1>
              <p className="text-neutrals-4 mb-6">Submit a ticket and we'll reach you via email.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutrals-2 mb-1">Your Email</label>
                  <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Enter your email" className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1" />
                  {checking && <div className="text-xs text-neutrals-4 mt-1">Checking status…</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-2 mb-1">Your Name</label>
                  <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name" className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-2 mb-1">Ticket Type</label>
                  <select value={ticketType} onChange={(e) => setTicketType(e.target.value)} className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1">
                    {TICKET_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutrals-2 mb-1">Description</label>
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue or request" rows={6} className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1" />
                </div>
                <button type="submit" disabled={disabled} className={`w-full rounded-lg px-4 py-2 font-medium text-white ${disabled ? 'bg-neutrals-6' : 'bg-primary-1 hover:opacity-90'}`}>
                  {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </form>
            </div>
            <div className="h-px bg-neutrals-6 w-full mt-6" />
            <Footer />
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar variant="mobile" isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />
        <main className="w-full px-4 py-6">
          {submitted && (
            <div className="mb-4">
              <div className="text-green-900 bg-green-100 border border-green-300 rounded-xl px-4 py-4 text-base font-medium">
                {statusMsg || 'Your ticket was submitted successfully. We will get back to you via email.'}
              </div>
            </div>
          )}
          <div className={`rounded-2xl shadow p-6 bg-white`}>
            <h1 className="text-2xl font-poppins font-semibold text-neutrals-1 mb-2">Support</h1>
            <p className="text-neutrals-4 mb-6">Submit a ticket and we'll reach you via email.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-1">Your Email</label>
                <input type="email" required value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Enter your email" className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1" />
                {checking && <div className="text-xs text-neutrals-4 mt-1">Checking status…</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-1">Your Name</label>
                <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name" className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-1">Ticket Type</label>
                <select value={ticketType} onChange={(e) => setTicketType(e.target.value)} className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1">
                  {TICKET_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-1">Description</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue or request" rows={6} className="w-full border border-neutrals-7 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-1" />
              </div>
              <button type="submit" disabled={disabled} className={`w-full rounded-lg px-4 py-2 font-medium text-white ${disabled ? 'bg-neutrals-6' : 'bg-primary-1 hover:opacity-90'}`}>
                {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </form>
          </div>
          <div className="h-px bg-neutrals-6 w-full mt-6" />
          <Footer />
        </main>
      </div>
    </div>
  )
}


