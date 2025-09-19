import React from 'react';
import { Camera, Upload, X } from 'lucide-react';

export default function PhotoUpload({
  type = "cover", // "cover" or "additional"
  coverPhoto = "",
  additionalPhotos = [],
  onPhotoChange,
  isMobile = false
}) {
  const handleFileUpload = (event, isMain = true) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result) {
          onPhotoChange(result, isMain);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAdditionalPhoto = (index) => {
    const updatedPhotos = additionalPhotos.filter((_, i) => i !== index);
    onPhotoChange(updatedPhotos, false, true); // Third param indicates bulk update
  };

  if (type === "cover") {
    const height = isMobile ? "h-64" : "h-[500px]";
    const iconSize = isMobile ? "w-16 h-16" : "w-24 h-24";
    const titleSize = isMobile ? "text-sm" : "text-xl";
    const descSize = isMobile ? "text-xs" : "text-lg";
    const padding = isMobile ? "p-6" : "p-12";

    return (
      <div>
        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Cover Photo</label>
        <div className="relative" style={{marginBottom: isMobile ? '15px' : '30px'}}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, true)}
            className="hidden"
            id={`cover-photo-${isMobile ? 'mobile' : 'desktop'}`}
          />
          <label
            htmlFor={`cover-photo-${isMobile ? 'mobile' : 'desktop'}`}
            className={`block w-full ${height} border-2 border-dashed border-neutrals-4 rounded-2xl cursor-pointer hover:border-primary-1 transition-all duration-300 hover:shadow-lg`}
          >
            {coverPhoto ? (
              <img src={coverPhoto} alt="Cover" className={`w-full h-full object-cover rounded-2xl`} />
            ) : (
              <div className={`flex flex-col items-center justify-center h-full text-center ${padding}`}>
                <Camera className={`${iconSize} text-neutrals-4 mb-8`} />
                <p className={`${titleSize} font-semibold mb-4`}>
                  {isMobile ? "Click to upload your main" : "Click to upload your main experience photo"}
                </p>
                {isMobile && (
                  <p className={`${titleSize} font-semibold mb-2`}>experience photo</p>
                )}
                <p className={`${descSize} text-neutrals-4 mb-2`}>JPG, PNG up to 5MB</p>
                {!isMobile && (
                  <p className="text-base text-neutrals-5">Recommended: 1200x800px</p>
                )}
              </div>
            )}
          </label>
        </div>
      </div>
    );
  }

  if (type === "additional") {
    const height = isMobile ? "h-64" : "h-80";
    const gridCols = isMobile ? "grid-cols-2" : "grid-cols-2";
    const imageHeight = isMobile ? "h-24" : "h-32";
    const iconSize = isMobile ? "w-16 h-16" : "w-20 h-20";
    const titleSize = isMobile ? "text-sm" : "text-xl";
    const descSize = isMobile ? "text-xs" : "text-lg";
    const padding = isMobile ? "p-6" : "p-10";
    const buttonSize = isMobile ? "w-5 h-5" : "w-6 h-6";
    const xIconSize = isMobile ? "w-3 h-3" : "w-4 h-4";

    return (
      <div style={{marginBottom: isMobile ? '20px' : '30px'}}>
        <label className="block text-xs font-bold uppercase text-neutrals-5 mb-3">Additional Photos (Optional)</label>

        {/* Display uploaded photos */}
        {additionalPhotos.length > 0 && (
          <div className={`grid ${gridCols} gap-4 mb-6`}>
            {additionalPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo}
                  alt={`Additional photo ${index + 1}`}
                  className={`w-full ${imageHeight} object-cover rounded-xl`}
                />
                <button
                  onClick={() => removeAdditionalPhoto(index)}
                  className={`absolute top-2 right-2 ${buttonSize} bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors`}
                >
                  <X className={xIconSize} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, false)}
            className="hidden"
            id={`additional-photos-${isMobile ? 'mobile' : 'desktop'}`}
            multiple
          />
          <label
            htmlFor={`additional-photos-${isMobile ? 'mobile' : 'desktop'}`}
            className={`block w-full ${height} border-2 border-dashed border-neutrals-4 rounded-2xl cursor-pointer hover:border-primary-1 transition-all duration-300 hover:shadow-lg`}
          >
            <div className={`flex flex-col items-center justify-center h-full text-center ${padding}`}>
              <Upload className={`${iconSize} text-neutrals-4 mb-6`} />
              <p className={`${titleSize} font-semibold mb-4`}>
                {isMobile ? "Upload additional photos (up to 8)" : "Upload additional photos (up to 8)"}
              </p>
              <p className={`${descSize} text-neutrals-4`}>
                {isMobile ? "Show different aspects of your experience" : "Show different aspects of your experience"}
              </p>
              {additionalPhotos.length > 0 && (
                <p className={`text-sm text-primary-1 mt-2`}>
                  {additionalPhotos.length} photo(s) uploaded
                </p>
              )}
            </div>
          </label>
        </div>
      </div>
    );
  }

  return null;
}