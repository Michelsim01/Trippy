import { useState, useEffect } from 'react';

const ExperienceGallery = ({
  mediaData,
  displayData,
  isMobile = false
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Build images array from media data (includes cover photo) or fallback to form data
  const images = mediaData && mediaData.length > 0
    ? mediaData.map(media => {
        const url = media.mediaUrl;
        return url.startsWith('/api/')
          ? `http://localhost:8080${url}`
          : url;
      })
    : [
        displayData.coverPhotoUrl,
        ...(displayData.additionalPhotos || [])
      ].filter(Boolean);

  // Fallback images if no form data
  const fallbackImages = [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop'
  ];

  const displayImages = images.length > 0 ? images : fallbackImages;

  const openPhotoModal = (imageIndex) => {
    setSelectedImage(imageIndex);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
  };

  const nextPhoto = () => {
    setSelectedImage((prev) => (prev + 1) % displayImages.length);
  };

  const prevPhoto = () => {
    setSelectedImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // Keyboard support for photo modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showPhotoModal) {
        switch(event.key) {
          case 'Escape':
            closePhotoModal();
            break;
          case 'ArrowLeft':
            prevPhoto();
            break;
          case 'ArrowRight':
            nextPhoto();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPhotoModal]);

  if (isMobile) {
    return (
      <>
        {/* Mobile Images */}
        <div className="mb-6">
          {/* Main Image */}
          <div className="rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: '16/10' }}>
            <img
              src={displayImages[0]}
              alt="Experience image 1"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openPhotoModal(0)}
            />
          </div>

          {/* Additional Images Grid */}
          {displayImages.length > 1 && (
            <div className={`grid gap-2 ${
              displayImages.length === 2 ? 'grid-cols-1' :
              displayImages.length === 3 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {displayImages.slice(1, displayImages.length >= 4 ? 4 : displayImages.length).map((image, index) => (
                <div key={index + 1} className="rounded-lg overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={image}
                    alt={`Experience image ${index + 2}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openPhotoModal(index + 1)}
                  />
                  {index === 2 && displayImages.length > 4 && (
                    <button
                      className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"
                      onClick={() => openPhotoModal(index + 1)}
                    >
                      <span className="text-white text-xs font-bold">+{displayImages.length - 4}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photo Lightbox Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={closePhotoModal}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Previous Button */}
              {displayImages.length > 1 && (
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next Button */}
              {displayImages.length > 1 && (
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Image */}
              <img
                src={displayImages[selectedImage]}
                alt={`Experience image ${selectedImage + 1}`}
                className="max-w-full max-h-full object-contain"
              />

              {/* Image Counter */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                  {selectedImage + 1} of {displayImages.length}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Desktop Image Gallery */}
      <div className="grid gap-4 mb-5 max-w-full" style={{ height: '450px', maxHeight: '450px' }}>
        {displayImages.length === 1 && (
          <div className="rounded-2xl overflow-hidden h-full">
            <img
              src={displayImages[0]}
              alt="Experience image 1"
              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
              onClick={() => openPhotoModal(0)}
            />
          </div>
        )}
        {displayImages.length === 2 && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="rounded-2xl overflow-hidden">
              <img
                src={displayImages[0]}
                alt="Experience image 1"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => openPhotoModal(0)}
              />
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img
                src={displayImages[1]}
                alt="Experience image 2"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => openPhotoModal(1)}
              />
            </div>
          </div>
        )}
        {displayImages.length === 3 && (
          <div className="grid grid-cols-3 gap-4 h-full">
            <div className="rounded-2xl overflow-hidden">
              <img
                src={displayImages[0]}
                alt="Experience image 1"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => openPhotoModal(0)}
              />
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img
                src={displayImages[1]}
                alt="Experience image 2"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => openPhotoModal(1)}
              />
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img
                src={displayImages[2]}
                alt="Experience image 3"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => openPhotoModal(2)}
              />
            </div>
          </div>
        )}
        {displayImages.length >= 4 && (
          <div className="grid grid-cols-4 gap-4 h-full">
            <div className="col-span-1 rounded-2xl overflow-hidden">
              <img
                src={displayImages[0]}
                alt="Experience image 1"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => openPhotoModal(0)}
              />
            </div>
            <div className="col-span-2 rounded-2xl overflow-hidden relative">
              <img
                src={displayImages[1]}
                alt="Experience image 2"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onClick={() => openPhotoModal(1)}
              />
            </div>
            <div className="col-span-1 flex flex-col gap-4">
              <div className="h-[217px] rounded-2xl overflow-hidden">
                <img
                  src={displayImages[2]}
                  alt="Experience image 3"
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => openPhotoModal(2)}
                />
              </div>
              <div className="h-[217px] rounded-2xl overflow-hidden relative">
                <img
                  src={displayImages[3]}
                  alt="Experience image 4"
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => openPhotoModal(3)}
                />
                {displayImages.length > 4 && (
                  <div
                    className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer hover:bg-opacity-70 transition-colors"
                    onClick={() => openPhotoModal(3)}
                  >
                    <span className="text-white text-2xl font-bold">+{displayImages.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Previous Button */}
            {displayImages.length > 1 && (
              <button
                onClick={prevPhoto}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Next Button */}
            {displayImages.length > 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <img
              src={displayImages[selectedImage]}
              alt={`Experience image ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image Counter */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                {selectedImage + 1} of {displayImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ExperienceGallery;