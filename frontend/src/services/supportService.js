const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const supportService = {
  async createTicket({ userEmail, userName, ticketType, description }) {
    const payload = { userEmail, userName, ticketType, description }
    console.log('supportService sending payload:', payload)
    console.log('Description in payload:', payload.description)
    console.log('Description type in payload:', typeof payload.description)
    
    // Get auth token from localStorage if user is logged in
    const token = localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('Including auth token in support ticket request')
    } else {
      console.log('No auth token found, submitting as anonymous user')
    }
    
    const res = await fetch(`${API_BASE}/api/support/tickets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to create ticket')
    return res.json()
  },
  async checkSuspensionStatus(email) {
    const url = new URL(`${API_BASE}/api/support/suspension-status`)
    url.searchParams.set('email', email)
    const res = await fetch(url.toString(), {
      method: 'GET'
    })
    if (!res.ok) throw new Error('Failed to check suspension status')
    return res.json()
  }
}


