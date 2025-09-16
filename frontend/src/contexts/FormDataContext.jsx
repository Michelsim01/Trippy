import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const FormDataContext = createContext();

export const useFormData = () => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};

export const FormDataProvider = ({ children }) => {
  const { user } = useAuth();
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [experienceId, setExperienceId] = useState(null);
  const [hasBookings, setHasBookings] = useState(false); // Mock bookings state

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

  // Edit mode methods
  const loadExistingExperience = async (id) => {
    try {
      setIsEditMode(true);
      setExperienceId(id);

      // Fetch experience data from API
      const response = await fetch(`http://localhost:8080/api/experiences/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch experience data');
      }

      const experienceData = await response.json();

      // Convert backend data to frontend format
      setFormData({
        // Basic Info
        title: experienceData.title || '',
        shortDescription: experienceData.shortDescription || '',
        highlights: experienceData.highlights && typeof experienceData.highlights === 'string' ? experienceData.highlights.split(', ') : [],
        category: Object.keys(categoryMapping).find(key => categoryMapping[key] === experienceData.category) || '',
        duration: experienceData.duration || '',
        startDateTime: experienceData.startDateTime || '',
        endDateTime: experienceData.endDateTime || '',
        location: experienceData.location || '',
        country: experienceData.country || '',
        tags: experienceData.tags || [],
        languages: [], // Extract from importantInfo if needed
        participantsAllowed: experienceData.participantsAllowed || '',
        coverPhotoUrl: experienceData.coverPhotoUrl || '',
        additionalPhotos: [], // Will load from media API

        // Details
        fullDescription: experienceData.fullDescription || '',
        whatIncluded: experienceData.whatIncluded || '',
        importantInfo: experienceData.importantInfo || '',
        itinerary: [], // Will be loaded separately

        // Pricing
        price: experienceData.price || '',

        // Availability
        schedules: [] // TODO: Load from schedules API
      });

      // Load additional photos from media API
      try {
        const mediaResponse = await fetch(`http://localhost:8080/api/experiences/${id}/media`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          const additionalPhotos = mediaData
            .filter(media => media.mediaType === 'IMAGE' && media.displayOrder > 0)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(media => media.mediaUrl);

          setFormData(prev => ({
            ...prev,
            additionalPhotos: additionalPhotos
          }));
        }
      } catch (error) {
        console.error('Error loading media data:', error);
      }

      // Load itinerary data from API
      try {
        const itineraryResponse = await fetch(`http://localhost:8080/api/experiences/${id}/itineraries`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (itineraryResponse.ok) {
          const itineraryData = await itineraryResponse.json();
          // Convert backend itinerary format to frontend format
          const formattedItinerary = itineraryData.map(item => ({
            location: item.locationName || '',
            time: item.duration || '',
            type: item.stopType || 'stop'
          }));

          setFormData(prev => ({
            ...prev,
            itinerary: formattedItinerary
          }));
        }
      } catch (error) {
        console.error('Error loading itinerary data:', error);
      }

      console.log('Loaded experience data for editing:', experienceData);
    } catch (error) {
      console.error('Error loading experience data:', error);
      alert('Failed to load experience data for editing');
    }
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setExperienceId(null);
    setHasBookings(false);
    clearFormData();
  };

  const toggleBookings = () => {
    setHasBookings(!hasBookings);
  };

  // Check if a field is restricted due to existing bookings
  const isFieldRestricted = (fieldName) => {
    if (!isEditMode || !hasBookings) return false;

    const restrictedFields = ['price', 'startDateTime', 'endDateTime', 'country', 'participantsAllowed', 'availability'];
    return restrictedFields.includes(fieldName);
  };

  // Save partial changes (for page-specific saves during edit flow)
  const savePartialChanges = async (partialData) => {
    if (!isEditMode || !experienceId) {
      throw new Error('Not in edit mode or no experience ID');
    }

    try {
      // Merge partial data with existing context data to avoid losing other fields
      const completeData = {
        ...formData,
        ...partialData
      };

      // Create payload using the complete merged data
      const payload = {
        // Main Experience entity
        experience: {
          title: completeData.title,
          shortDescription: completeData.shortDescription,
          fullDescription: completeData.fullDescription,
          highlights: Array.isArray(completeData.highlights) ? completeData.highlights.join(', ') : '',
          category: categoryMapping[completeData.category],
          tags: completeData.tags,
          coverPhotoUrl: completeData.coverPhotoUrl,
          whatIncluded: completeData.whatIncluded,
          importantInfo: completeData.importantInfo + (completeData.languages?.length > 0 ? `\n\nLanguages: ${completeData.languages.join(', ')}` : ''),
          price: parseFloat(completeData.price) || null,
          participantsAllowed: parseInt(completeData.participantsAllowed) || null,
          duration: parseFloat(completeData.duration) || null,
          startDateTime: completeData.startDateTime || null,
          endDateTime: completeData.endDateTime || null,
          location: completeData.location,
          country: completeData.country,
          status: 'ACTIVE'
        },

        // ExperienceItinerary entities
        itineraries: completeData.itinerary?.map((item, index) => ({
          stopOrder: index,
          stopType: item.type || 'stop',
          locationName: item.location || item.locationName,
          duration: item.time || item.duration
        })) || [],

        // ExperienceMedia entities
        media: [
          // Cover photo
          ...(completeData.coverPhotoUrl ? [{
            mediaUrl: completeData.coverPhotoUrl,
            mediaType: 'IMAGE',
            caption: 'Cover photo',
            displayOrder: 0
          }] : []),
          // Additional photos
          ...(completeData.additionalPhotos?.map((photo, index) => ({
            mediaUrl: photo,
            mediaType: 'IMAGE',
            caption: '',
            displayOrder: index + 1
          })) || [])
        ],

        // ExperienceSchedule entities
        schedules: completeData.schedules || []
      };

      const response = await fetch(`http://localhost:8080/api/experiences/${experienceId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save changes: ${response.status}`);
      }

      const result = await response.json();
      console.log('Successfully saved partial changes:', result);

      // Update context with the saved data
      updateFormData(partialData);

      return result;
    } catch (error) {
      console.error('Error saving partial changes:', error);
      throw error;
    }
  };

  // Save current changes (for incremental saves during edit flow)
  const saveCurrentChanges = async (currentFormData = null) => {
    if (!isEditMode || !experienceId) {
      throw new Error('Not in edit mode or no experience ID');
    }

    try {
      // Use provided data or fall back to context data
      const dataToSave = currentFormData || formData;

      // Create payload using the provided data
      const payload = {
        // Main Experience entity
        experience: {
          title: dataToSave.title,
          shortDescription: dataToSave.shortDescription,
          fullDescription: dataToSave.fullDescription,
          highlights: Array.isArray(dataToSave.highlights) ? dataToSave.highlights.join(', ') : '',
          category: categoryMapping[dataToSave.category],
          tags: dataToSave.tags,
          coverPhotoUrl: dataToSave.coverPhotoUrl,
          whatIncluded: dataToSave.whatIncluded,
          importantInfo: dataToSave.importantInfo + (dataToSave.languages?.length > 0 ? `\n\nLanguages: ${dataToSave.languages.join(', ')}` : ''),
          price: parseFloat(dataToSave.price) || null,
          participantsAllowed: parseInt(dataToSave.participantsAllowed) || null,
          duration: parseFloat(dataToSave.duration) || null,
          startDateTime: dataToSave.startDateTime || null,
          endDateTime: dataToSave.endDateTime || null,
          location: dataToSave.location,
          country: dataToSave.country,
          status: 'ACTIVE'
        },

        // ExperienceItinerary entities
        itineraries: dataToSave.itinerary?.map((item, index) => ({
          stopOrder: index,
          stopType: item.type || 'stop',
          locationName: item.location || item.locationName,
          duration: item.time || item.duration
        })) || [],

        // ExperienceMedia entities
        media: [
          // Cover photo
          ...(dataToSave.coverPhotoUrl ? [{
            mediaUrl: dataToSave.coverPhotoUrl,
            mediaType: 'IMAGE',
            caption: 'Cover photo',
            displayOrder: 0
          }] : []),
          // Additional photos
          ...(dataToSave.additionalPhotos?.map((photo, index) => ({
            mediaUrl: photo,
            mediaType: 'IMAGE',
            caption: '',
            displayOrder: index + 1
          })) || [])
        ],

        // ExperienceSchedule entities
        schedules: dataToSave.schedules || []
      };

      const response = await fetch(`http://localhost:8080/api/experiences/${experienceId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save changes: ${response.status}`);
      }

      const result = await response.json();
      console.log('Successfully saved changes:', result);
      return result;
    } catch (error) {
      console.error('Error saving changes:', error);
      throw error;
    }
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
        status: 'ACTIVE', // Default status
        userId: user?.id || user?.userId // Add user ID for experience ownership
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
      categoryMapping,
      // Edit mode properties and methods
      isEditMode,
      experienceId,
      hasBookings,
      loadExistingExperience,
      exitEditMode,
      toggleBookings,
      isFieldRestricted,
      saveCurrentChanges,
      savePartialChanges
    }}>
      {children}
    </FormDataContext.Provider>
  );
};

export { FormDataContext };