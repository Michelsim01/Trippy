import React, { useState } from 'react';
import { Plus, ChevronDown, Flag, Navigation, MapPinIcon } from 'lucide-react';
import ItineraryItem from './ItineraryItem';

export default function ItineraryBuilder({
  items = [],
  onItemsChange,
  isMobile = false
}) {
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ location: "", time: "", type: "stop" });
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  // Helper function to suggest the next appropriate type
  const getDefaultItemType = () => {
    const hasStart = items.some(item => item.type === 'start');
    const hasEnd = items.some(item => item.type === 'end');

    if (!hasStart) return 'start';
    if (hasStart && !hasEnd && items.length > 1) return 'end';
    return 'stop';
  };

  const addItem = () => {
    if (newItem.location.trim()) {
      const itemToAdd = {
        ...newItem,
        location: newItem.location.trim()
      };

      const updatedItems = [...items, itemToAdd];
      onItemsChange(updatedItems);

      setNewItem({ location: "", time: "", type: "stop" });
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
    { value: 'start', label: 'Start Point', icon: Flag, color: 'text-green-600' },
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
      <div className={`border-2 border-dashed border-neutrals-4 rounded-xl ${padding}`}>
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
        {!showForm && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '0px',
            paddingBottom: '8px',
            paddingLeft: '8px',
            paddingRight: '8px'
          }}>
            <button
              onClick={() => {
                setNewItem({ location: "", time: "", type: getDefaultItemType() });
                setShowForm(true);
              }}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: isMobile ? '8px 16px' : '10px 20px',
                borderRadius: '20px',
                border: 'none',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus style={{width: '16px', height: '16px'}} />
              Add Itinerary Item
            </button>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            padding: '16px',
            [formMargin]: true,
            backgroundColor: 'white'
          }}>
            <div style={{marginBottom: '12px'}}>
              <label className="block text-xs font-bold uppercase text-neutrals-5 mb-2">Type</label>
              <div className={`relative ${isMobile ? 'mb-3' : 'mb-4'}`}>
                <button
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  className={`w-full ${buttonPadding} border border-neutrals-5 rounded-lg flex items-center justify-between text-left ${buttonTextSize} font-medium text-neutrals-2 hover:border-neutrals-4 transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    {typeOptions.map(option => {
                      if (option.value === newItem.type) {
                        const Icon = option.icon;
                        return (
                          <React.Fragment key={option.value}>
                            <Icon className={`${iconSizeInButton} ${option.color}`} />
                            <span className={isMobile ? 'text-sm' : ''}>{option.label}</span>
                          </React.Fragment>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <ChevronDown className={`${iconSizeInButton} text-neutrals-4`} />
                </button>
                {typeDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-neutrals-5 rounded-lg shadow-lg z-10">
                    {typeOptions.map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setNewItem(prev => ({ ...prev, type: value }));
                          setTypeDropdownOpen(false);
                        }}
                        className={`w-full ${buttonPadding} text-left hover:bg-neutrals-7 first:rounded-t-lg last:rounded-b-lg transition-colors flex items-center gap-2`}
                      >
                        <Icon className={`${iconSizeInButton} ${color}`} />
                        <span className={`${buttonTextSize} font-medium`}>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{marginBottom: '12px'}}>
              <input
                type="text"
                value={newItem.location}
                onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Location name"
                style={{
                  width: '100%',
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '500',
                  color: '#374151',
                  outline: 'none'
                }}
              />
            </div>
            {newItem.type === 'stop' && (
              <div style={{marginBottom: '16px'}}>
                <input
                  type="text"
                  value={newItem.time}
                  onChange={(e) => setNewItem(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="Duration (e.g., 1 hour)"
                  style={{
                    width: '100%',
                    padding: isMobile ? '6px 10px' : '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '500',
                    color: '#374151',
                    outline: 'none'
                  }}
                />
              </div>
            )}
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addItem}
                style={{
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#10b981',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}