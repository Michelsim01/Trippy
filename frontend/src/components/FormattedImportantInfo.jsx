import React from 'react';

// Utility function to parse and format important info text
const parseImportantInfo = (text) => {
  if (!text) return [];

  const lines = text.split('\n').filter(line => line.trim());
  const elements = [];

  for (let line of lines) {
    const trimmed = line.trim();

    // Detect numbered lines (1. 2. 3. etc.) - these are bullet points
    if (trimmed.match(/^\d+[\.\)]\s/)) {
      const content = trimmed.replace(/^\d+[\.\)]\s/, '');
      elements.push({ type: 'bullet', content });
    }
    // All other non-empty lines are headers
    else if (trimmed.length > 0) {
      elements.push({ type: 'header', content: trimmed });
    }
  }

  return elements;
};

// Component to render formatted important info
const FormattedImportantInfo = ({ text, isMobile = false }) => {
  const elements = parseImportantInfo(text);

  return (
    <div className="space-y-3">
      {elements.map((element, index) => {
        if (element.type === 'header') {
          return (
            <h3 key={index} className={`font-semibold text-neutrals-1 ${isMobile ? 'text-base' : 'text-lg'}`} style={{ fontFamily: 'Poppins' }}>
              {element.content}
            </h3>
          );
        } else if (element.type === 'bullet') {
          return (
            <div key={index} className={`text-neutrals-3 ${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed flex items-start ml-4`}>
              <span className="text-neutrals-4 mr-2 flex-shrink-0 mt-1">•</span>
              <span>{element.content}</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default FormattedImportantInfo;