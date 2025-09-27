import { MapPin } from 'lucide-react';

// Helper function to convert category enum to display name
const getCategoryDisplayName = (enumValue) => {
  const categoryDisplayMap = {
    'GUIDED_TOUR': 'Guided Tour',
    'DAYTRIP': 'Day Trip',
    'ADVENTURE': 'Adventure & Sports',
    'WORKSHOP': 'Workshop & Classes',
    'WATER_ACTIVITY': 'Water Activities',
    'OTHERS': 'Others'
  };
  return categoryDisplayMap[enumValue] || enumValue;
};

const ExperienceHeader = ({
  displayData,
  isWishlisted,
  handleWishlistToggle,
  averageRating = 0,
  totalReviews = 0,
  isMobile = false
}) => {
  if (isMobile) {
    return (
      <div className="mb-6">
        {/* Category Badge - Mobile */}
        {displayData.category && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-1 text-white shadow-sm">
              {getCategoryDisplayName(displayData.category)}
            </span>
          </div>
        )}

        <h1 className="text-2xl font-bold text-neutrals-2 leading-tight mb-3 break-words" style={{ fontFamily: 'DM Sans', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          {displayData.title || 'Experience Title'}
        </h1>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-neutrals-2 font-medium text-sm">
              {averageRating > 0 ? Number(averageRating).toFixed(1) : (displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '0.0')}
            </span>
          </div>
          <span className="text-neutrals-4 text-sm">
            ({totalReviews > 0 ? totalReviews : (displayData.totalReviews || 0)} review{(totalReviews > 0 ? totalReviews : (displayData.totalReviews || 0)) !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-neutrals-3 text-sm">
            <MapPin className="w-4 h-4" />
            <span className="break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {displayData.country || 'Country not specified'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 border border-neutrals-6 rounded-full bg-white shadow-sm hover:bg-neutrals-7 transition-colors">
              <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-2 border border-neutrals-6 rounded-full bg-white shadow-sm hover:bg-neutrals-7 transition-colors">
              <svg className="w-5 h-5 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`p-2 border border-neutrals-6 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                isWishlisted ? 'bg-red-50' : 'bg-white hover:bg-neutrals-7'
              }`}
            >
              <svg
                className="w-5 h-5 transition-all duration-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={isWishlisted ? "#FD7FE9" : "#B1B5C3"}
                  className="transition-colors duration-300"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-start mb-10">
      <div className="flex-1 max-w-4xl">
        {/* Category Badge */}
        {displayData.category && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-1 text-white shadow-sm">
              {getCategoryDisplayName(displayData.category)}
            </span>
          </div>
        )}

        <h1 className="text-5xl font-bold text-neutrals-2 leading-tight mb-4 break-words" style={{ fontFamily: 'DM Sans', letterSpacing: '-0.96px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
          {displayData.title || 'Experience Title'}
        </h1>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <svg className="w-5 h-5 text-primary-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-neutrals-2 font-medium text-sm">
                {averageRating > 0 ? Number(averageRating).toFixed(1) : (displayData.averageRating ? Number(displayData.averageRating).toFixed(1) : '0.0')}
              </span>
            </div>
            <span className="text-neutrals-4 text-sm">
              ({totalReviews > 0 ? totalReviews : (displayData.totalReviews || 0)} review{(totalReviews > 0 ? totalReviews : (displayData.totalReviews || 0)) !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-neutrals-4 text-sm">{displayData.country || 'Country not specified'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button className="p-2 border-2 border-neutrals-6 rounded-full hover:bg-neutrals-7 transition-colors">
          <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button className="p-2 border-2 border-neutrals-6 rounded-full hover:bg-neutrals-7 transition-colors">
          <svg className="w-6 h-6 text-neutrals-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>
        <button
          onClick={handleWishlistToggle}
          className={`p-2 border-2 border-neutrals-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isWishlisted ? 'bg-red-50 animate-pulse' : 'bg-neutrals-8 hover:bg-neutrals-7'
          }`}
        >
          <svg
            className="w-6 h-6 transition-all duration-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={isWishlisted ? "#FD7FE9" : "#B1B5C3"}
              className="transition-colors duration-300"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ExperienceHeader;