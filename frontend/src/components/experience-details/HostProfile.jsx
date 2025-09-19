// Helper function to get guide initials
const getGuideInitials = (guide) => {
  if (!guide || !guide.firstName) return 'G';
  const firstName = guide.firstName || '';
  const lastName = guide.lastName || '';
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
};

// Helper function to get guide full name
const getGuideFullName = (guide) => {
  if (!guide) return 'Guide';
  const firstName = guide.firstName || '';
  const lastName = guide.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'Guide';
};

const HostProfile = ({
  displayData,
  onGuideProfileClick,
  isMobile = false
}) => {
  const languages = ['English', 'Mandarin', 'Malay']; // This could be dynamic based on guide data

  return (
    <div className={isMobile ? 'mt-8' : 'max-w-7xl mx-auto px-10 mt-16'}>
      <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-semibold text-neutrals-2 ${isMobile ? 'mb-4' : 'mb-8'}`} style={{ fontFamily: 'Poppins' }}>
        About your host
      </h2>
      <div className={`bg-white border border-neutrals-6 rounded-2xl ${isMobile ? 'p-6' : 'p-8'}`}>
        <div className={`flex items-start ${isMobile ? 'gap-4 mb-6' : 'gap-6'}`}>
          {/* Host Profile Photo */}
          <div
            className="cursor-pointer group"
            onClick={onGuideProfileClick}
            title="View guide profile"
          >
            <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full overflow-hidden bg-neutrals-6 group-hover:opacity-90 group-hover:scale-105 transition-all duration-200 shadow-md group-hover:shadow-lg`}>
              {displayData.guide && displayData.guide.profileImageUrl ? (
                <img
                  src={displayData.guide.profileImageUrl}
                  alt={getGuideFullName(displayData.guide)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-1 to-primary-2 flex items-center justify-center">
                  <span className={`text-white font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                    {getGuideInitials(displayData.guide)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Host Info */}
          <div className="flex-1">
            <div className={`flex items-center ${isMobile ? 'gap-2 mb-2' : 'gap-3 mb-4'}`}>
              <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-neutrals-1`} style={{ fontFamily: 'DM Sans' }}>
                {getGuideFullName(displayData.guide)}
              </h3>
              {/* Verification Badge */}
              <div className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} bg-primary-1 rounded-full flex items-center justify-center`}>
                <svg className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-3 ${isMobile ? 'gap-4 mb-4' : 'gap-8 mb-6'} ${isMobile ? 'text-center' : ''}`}>
          <div>
            <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-neutrals-1`}>
              {displayData.totalReviews || 223}
            </div>
            <div className={`text-neutrals-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>Reviews</div>
          </div>
          <div>
            <div className={`flex items-center ${isMobile ? 'justify-center gap-1' : 'gap-1'}`}>
              <span className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-neutrals-1`}>
                {displayData.averageRating ? Number(displayData.averageRating).toFixed(2) : '4.87'}
              </span>
              <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary-2`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className={`text-neutrals-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>Rating</div>
          </div>
          <div>
            <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-neutrals-1`}>1</div>
            <div className={`text-neutrals-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>Year hosting</div>
          </div>
        </div>

        {/* Languages */}
        <div>
          <div className={`text-neutrals-3 ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>Languages</div>
          <div className="flex flex-wrap gap-2">
            {languages.map((language) => (
              <span
                key={language}
                className={`${isMobile ? 'px-2 py-1' : 'px-3 py-1'} bg-neutrals-7 text-neutrals-2 ${isMobile ? 'text-xs' : 'text-sm'} rounded-full`}
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostProfile;