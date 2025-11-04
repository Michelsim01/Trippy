import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Flag, Navigation, MapPinIcon } from 'lucide-react';
import ItineraryItem from './ItineraryItem';
import LocationSearchInput from './LocationSearchInput';

export default function ItineraryBuilder({
  items = [],
  onItemsChange,
  meetingPoint = null, // {name, latitude, longitude, country, city}
  isMobile = false
}) {
  const [isMultiLocation, setIsMultiLocation] = useState(items.length > 0);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ location: "", time: "", type: "stop" });
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // Initialize with meeting point as start when toggled to multi-location
  useEffect(() => {
    if (isMultiLocation && items.length === 0 && meetingPoint) {
      // Auto-add meeting point as the start point with full location data
      const startPoint = {
        location: meetingPoint.name,
        latitude: meetingPoint.latitude,
        longitude: meetingPoint.longitude,
        time: "",
        type: "start"
      };
      console.log('🏁 Auto-adding START point from meeting point:', startPoint);
      onItemsChange([startPoint]);
    } else if (!isMultiLocation && items.length > 0) {
      // Clear itinerary when switched to single location
      onItemsChange([]);
    }
  }, [isMultiLocation]);

  // Update the starting point when meeting point changes
  useEffect(() => {
    if (isMultiLocation && items.length > 0 && meetingPoint) {
      // Check if the first item is a start point
      if (items[0].type === 'start') {
        // Check if the meeting point has actually changed
        const currentStart = items[0];
        const hasChanged = 
          currentStart.location !== meetingPoint.name ||
          currentStart.latitude !== meetingPoint.latitude ||
          currentStart.longitude !== meetingPoint.longitude;

        if (hasChanged) {
          // Update the start point to match the new meeting point
          const updatedItems = [...items];
          updatedItems[0] = {
            ...updatedItems[0],
            location: meetingPoint.name,
            latitude: meetingPoint.latitude,
            longitude: meetingPoint.longitude
          };
          onItemsChange(updatedItems);
        }
      }
    }
  }, [meetingPoint, isMultiLocation]);

  // Helper function to suggest the next appropriate type
  const getDefaultItemType = () => {
    const hasStart = items.some(item => item.type === 'start');
    const hasEnd = items.some(item => item.type === 'end');

    // Start should already be set automatically
    if (!hasStart) return 'start';
    // If we have items but no end, suggest end
    if (hasStart && items.length > 1 && !hasEnd) return 'end';
    // Only allow stop between start and end
    return 'stop';
  };

  // Check if an end point already exists
  const hasEndPoint = items.some(item => item.type === 'end');

  // Validate that we have start and end before allowing submission
  const canAddItem = () => {
    if (!newItem.location.trim()) return false;
    
    // If it's a stop, duration is required
    if (newItem.type === 'stop' && !newItem.time.trim()) return false;
    
    // Must have at least start point
    const hasStart = items.some(item => item.type === 'start');
    if (!hasStart && newItem.type !== 'start') return false;
    
    return true;
  };

  const addItem = () => {
    if (canAddItem()) {
      const itemToAdd = {
        ...newItem,
        location: newItem.location.trim(),
        // Explicitly preserve coordinates
        latitude: newItem.latitude,
        longitude: newItem.longitude
      };

      console.log('📝 Adding itinerary item:', itemToAdd);

      const updatedItems = [...items, itemToAdd];
      onItemsChange(updatedItems);

      setNewItem({ location: "", time: "", type: getDefaultItemType() });
      setShowForm(false);
    }
  };

  const updateItem = (index, field, value) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onItemsChange(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const typeOptions = [
    { value: 'stop', label: 'Stop', icon: MapPinIcon, color: 'text-blue-600' },
    { value: 'end', label: 'End Point', icon: Navigation, color: 'text-red-600' }
  ];

  const marginBottom = isMobile ? '15px' : '15px';
  const padding = isMobile ? 'p-4' : 'p-8';
  const itemSpacing = isMobile ? 'space-y-4' : 'space-y-6';
  const containerPadding = isMobile ? 'padding: 10px' : 'padding: 10px';
  const buttonTextSize = isMobile ? 'text-sm' : 'text-base';
  const buttonPadding = isMobile ? 'px-3 py-2' : 'px-4 py-3';
  const iconSizeInButton = isMobile ? 'w-3 h-3' : 'w-4 h-4';
  const formMargin = isMobile ? 'margin: 16px 12px' : 'margin: 16px';

  return (
    <div style={{marginBottom}}>
      <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Itinerary Builder</label>
      
      {/* Toggle for Multi-Location */}
      <div className="mb-6 bg-white p-6 rounded-xl border-2 border-neutrals-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-neutrals-1 mb-1`}>
              Multiple Locations
            </p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutrals-4`}>
              Will this experience visit multiple locations?
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${isMultiLocation ? 'text-neutrals-4' : 'text-neutrals-2'}`}>
              No
            </span>
            <button
              onClick={() => setIsMultiLocation(!isMultiLocation)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                isMultiLocation ? 'bg-primary-1 shadow-md' : 'bg-neutrals-5'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  isMultiLocation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${isMultiLocation ? 'text-primary-1' : 'text-neutrals-4'}`}>
              Yes
            </span>
          </div>
        </div>
        {!isMultiLocation && (
          <div className="mt-4 flex items-start gap-2 bg-neutrals-7 p-3 rounded-lg border border-neutrals-6">
            <span className="text-lg">📍</span>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutrals-3`}>
              Experience will take place at the meeting point location only.
            </p>
          </div>
        )}
        {isMultiLocation && !hasEndPoint && items.length > 1 && (
          <div className="mt-4 flex items-start gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <span className="text-lg">⚠️</span>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-yellow-700 font-medium`}>
              Don't forget to add an end point for your itinerary!
            </p>
          </div>
        )}
      </div>

      {/* Show itinerary builder only if multi-location is enabled */}
      {isMultiLocation && (
        <div className={`bg-white rounded-xl border-2 border-neutrals-6 shadow-sm ${padding}`}>
          {/* Header */}
          <div className="mb-6 pb-4 border-b-2 border-neutrals-6">
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-neutrals-1 mb-1`}>
              Your Itinerary
            </h3>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutrals-4`}>
              Add stops to create your experience route
            </p>
          </div>

          <div className={itemSpacing} style={{[containerPadding]: true}}>
            {items.map((item, index) => (
              <ItineraryItem
                key={index}
                item={item}
                index={index}
                isLast={index === items.length - 1}
                onUpdate={(field, value) => updateItem(index, field, value)}
                onRemove={() => removeItem(index)}
                isMobile={isMobile}
              />
            ))}
          </div>

          {/* Add Button */}
          {!showForm && !hasEndPoint && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-neutrals-6">
              <button
                onClick={() => {
                  setNewItem({ location: "", time: "", type: getDefaultItemType() });
                  setShowForm(true);
                }}
                className={`w-full ${buttonPadding} bg-primary-1 hover:bg-primary-2 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
              >
                <Plus className="w-5 h-5" />
                <span>Add Itinerary Stop</span>
              </button>
            </div>
          )}

          {/* End Point Added Message */}
          {hasEndPoint && !showForm && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-neutrals-6">
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 flex items-center justify-center gap-2">
                <span className="text-2xl">✓</span>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-green-700`}>
                  Itinerary Complete
                </p>
              </div>
            </div>
          )}

          {/* Add Form */}
          {showForm && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-neutrals-6">
              <div className="bg-gradient-to-br from-primary-1/5 to-green-50 p-6 rounded-xl border-2 border-primary-1/20">
                <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-neutrals-1 mb-4`}>
                  Add New Stop
                </h4>
                
                <div style={{marginBottom: '16px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-2">Type</label>
                  <div className={`relative ${isMobile ? 'mb-3' : 'mb-0'}`}>
                    <button
                      onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                      className={`w-full ${buttonPadding} bg-white border-2 border-neutrals-5 rounded-xl flex items-center justify-between text-left ${buttonTextSize} font-semibold text-neutrals-2 hover:border-primary-1 transition-all shadow-sm hover:shadow-md`}
                    >
                      <div className="flex items-center gap-3">
                        {typeOptions.map(option => {
                          if (option.value === newItem.type) {
                            const Icon = option.icon;
                            return (
                              <React.Fragment key={option.value}>
                                <div className={`p-2 rounded-lg ${
                                  option.value === 'start' ? 'bg-green-100' :
                                  option.value === 'end' ? 'bg-red-100' : 'bg-blue-100'
                                }`}>
                                  <Icon className={`${iconSizeInButton} ${option.color}`} />
                                </div>
                                <span className={isMobile ? 'text-sm font-bold' : 'font-bold'}>{option.label}</span>
                              </React.Fragment>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <ChevronDown className={`${iconSizeInButton} text-neutrals-4`} />
                    </button>
                    {typeDropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-xl z-10 overflow-hidden">
                        {typeOptions.map(({ value, label, icon: Icon, color }) => (
                          <button
                            key={value}
                            onClick={() => {
                              setNewItem(prev => ({ ...prev, type: value }));
                              setTypeDropdownOpen(false);
                            }}
                            className={`w-full ${buttonPadding} text-left hover:bg-neutrals-7 transition-colors flex items-center gap-3`}
                          >
                            <div className={`p-2 rounded-lg ${
                              value === 'start' ? 'bg-green-100' :
                              value === 'end' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              <Icon className={`${iconSizeInButton} ${color}`} />
                            </div>
                            <span className={`${buttonTextSize} font-semibold`}>{label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{marginBottom: '16px'}}>
                  <label className="block text-xs font-bold uppercase text-neutrals-5 mb-2">Location <span className="text-red-500">*</span></label>
                  <LocationSearchInput
                    label=""
                    value={{ name: newItem.location }}
                    onChange={(locationData) => setNewItem(prev => ({ 
                      ...prev, 
                      location: locationData.name,
                      latitude: locationData.latitude,
                      longitude: locationData.longitude
                    }))}
                    placeholder="Search for a location..."
                    isMobile={isMobile}
                    required={true}
                    showClearButton={false}
                  />
                </div>
                
                {newItem.type === 'stop' && (
                  <div style={{marginBottom: '20px'}}>
                    <label className="block text-xs font-bold uppercase text-neutrals-5 mb-2">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newItem.time}
                      onChange={(e) => setNewItem(prev => ({ ...prev, time: e.target.value }))}
                      className={`w-full ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} bg-white border-2 ${
                        newItem.time.trim() ? 'border-neutrals-5' : 'border-red-300'
                      } rounded-xl ${isMobile ? 'text-sm' : 'text-base'} font-medium text-neutrals-2 focus:outline-none focus:border-primary-1 transition-all shadow-sm`}
                      required
                    >
                      <option value="">Select duration...</option>
                      <option value="15 minutes">15 minutes</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="45 minutes">45 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="1.5 hours">1.5 hours</option>
                      <option value="2 hours">2 hours</option>
                      <option value="2.5 hours">2.5 hours</option>
                      <option value="3 hours">3 hours</option>
                      <option value="4 hours">4 hours</option>
                      <option value="5 hours">5 hours</option>
                      <option value="6 hours">6 hours</option>
                      <option value="Full day">Full day</option>
                    </select>
                    {!newItem.time.trim() && (
                      <p className="text-xs text-red-500 mt-1">Duration is required for stops</p>
                    )}
                  </div>
                )}
                
                <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                  <button
                    onClick={() => setShowForm(false)}
                    className={`${isMobile ? 'px-4 py-2' : 'px-6 py-3'} border-2 border-neutrals-5 bg-white rounded-xl ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-neutrals-3 hover:bg-neutrals-7 transition-all shadow-sm`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addItem}
                    className={`${isMobile ? 'px-4 py-2' : 'px-6 py-3'} border-2 border-primary-1 bg-primary-1 rounded-xl ${isMobile ? 'text-xs' : 'text-sm'} font-bold text-white hover:bg-primary-2 transition-all shadow-md hover:shadow-lg`}
                  >
                    Add Stop
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}