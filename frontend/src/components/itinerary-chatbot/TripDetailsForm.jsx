import React, { useState } from 'react'
import { MapPin, Calendar, Clock } from 'lucide-react'

const TripDetailsForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    destination: '',
    duration: '',
    startDate: '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required'
    }

    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 day'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    } else {
      const selectedDate = new Date(formData.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        newErrors.startDate = 'Start date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    // Format the date to "Month Day, Year" format (e.g., "February 1, 2026")
    const date = new Date(formData.startDate)
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // Generate the prompt in the standard format
    const prompt = `I want to travel to ${formData.destination} for ${formData.duration} days, starting ${formattedDate}`

    onSubmit(prompt)
  }

  return (
    <div className="flex items-center justify-center h-full px-6 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-1 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutrals-1 mb-2">
            Plan Your Trip
          </h2>
          <p className="text-neutrals-3">
            Tell us about your travel plans and we'll create a personalized itinerary for you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-neutrals-2 mb-2">
              Destination Country *
            </label>
            <input
              type="text"
              id="destination"
              value={formData.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              placeholder="e.g., United States, Japan, France"
              className={`w-full px-4 py-3 border ${
                errors.destination ? 'border-red-500' : 'border-neutrals-6'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent`}
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-500">{errors.destination}</p>
            )}
          </div>

          {/* Duration and Start Date in a row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-neutrals-2 mb-2">
                Duration (days) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutrals-4" />
                <input
                  type="number"
                  id="duration"
                  min="1"
                  max="30"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="5"
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.duration ? 'border-red-500' : 'border-neutrals-6'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent`}
                />
              </div>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-neutrals-2 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutrals-4" />
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.startDate ? 'border-red-500' : 'border-neutrals-6'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent`}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary-1 text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-1 focus:ring-offset-2"
          >
            Create My Itinerary
          </button>
        </form>

        <p className="text-center text-xs text-neutrals-4 mt-4">
          * Required fields
        </p>
      </div>
    </div>
  )
}

export default TripDetailsForm
