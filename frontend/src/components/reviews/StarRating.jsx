import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({
  rating = 0,
  onRatingChange = null,
  size = 'md',
  interactive = false,
  showValue = false,
  className = '',
  disabled = false
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const handleMouseEnter = (starRating) => {
    if (interactive && !disabled) {
      setHoveredRating(starRating);
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (interactive && !disabled) {
      setHoveredRating(0);
      setIsHovering(false);
    }
  };

  const handleClick = (starRating) => {
    if (interactive && !disabled && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const getStarState = (starIndex) => {
    const currentRating = isHovering ? hoveredRating : rating;
    return starIndex <= currentRating;
  };

  const getStarClasses = (starIndex, isFilled) => {
    let classes = `${sizes[size]} transition-all duration-200 `;

    if (interactive && !disabled) {
      classes += 'cursor-pointer ';
    }

    if (disabled) {
      classes += 'opacity-50 cursor-not-allowed ';
    }

    if (isFilled) {
      classes += 'text-yellow-400 fill-current ';
      if (interactive && !disabled) {
        classes += 'hover:text-yellow-500 ';
      }
    } else {
      classes += 'text-gray-300 ';
      if (interactive && !disabled) {
        classes += 'hover:text-gray-400 ';
      }
    }

    return classes;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = getStarState(starIndex);
          return (
            <Star
              key={starIndex}
              className={getStarClasses(starIndex, isFilled)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(starIndex)}
              data-testid={`star-${starIndex}`}
            />
          );
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}

      {interactive && isHovering && (
        <span className="ml-2 text-sm text-gray-500">
          {hoveredRating === 1 && "Poor"}
          {hoveredRating === 2 && "Fair"}
          {hoveredRating === 3 && "Good"}
          {hoveredRating === 4 && "Very Good"}
          {hoveredRating === 5 && "Excellent"}
        </span>
      )}
    </div>
  );
};

export default StarRating;