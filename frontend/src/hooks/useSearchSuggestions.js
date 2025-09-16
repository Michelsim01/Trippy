import { useState, useEffect, useRef } from 'react';

const useSearchSuggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debounceRef = useRef(null);

    const fetchSuggestions = async (query) => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setIsOpen(true); // Show dropdown immediately when we start loading
        
        try {
            const response = await fetch(`http://localhost:8080/api/experiences/search/suggestions?q=${encodeURIComponent(query.trim())}`);
            
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data);
                setIsOpen(true); // Keep open regardless of results count
            } else {
                setSuggestions([]);
                setIsOpen(true); // Keep open to show "no suggestions" message
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
            setIsOpen(true); // Keep open to show error state
        } finally {
            setLoading(false);
        }
    };

    const searchWithDebounce = (query) => {
        // Clear previous timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new timeout
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(query);
        }, 150); // 150ms debounce delay for faster response
    };

    const clearSuggestions = () => {
        setSuggestions([]);
        setIsOpen(false);
        setLoading(false);
        
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        suggestions,
        loading,
        isOpen,
        searchWithDebounce,
        clearSuggestions,
        setIsOpen
    };
};

export default useSearchSuggestions;