import React, { useState, useRef } from 'react';
import { X, Upload, Image, AlertCircle, CheckCircle, Star } from 'lucide-react';
import StarRating from './StarRating';
import { useReviews } from '../../contexts/ReviewContext';
import { useAuth } from '../../contexts/AuthContext';
import { reviewService } from '../../services/reviewService';

const ReviewForm = ({
  booking,
  experience,
  onSubmit,
  onCancel,
  isModal = false,
  className = ''
}) => {
  const { createReview, loading } = useReviews();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    photos: []
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Photo handling
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const maxPhotos = 5;
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write a review';
    } else if (formData.comment.trim().length < 50) {
      newErrors.comment = 'Review must be at least 50 characters';
    } else if (formData.comment.trim().length > 1000) {
      newErrors.comment = 'Review must be less than 1000 characters';
    }

    if (formData.title && formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Photo handling
  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const newErrors = { ...errors };

    files.forEach(file => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        newErrors.photos = 'Only JPEG, PNG, and WebP images are allowed';
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        newErrors.photos = 'Photos must be less than 5MB each';
        return;
      }

      validFiles.push(file);
    });

    // Check total photo count
    if (previewPhotos.length + validFiles.length > maxPhotos) {
      newErrors.photos = `You can upload a maximum of ${maxPhotos} photos`;
      setErrors(newErrors);
      return;
    }

    // Remove photos error if validation passed
    delete newErrors.photos;
    setErrors(newErrors);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewPhotos(prev => [...prev, {
          file,
          preview: e.target.result,
          isNew: true
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Update form data
    setFormData(prev => {
      const newFormData = {
        ...prev,
        photos: [...prev.photos, ...validFiles]
      };
      console.log('📷 Updated formData.photos:', newFormData.photos);
      return newFormData;
    });

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    const photoToRemove = previewPhotos[index];

    setPreviewPhotos(prev => prev.filter((_, i) => i !== index));

    if (photoToRemove.isNew) {
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      }));
    }

    // Clear photo errors if any photos remain
    if (previewPhotos.length > 1) {
      const newErrors = { ...errors };
      delete newErrors.photos;
      setErrors(newErrors);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const reviewData = {
        bookingId: booking.bookingId,
        reviewerId: user.id,
        rating: formData.rating,
        title: formData.title.trim() || null,
        comment: formData.comment.trim(),
        experienceId: experience.experienceId || experience.id  // For ReviewContext caching
      };

      console.log('🚀 Submitting review data:', reviewData);

      const result = await createReview(reviewData);
      console.log('🚀 Review submission result:', result);
      console.log('🖼️ FormData.photos length:', formData.photos.length);
      console.log('🖼️ FormData.photos:', formData.photos);
      if (result.success) {
        // Handle photo uploads if any new photos
        if (formData.photos.length > 0) {
          console.log('📤 Starting photo upload for', formData.photos.length, 'photos');
          setUploadingPhotos(true);
          try {
            const photoUploadResult = await reviewService.uploadReviewPhotos(result.data.reviewId, formData.photos);
            if (!photoUploadResult.success) {
              console.warn('Photo upload failed:', photoUploadResult.error);
            }
          } catch (photoError) {
            console.error('Error uploading photos:', photoError);
          }
        }

        setSubmitStatus('success');

        // Call success callback with a slight delay to ensure UI updates
        setTimeout(() => {
          if (onSubmit) {
            onSubmit(result.data);
          }
        }, 500);

      } else {
        setSubmitStatus('error');
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitStatus('error');
      setErrors({ submit: 'Failed to submit review. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const getRatingFeedback = (rating) => {
    switch(rating) {
      case 1: return "We're sorry to hear you had a poor experience. Please let us know what went wrong.";
      case 2: return "We appreciate your feedback. How could the experience have been improved?";
      case 3: return "Thanks for your review. What would have made this experience better?";
      case 4: return "Great! What made this experience enjoyable for you?";
      case 5: return "Wonderful! We'd love to hear what made this experience exceptional.";
      default: return "Please share your honest experience to help other travelers.";
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Experience Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex space-x-3">
          <img
            src={experience.coverImageUrl || '/default-experience.jpg'}
            alt={experience.title}
            className="w-16 h-16 rounded-lg object-cover"
            onError={(e) => { e.target.src = '/default-experience.jpg'; }}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{experience.title}</h3>
            <p className="text-sm text-gray-600">{experience.location}</p>
            <p className="text-xs text-gray-500">
              Booking: {booking.confirmationCode}
            </p>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How would you rate this experience? *
        </label>
        <div className="flex items-center space-x-4">
          <StarRating
            rating={formData.rating}
            onRatingChange={(rating) => handleInputChange('rating', rating)}
            interactive={true}
            size="xl"
          />
          {formData.rating > 0 && (
            <span className="text-sm font-medium text-gray-700">
              {formData.rating === 1 && "Poor"}
              {formData.rating === 2 && "Fair"}
              {formData.rating === 3 && "Good"}
              {formData.rating === 4 && "Very Good"}
              {formData.rating === 5 && "Excellent"}
            </span>
          )}
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
        )}
        {formData.rating > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {getRatingFeedback(formData.rating)}
          </p>
        )}
      </div>

      {/* Title (Optional) */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Review title (optional)
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Summarize your experience in a few words"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-1 focus:border-primary-1"
          maxLength={100}
        />
        <div className="flex justify-between mt-1">
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.title.length}/100
          </p>
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your review *
        </label>
        <textarea
          id="comment"
          rows={5}
          value={formData.comment}
          onChange={(e) => handleInputChange('comment', e.target.value)}
          placeholder="Tell other travelers about your experience. What did you enjoy? What tips would you share?"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-1 focus:border-primary-1 resize-none"
          maxLength={1000}
        />
        <div className="flex justify-between mt-1">
          {errors.comment && (
            <p className="text-sm text-red-600">{errors.comment}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.comment.length}/1000 (minimum 50 characters)
          </p>
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Add photos (optional)
        </label>

        {/* Photo Previews */}
        {previewPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {previewPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.preview || photo.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {previewPhotos.length < maxPhotos && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              disabled={uploadingPhotos}
            >
              {uploadingPhotos ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-1 mx-auto mb-1"></div>
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-sm text-gray-600">
                    Add photos ({previewPhotos.length}/{maxPhotos})
                  </span>
                </div>
              )}
            </button>
          </div>
        )}

        {errors.photos && (
          <p className="mt-1 text-sm text-red-600">{errors.photos}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Upload up to {maxPhotos} photos. JPEG, PNG, WebP. Max 5MB each.
        </p>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-sm text-green-700">
              Review submitted successfully! You earned 10 TripPoints!
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || loading || !formData.rating || !formData.comment.trim()}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-1 border border-transparent rounded-md hover:bg-primary-1/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Write a Review
              </h2>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-6 border border-gray-200 ${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Write a Review
        </h2>
        <p className="text-sm text-gray-600">
          Share your experience to help other travelers make informed decisions.
        </p>
      </div>
      {formContent}
    </div>
  );
};

export default ReviewForm;