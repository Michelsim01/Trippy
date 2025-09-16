import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import swal from 'sweetalert2';

const ProfileSection = ({ userData: propUserData, onUserDataUpdate }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(!propUserData);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [emailError, setEmailError] = useState('');
    const [areaCodeError, setAreaCodeError] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [stagedImageFile, setStagedImageFile] = useState(null);
    const [stagedImageUrl, setStagedImageUrl] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        areaCode: '',
        phoneNumber: '',
        profilePicture: ''
    });

    const userId = user?.id; 
    
    const parsePhoneNumber = (fullPhoneNumber) => {
        if (!fullPhoneNumber) return { areaCode: '', phoneNumber: '' };

        const parts = fullPhoneNumber.split(' ');
        
        if (parts.length === 2) {
            return {
                areaCode: parts[0],
                phoneNumber: parts[1]
            };
        }
        
        return {
            areaCode: '+65',
            phoneNumber: fullPhoneNumber
        };
    };

    const successfulUpdateNotification = async () => {
        try {
            console.log('Sending notification for userId:', userId);
            const notificationPayload = {
                title: 'Personal Info Updated',
                message: 'Your personal information has been updated successfully.',
                userId: userId,
                type: 'UPDATE_INFO',
            };
            console.log('Notification payload:', notificationPayload);
            
            const response = await fetch(`http://localhost:8080/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationPayload),
            });
            
            console.log('Notification response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Notification error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Notification sent successfully:', data);
        }
        catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const combinePhoneNumber = (areaCode, phoneNumber) => {
        if (!areaCode && !phoneNumber) return '';
        if (!areaCode) return phoneNumber;
        if (!phoneNumber) return areaCode;
        return `${areaCode} ${phoneNumber}`;
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateAreaCode = (areaCode) => {
        const areaCodeRegex = /^\+\d{1,4}$/;
        return areaCodeRegex.test(areaCode);
    };

    const processUserData = (data) => {
        const { areaCode, phoneNumber } = parsePhoneNumber(data.phoneNumber);
        
        const userData = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            areaCode: areaCode,
            phoneNumber: phoneNumber,
            profilePicture: data.profileImageUrl ? 
                (data.profileImageUrl.startsWith('http') ? data.profileImageUrl : `http://localhost:8080${data.profileImageUrl}`) 
                : ''
        };
        setFormData(userData);
        setOriginalData(userData);
        setHasChanges(false);
        setStagedImageFile(null);
        setStagedImageUrl(null);
        setError(null);
        setAreaCodeError('');
    };

    const fetchUserData = async () => {
        if (!userId) {
            setError('User ID not available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await userService.getUserById(userId);
            
            if (response.success) {
                processUserData(response.data);
                setError(null);
            } else {
                setError(response.error || 'Failed to load profile data');
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedFormData = {
            ...formData,
            [name]: value
        };
        setFormData(updatedFormData);
        
        if (name === 'email') {
            if (value && !validateEmail(value)) {
                setEmailError('Please enter a valid email address');
            } else {
                setEmailError('');
            }
        }
        
        if (name === 'areaCode') {
            if (value && !validateAreaCode(value)) {
                setAreaCodeError('Area code must start with + followed by numbers (e.g., +65)');
            } else {
                setAreaCodeError('');
            }
        }
        
        const editableFields = ['firstName', 'lastName', 'email', 'areaCode', 'phoneNumber'];
        const hasChanged = editableFields.some(field => {
            if (field === 'areaCode' || field === 'phoneNumber') {
                const originalCombined = combinePhoneNumber(originalData.areaCode, originalData.phoneNumber);
                const updatedCombined = combinePhoneNumber(updatedFormData.areaCode, updatedFormData.phoneNumber);
                return originalCombined !== updatedCombined;
            }
            return updatedFormData[field] !== originalData[field];
        });
        
        const hasImageChanges = stagedImageFile !== null || stagedImageUrl !== null;
        
        setHasChanges(hasChanged || hasImageChanges);
    };

    const handleProfilePictureChange = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    setError('File size too large. Maximum 5MB allowed.');
                    swal.fire({
                        icon: 'error',
                        title: 'File Too Large',
                        text: 'File size too large. Maximum 5MB allowed.',
                    });
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    setError('Only image files are allowed.');
                    swal.fire({
                        icon: 'error',
                        title: 'Invalid File Type',
                        text: 'Only image files are allowed.',
                    });
                    return;
                }

                setStagedImageFile(file);
                setStagedImageUrl(URL.createObjectURL(file));
                setError(null);
                
                const editableFields = ['firstName', 'lastName', 'email', 'areaCode', 'phoneNumber'];
                const hasFormChanges = editableFields.some(field => {
                    if (field === 'areaCode' || field === 'phoneNumber') {
                        const originalCombined = combinePhoneNumber(originalData.areaCode, originalData.phoneNumber);
                        const currentCombined = combinePhoneNumber(formData.areaCode, formData.phoneNumber);
                        return originalCombined !== currentCombined;
                    }
                    return formData[field] !== originalData[field];
                });
                setHasChanges(hasFormChanges || true); 
            }
        };
        fileInput.click();
    };

    const handleRemoveProfilePicture = () => {
        swal.fire({
            title: 'Remove Profile Picture?',
            text: 'Are you sure you want to remove your profile picture?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!'
        }).then((result) => {
            if (result.isConfirmed) {
                setStagedImageFile(null);
                setStagedImageUrl('');
                
                const editableFields = ['firstName', 'lastName', 'email', 'areaCode', 'phoneNumber'];
                const hasFormChanges = editableFields.some(field => {
                    if (field === 'areaCode' || field === 'phoneNumber') {
                        const originalCombined = combinePhoneNumber(originalData.areaCode, originalData.phoneNumber);
                        const currentCombined = combinePhoneNumber(formData.areaCode, formData.phoneNumber);
                        return originalCombined !== currentCombined;
                    }
                    return formData[field] !== originalData[field];
                });
                setHasChanges(hasFormChanges || true);
            }
        });
    };

    const handleCancelChanges = () => {
        swal.fire({
            title: 'Cancel Changes?',
            text: 'Are you sure you want to cancel all changes? This will reset the form to its original state.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel changes'
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData(originalData);
                setStagedImageFile(null);
                setStagedImageUrl(null);
                setEmailError('');
                setAreaCodeError('');
                setError(null);
                setHasChanges(false);
                swal.fire({
                    icon: 'success',
                    title: 'Changes Cancelled',
                    text: 'All changes have been cancelled.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.firstName) {
            setError('First name is required');
            return;
        }
        if (!formData.lastName) {
            setError('Last name is required');
            return;
        }
        if (!formData.email) {
            setEmailError('Email is required');
            return;
        }
        if (!validateEmail(formData.email)) {
            setEmailError('Please enter a valid email address');
            return;
        }
        if (!formData.areaCode) {
            setAreaCodeError('Area code is required');
            return;
        }
        if (!validateAreaCode(formData.areaCode)) {
            setAreaCodeError('Area code must start with + followed by numbers (e.g., +65)');
            return;
        }
        setSaving(true);
        try {
            let profileImageUrl = formData.profilePicture;
        
            if (stagedImageFile) {
                setUploadingImage(true);
                const imageResponse = await userService.uploadProfilePicture(userId, stagedImageFile);

                if (imageResponse.success) {
                    profileImageUrl = `http://localhost:8080${imageResponse.data.imageUrl}`;
                } else {
                    throw new Error(imageResponse.error || 'Failed to upload profile picture');
                }
                setUploadingImage(false);
            } else if (stagedImageUrl === '') {
                profileImageUrl = '';
            }

            const profileData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: combinePhoneNumber(formData.areaCode, formData.phoneNumber)
            };
            
            // Include profile image URL if it has changed
            if (profileImageUrl !== originalData.profilePicture) {
                profileData.profileImageUrl = profileImageUrl;
            }
            
            const response = await userService.updateUserDetails(userId, profileData);
            
            if (response.success) {
                const updatedData = response.data.user;
                const { areaCode, phoneNumber } = parsePhoneNumber(updatedData.phoneNumber);
                const newFormData = {
                    firstName: updatedData.firstName || '',
                    lastName: updatedData.lastName || '',
                    email: updatedData.email || '',
                    areaCode: areaCode,
                    phoneNumber: phoneNumber,
                    profilePicture: updatedData.profileImageUrl ? 
                        (updatedData.profileImageUrl.startsWith('http') ? updatedData.profileImageUrl : `http://localhost:8080${updatedData.profileImageUrl}`) 
                        : formData.profilePicture
                };
                setFormData(newFormData);
                setOriginalData(newFormData);
                setHasChanges(false);
                setStagedImageFile(null);
                setStagedImageUrl(null);
                
                // Update parent component with new user data
                if (onUserDataUpdate) {
                    onUserDataUpdate(updatedData);
                }
                
                setEmailError('');
                setAreaCodeError('');
                setRefreshing(true);
                await successfulUpdateNotification();
                setError(null);
                
                // Show success message instead of reloading
                swal.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your profile has been updated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                setRefreshing(false);
            } else {
                throw new Error(response.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile. Please try again.');
            swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update profile. Please try again.',
            });
        } finally {
            setSaving(false);
            setUploadingImage(false);
        }
    };

    // Initialize with prop data if available
    useEffect(() => {
        if (propUserData) {
            processUserData(propUserData);
            setLoading(false);
        }
    }, [propUserData]);

    // Fetch data if not provided via props
    useEffect(() => {
        if (!propUserData && userId) {
            fetchUserData();
        }
    }, [userId, propUserData]);

    if (loading) {
        return (
            <div id="profile" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-1"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div id="profile" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={fetchUserData} className="btn btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div id="profile" className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
                <h2 className="text-xl font-semibold text-neutrals-1">Profile Settings</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#FFBC99] rounded-full overflow-hidden">
                        <img
                            src={
                                stagedImageUrl !== null 
                                    ? (stagedImageUrl === '' ? `https://ui-avatars.com/api/?name=${(propUserData || {}).firstName || formData.firstName}+${(propUserData || {}).lastName || formData.lastName}&background=random` : stagedImageUrl)
                                    : (formData.profilePicture || `https://ui-avatars.com/api/?name=${(propUserData || {}).firstName || formData.firstName}+${(propUserData || {}).lastName || formData.lastName}&background=random`)
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-neutrals-1">Profile Photo</h3>
                        <p className="text-sm text-neutrals-4">
                            {stagedImageFile ? 'New image selected' : 
                             stagedImageUrl === '' ? 'Image will be removed' : 
                             'Update your profile picture'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={handleProfilePictureChange}
                            disabled={saving || uploadingImage}
                            className="px-4 py-2 border border-neutrals-6 rounded-lg text-sm font-medium hover:bg-neutrals-7 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploadingImage ? 'Uploading...' : 'Change'}
                        </button>
                        {(formData.profilePicture || stagedImageFile || stagedImageUrl) && (
                            <button 
                                type="button"
                                onClick={handleRemoveProfilePicture}
                                disabled={saving || uploadingImage}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="field-label" htmlFor="firstName">
                            First Name
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            className="input-field white"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="field-label" htmlFor="lastName">
                            Last Name
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            className="input-field white"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="field-label" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className={`input-field white ${emailError ? 'error' : ''}`}
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                    {emailError && <div className="error-message">{emailError}</div>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="field-label" htmlFor="areaCode">
                            Area Code *
                        </label>
                        <input
                            id="areaCode"
                            name="areaCode"
                            type="text"
                            className={`input-field white ${areaCodeError ? 'error' : ''}`}
                            value={formData.areaCode}
                            onChange={handleInputChange}
                            placeholder="e.g., +65"
                            maxLength="5"
                            required
                        />
                        {areaCodeError && <div className="error-message">{areaCodeError}</div>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="field-label" htmlFor="phoneNumber">
                            Phone Number
                        </label>
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            className="input-field white"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    {hasChanges && (
                        <button
                            type="button"
                            onClick={handleCancelChanges}
                            disabled={saving || uploadingImage}
                            className="btn btn-md btn-outline-secondary"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        className={`btn btn-md ${hasChanges && !emailError && !areaCodeError ? 'btn-primary' : 'btn-outline-primary'}`}
                        type="submit"
                        disabled={saving || uploadingImage || refreshing || !hasChanges || emailError || areaCodeError}
                        style={{ position: 'relative' }}
                    >
                        {refreshing ? (
                            <span className="flex items-center justify-center">
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                Refreshing...
                            </span>
                        ) : saving ? (uploadingImage ? 'Uploading Image...' : 'Saving...') : hasChanges ? 'Save Changes' : 'No Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSection;