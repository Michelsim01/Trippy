import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';

export default function LocationSearchInput({
  label = "Location/Meeting Point",
  value = "",
  onChange,
  placeholder = "Search for a location...",
  isMobile = false,
  error = null,
  disabled = false,
  required = false,
  showClearButton = true
}) {
  const [query, setQuery] = useState((value && value.name) ? value.name : "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [apiError, setApiError] = useState(null);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  const marginBottom = isMobile ? '10px' : '15px';
  const inputPadding = isMobile ? '4px' : '6px';

  // Apply error styling if there's an error
  const borderColor = error ? 'border-red-500' : 'border-neutrals-5';
  const focusBorderColor = error ? 'focus:border-red-500' : 'focus:border-primary-1';

  const inputClasses = isMobile
    ? `w-full px-4 py-4 border-2 ${borderColor} rounded-xl focus:outline-none ${focusBorderColor} text-sm font-medium text-neutrals-2 transition-colors ${disabled ? 'bg-neutrals-7 text-neutrals-4 cursor-not-allowed' : ''}`
    : `w-full px-6 py-5 border-2 ${borderColor} rounded-xl focus:outline-none ${focusBorderColor} text-lg font-medium text-neutrals-2 transition-colors ${disabled ? 'bg-neutrals-7 text-neutrals-4 cursor-not-allowed' : ''}`;

  // Debounced search function
  const searchLocations = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch(`/api/locations/search?query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Location search response:', data);
      setSuggestions(Array.isArray(data) ? data : []);
      setIsOpen(Array.isArray(data) && data.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setApiError(`Failed to fetch location suggestions: ${error.message}`);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300); // 300ms delay
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const locationData = {
      name: suggestion.placeName,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      country: suggestion.country,
      city: suggestion.placeName ? suggestion.placeName.split(',')[0] : ''
    };

    setQuery(suggestion.placeName || '');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);

    // Call parent onChange with location data
    if (onChange) {
      onChange(locationData);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear input
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onChange) {
      onChange(null);
    }
    inputRef.current?.focus();
  };

  // Handle focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Update query when value changes externally
  useEffect(() => {
    if (value && value.name && value.name !== query) {
      setQuery(value.name);
    } else if (!value && query) {
      setQuery("");
    }
  }, [value]);

  return (
    <div style={{ marginBottom }} ref={dropdownRef}>
      <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">
        {label}
      </label>

      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            disabled={disabled}
            className={`${inputClasses} pr-12`}
            placeholder={placeholder}
            style={{ padding: inputPadding }}
            autoComplete="off"
          />

          {/* Search/Loading Icon */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {isLoading ? (
              <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-neutrals-4 animate-spin`} />
            ) : (query && showClearButton) ? (
              <button
                onClick={handleClear}
                className="hover:text-neutrals-3 text-neutrals-4 transition-colors"
                type="button"
              >
                <X className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
            ) : (
              <Search className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-neutrals-4`} />
            )}
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.latitude || index}-${suggestion.longitude || index}`}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-neutrals-7 ${index === selectedIndex ? 'bg-neutrals-7' : ''
                  } ${isMobile ? 'text-sm' : 'text-base'} font-medium first:rounded-t-xl last:rounded-b-xl transition-colors flex items-start space-x-3`}
                type="button"
              >
                <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-neutrals-4 mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-neutrals-1 ${isMobile ? 'text-sm' : 'text-base'} font-semibold truncate`}>
                    {suggestion.placeName || 'Unknown Location'}
                  </div>
                  <div className={`text-neutrals-4 ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>
                    {suggestion.placeName}{suggestion.country ? `, ${suggestion.country}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {isOpen && !isLoading && suggestions.length === 0 && query.length >= 2 && (
          <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-50 px-4 py-3">
            <div className="text-center text-neutrals-4">
              <MapPin className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mx-auto mb-2`} />
              <div className={isMobile ? 'text-sm' : 'text-base'}>No locations found</div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-neutrals-5 mt-1`}>
                Try a different search term
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error messages */}
      {(error || apiError) && (
        <div className={`mt-2 text-red-500 ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
          {error || apiError}
        </div>
      )}
    </div>
  );
}