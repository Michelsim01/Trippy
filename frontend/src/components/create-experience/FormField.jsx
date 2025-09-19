import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  isMobile = false,
  options = null, // For dropdown
  isOpen = false, // For dropdown
  onToggle = null, // For dropdown
  onSelect = null, // For dropdown
  ...props
}) {
  const marginBottom = isMobile ? '10px' : '15px';
  const inputPadding = isMobile ? '4px' : '8px';
  const inputClasses = isMobile
    ? "w-full px-2 py-1 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-sm font-medium text-neutrals-2 transition-colors"
    : "w-full px-2 py-1 border-2 border-neutrals-5 rounded-xl focus:outline-none focus:border-primary-1 text-lg font-medium text-neutrals-2 transition-colors";

  if (type === 'dropdown') {
    return (
      <div style={{marginBottom}}>
        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">{label}</label>
        <div className="relative">
          <button
            style={{padding: inputPadding}}
            onClick={onToggle}
            className={`${inputClasses} flex items-center justify-between text-left transition-colors hover:border-neutrals-4`}
          >
            <span className={value ? "" : "text-neutrals-5"}>{value || placeholder}</span>
            <ChevronDown className={isMobile ? "w-4 h-4 text-neutrals-4" : "w-6 h-6 text-neutrals-4"} />
          </button>
          {isOpen && (
            <div className="absolute top-full mt-2 w-full bg-white border-2 border-neutrals-5 rounded-xl shadow-lg z-10">
              {options?.map(option => (
                <button
                  key={option}
                  onClick={() => onSelect(option)}
                  className={`w-full px-6 py-4 text-left hover:bg-neutrals-7 ${isMobile ? 'text-sm' : 'text-lg'} font-medium first:rounded-t-xl last:rounded-b-xl transition-colors`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div style={{marginBottom}}>
        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3 ">{label}</label>
        <textarea
          style={{paddingTop: '12px', paddingBottom: '6px'}}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClasses} resize-none`}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }

  return (
    <div style={{marginBottom}}>
      <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">{label}</label>
      <input
        style={{padding: '6px'}}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClasses}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}