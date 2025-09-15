import React, { createContext, useContext, useState } from 'react';

const FormDataContext = createContext();

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};

export const FormDataProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    // Step 1: Basic Info - matching Experience entity fields
    title: '',
    shortDescription: '',
    highlights: [], // Array for UI, will be converted to String for backend
    category: '', // ExperienceCategory enum
    duration: '', // BigDecimal in backend, will convert to number (calculated from start/end)
    startDateTime: '', // New field: Start date and time for multi-day support
    endDateTime: '', // New field: End date and time for multi-day support
    location: '',
    country: '', // New field for country where experience is held
    tags: [], // List<String> in backend
    languages: [], // Not in backend Experience entity - will store in important_info or separate handling
    participantsAllowed: '', // Integer - NEW FIELD
    coverPhotoUrl: '', // changed from 'mainPhoto'
    additionalPhotos: [], // Will be converted to ExperienceMedia records

    // Step 2: Details - matching Experience entity fields
    fullDescription: '',
    whatIncluded: '', // String, not array (backend stores as String)
    importantInfo: '', // changed from 'additionalInfo'
    
    // Itinerary data - will be converted to ExperienceItinerary records
    itinerary: [], // Each item: { stopOrder, stopType, locationName, duration }

    // Step 3: Pricing - matching Experience entity fields
    price: '', // BigDecimal, changed from 'pricePerPerson'

    // Step 4: Availability - will be converted to ExperienceSchedule records
    schedules: [] // Each item: { date, startTime, endTime, availableSpots, isAvailable }
  });

  // Category mapping: Friendly names to backend enums
  const categoryMapping = {
    'Guided Tour': 'GUIDED_TOUR',
    'Day Trip': 'DAYTRIP', 
    'Adventure & Sports': 'ADVENTURE',
    'Workshop & Classes': 'WORKSHOP',
    'Water Activities': 'WATER_ACTIVITY',
    'Others': 'OTHERS'
  };


  const updateFormData = (newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
  };

  const clearFormData = () => {
    setFormData({
      title: '',
      shortDescription: '',
      highlights: [],
      category: '',
      duration: '',
      startDateTime: '',
      endDateTime: '',
      location: '',
      country: '',
      tags: [],
      languages: [],
      participantsAllowed: '',
      coverPhotoUrl: '',
      additionalPhotos: [],
      fullDescription: '',
      whatIncluded: '',
      importantInfo: '',
      itinerary: [],
      price: '',
      schedules: []
    });
  };

  // Helper function to convert frontend data to backend format
  const getBackendPayload = () => {
    return {
      // Main Experience entity
      experience: {
        title: formData.title,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        highlights: Array.isArray(formData.highlights) ? formData.highlights.join(', ') : '', // Convert array to String for backend
        category: categoryMapping[formData.category], // Convert to enum
        tags: formData.tags, // Already array
        coverPhotoUrl: formData.coverPhotoUrl,
        whatIncluded: formData.whatIncluded, // String
        importantInfo: formData.importantInfo + (formData.languages.length > 0 ? `\n\nLanguages: ${formData.languages.join(', ')}` : ''),
        price: parseFloat(formData.price) || null,
        participantsAllowed: parseInt(formData.participantsAllowed) || null,
        duration: parseFloat(formData.duration) || null,
        startDateTime: formData.startDateTime || null,
        endDateTime: formData.endDateTime || null,
        location: formData.location,
        country: formData.country,
        status: 'ACTIVE' // Default status
      },

      // ExperienceItinerary entities (separate records)
      itineraries: formData.itinerary.map((item, index) => ({
        stopOrder: index,
        stopType: item.type || 'stop',
        locationName: item.location || item.locationName,
        duration: item.time || item.duration
      })),

      // ExperienceMedia entities (separate records)
      media: [
        // Cover photo
        ...(formData.coverPhotoUrl ? [{
          mediaUrl: formData.coverPhotoUrl,
          mediaType: 'IMAGE',
          caption: 'Cover photo',
          displayOrder: 0
        }] : []),
        // Additional photos
        ...formData.additionalPhotos.map((photo, index) => ({
          mediaUrl: photo,
          mediaType: 'IMAGE',
          caption: '',
          displayOrder: index + 1
        }))
      ],

      // ExperienceSchedule entities (separate records)
      schedules: formData.schedules || []
    };
  };

  return (
    <FormDataContext.Provider value={{
      formData,
      updateFormData,
      clearFormData,
      getBackendPayload,
      categoryMapping
    }}>
      {children}
    </FormDataContext.Provider>
  );
};

export { FormDataContext };