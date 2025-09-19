import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function ListManager({
  label,
  items = [],
  onItemsChange,
  placeholder = "Add item...",
  isMobile = false
}) {
  const [newItem, setNewItem] = useState("");

  const marginBottom = isMobile ? '10px' : '15px';
  const listPadding = isMobile ? '3px' : '6px';
  const inputPadding = isMobile ? '2px 4px' : '4px 8px';
  const fontSize = isMobile ? 'text-sm' : 'text-lg';
  const bulletSize = isMobile ? 'text-sm' : 'text-lg';
  const iconSize = isMobile ? 'w-3 h-3' : 'w-4 h-4';
  const buttonSize = isMobile ? 'w-6 h-6' : 'w-8 h-8';
  const plusIconSize = isMobile ? 'w-3 h-3' : 'w-4 h-4';

  const addItem = () => {
    if (newItem.trim()) {
      onItemsChange([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div style={{marginBottom}}>
      <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">{label}</label>
      <div className="border-2 border-neutrals-5 rounded-xl p-6 bg-white">
        {items.length > 0 && (
          <ul className={isMobile ? "mb-3" : "mb-4"} style={{padding: listPadding}}>
            {items.map((item, index) => (
              <li key={index} className={`group flex items-start justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
                <div className="flex items-start flex-1 gap-3">
                  <span className={`text-primary-1 font-bold ${bulletSize}`}>•</span>
                  <span className={`${fontSize} font-medium text-neutrals-2`}>{item}</span>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X className={`${iconSize} text-red-500`} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-3 items-center" style={{padding: inputPadding}}>
          <input
            style={{padding: isMobile ? '4px' : '6px'}}
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 px-4 py-3 ${fontSize} font-medium text-neutrals-2 bg-transparent focus:outline-none border-b-2 border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all`}
          />
          <button
            onClick={addItem}
            className={`${buttonSize} rounded-full bg-primary-1 flex items-center justify-center hover:opacity-90 transition-colors`}
          >
            <Plus className={`${plusIconSize} text-white`} />
          </button>
        </div>
      </div>
    </div>
  );
}