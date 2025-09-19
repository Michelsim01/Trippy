import React from 'react';
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
          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} mb-2`}>
            <MapPin className={`${iconSize} text-neutrals-4`} />
            <input
              type="text"
              value={item.location}
              onChange={(e) => onUpdate('location', e.target.value)}
              className={`flex-1 ${inputTextSize} font-semibold text-neutrals-1 bg-transparent focus:outline-none border-b-2 border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all py-1`}
              placeholder="Enter location name"
            />
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 transition-colors p-1"
              style={isMobile ? {marginRight: '8px'} : {}}
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
                onChange={(e) => onUpdate('time', e.target.value)}
                className="text-sm text-neutrals-3 bg-transparent focus:outline-none border-b border-transparent hover:border-neutrals-5 focus:border-primary-1 transition-all py-1"
                placeholder="Duration (e.g., 1 hour)"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}