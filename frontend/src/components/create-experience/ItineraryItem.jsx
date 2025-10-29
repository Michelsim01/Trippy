import React, { useState } from 'react';
import { MapPin, Clock, X, Flag, Navigation } from 'lucide-react';

export default function ItineraryItem({
  item,
  index,
  isLast,
  onUpdate,
  onRemove,
  isMobile = false
}) {
  const getTypeIcon = (type) => {
    if (type === 'start') return <Flag className={isMobile ? "w-4 h-4" : "w-6 h-6"} />;
    if (type === 'end') return <Navigation className={isMobile ? "w-4 h-4" : "w-6 h-6"} />;
    return <span>{index + 1}</span>;
  };

  const getTypeColor = (type) => {
    if (type === 'start') return 'bg-green-500';
    if (type === 'end') return 'bg-red-500';
    return 'bg-blue-500';
  };

  const circleSize = isMobile ? "w-8 h-8" : "w-12 h-12";
  const textSize = isMobile ? "text-xs" : "text-lg";
  const fontWeight = isMobile ? "font-bold" : "font-bold";
  const gapSize = isMobile ? "gap-3" : "gap-5";
  const inputTextSize = isMobile ? "text-lg" : "text-lg";
  const iconSize = isMobile ? "w-4 h-4" : "w-5 h-5";
  const timeIconSize = isMobile ? "w-4 h-4" : "w-4 h-4";
  const removeIconSize = isMobile ? "w-4 h-4" : "w-5 h-5";
  const connectorWidth = isMobile ? "w-0.5" : "w-1";
  const connectorHeight = isMobile ? "h-12" : "h-20";
  const marginLeft = isMobile ? "ml-6" : "ml-8";
  const paddingTop = isMobile ? "pt-1" : "pt-2";

  const isStartPoint = item.type === 'start';

  return (
    <div className="relative">
      <div className={`flex items-start ${gapSize}`}>
        <div className="flex flex-col items-center">
          <div className={`${circleSize} rounded-full flex items-center justify-center text-white ${textSize} ${fontWeight} ${getTypeColor(item.type)}`}>
            {getTypeIcon(item.type)}
          </div>
          {!isLast && (
            <div className={`${connectorWidth} ${connectorHeight} bg-neutrals-5 mt-3 rounded-full`}></div>
          )}
        </div>

        <div className={`flex-1 ${paddingTop}`}>
          <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'} mb-2`}>
            <MapPin className={`${iconSize} text-neutrals-4 ${isMobile ? 'mt-3' : 'mt-4'}`} />
            <div className="flex-1">
              {/* All stops: read-only display (must delete to change) */}
              <input
                type="text"
                value={item.location}
                readOnly
                className={`w-full ${inputTextSize} font-semibold text-neutrals-1 bg-neutrals-7 cursor-not-allowed border-2 border-neutrals-5 rounded-lg px-3 py-2`}
                placeholder={isStartPoint ? "Meeting Point" : "Location"}
                title="To change location, delete this stop and add a new one"
              />
            </div>
            <button
              onClick={onRemove}
              disabled={isStartPoint}
              className={`transition-colors p-1 ${isMobile ? 'mt-2' : 'mt-3'} ${
                isStartPoint 
                  ? 'text-neutrals-5 cursor-not-allowed' 
                  : 'text-red-500 hover:text-red-700'
              }`}
              style={isMobile ? {marginRight: '8px'} : {}}
              title={isStartPoint ? 'Start point cannot be removed' : 'Remove item'}
            >
              <X className={removeIconSize} />
            </button>
          </div>
          {item.type === 'stop' && (
            <div className={`flex items-center gap-2 text-neutrals-4 ${marginLeft}`}>
              <Clock className={timeIconSize} />
              <input
                type="text"
                value={item.time}
                readOnly
                className="text-sm text-neutrals-3 bg-transparent cursor-not-allowed py-1"
                title="To change duration, delete this stop and add a new one"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}