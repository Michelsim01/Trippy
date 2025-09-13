import { useState, useEffect } from 'react';
import swal from 'sweetalert2';

const ProfileSection = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [emailError, setEmailError] = useState('');
    const [areaCodeError, setAreaCodeError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        areaCode: '+65',
        phoneNumber: '',
        profilePicture: ''
    });

    const userId = 111; 
    
    const parsePhoneNumber = (fullPhoneNumber) => {
        if (!fullPhoneNumber) return { areaCode: '+65', phoneNumber: '' };
        
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

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/users/${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setUserData(data);
            
            const { areaCode, phoneNumber } = parsePhoneNumber(data.phoneNumber);
            
            const userData = {
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                areaCode: areaCode,
                phoneNumber: phoneNumber,
                profilePicture: data.profileImageUrl || ''
            };
            setFormData(userData);
            setOriginalData(userData);
            setHasChanges(false);
            setError(null);
            setAreaCodeError('');
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
        
        const editableFields = ['email', 'areaCode', 'phoneNumber', 'profilePicture'];
        const hasChanged = editableFields.some(field => {
            if (field === 'areaCode' || field === 'phoneNumber') {
                const originalCombined = combinePhoneNumber(originalData.areaCode, originalData.phoneNumber);
                const updatedCombined = combinePhoneNumber(updatedFormData.areaCode, updatedFormData.phoneNumber);
                return originalCombined !== updatedCombined;
            }
            return updatedFormData[field] !== originalData[field];
        });
        setHasChanges(hasChanged);
    };

    const handleProfilePictureChange = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const previewUrl = URL.createObjectURL(file);
                const updatedFormData = {
                    ...formData,
                    profilePicture: previewUrl
                };
                setFormData(updatedFormData);
                
                const editableFields = ['email', 'areaCode', 'phoneNumber', 'profilePicture'];
                const hasChanged = editableFields.some(field => {
                    if (field === 'areaCode' || field === 'phoneNumber') {
                        const originalCombined = combinePhoneNumber(originalData.areaCode, originalData.phoneNumber);
                        const updatedCombined = combinePhoneNumber(updatedFormData.areaCode, updatedFormData.phoneNumber);
                        return originalCombined !== updatedCombined;
                    }
                    return updatedFormData[field] !== originalData[field];
                });
                setHasChanges(hasChanged);
                
                console.log('Profile picture selected:', file.name);
            }
        };
        fileInput.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
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
            const profileData = {
                email: formData.email,
                phoneNumber: combinePhoneNumber(formData.areaCode, formData.phoneNumber)
            };
            if (formData.profilePicture !== originalData.profilePicture) {
                profileData.profileImageUrl = formData.profilePicture;
            }

            const response = await fetch(`http://localhost:8080/api/users/${userId}/details`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });

            if (response.ok) {
                const result = await response.json();
                const updatedData = result.user;
                setUserData(updatedData);
                
                const { areaCode, phoneNumber } = parsePhoneNumber(updatedData.phoneNumber);
                
                const newFormData = {
                    firstName: updatedData.firstName || '',
                    lastName: updatedData.lastName || '',
                    email: updatedData.email || '',
                    areaCode: areaCode,
                    phoneNumber: phoneNumber,
                    profilePicture: updatedData.profileImageUrl || ''
                };
                setFormData(newFormData);
                setOriginalData(newFormData);
                setHasChanges(false);
                setEmailError('');
                setAreaCodeError('');
                swal.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your profile has been updated successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                });
                await successfulUpdateNotification();
                setError(null);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
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
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

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
                            src={formData.profilePicture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium text-neutrals-1">Profile Photo</h3>
                        <p className="text-sm text-neutrals-4">Update your profile picture</p>
                    </div>
                    <button 
                        type="button"
                        onClick={handleProfilePictureChange}
                        className="px-4 py-2 border border-neutrals-6 rounded-lg text-sm font-medium hover:bg-neutrals-7 transition-colors"
                    >
                        Change
                    </button>
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
                            className="input-field white bg-neutrals-7 cursor-not-allowed"
                            value={formData.firstName}
                            readOnly
                            disabled
                        />
                        <p className="text-xs text-neutrals-4 mt-1">First name cannot be changed</p>
                    </div>
                    <div>
                        <label className="field-label" htmlFor="lastName">
                            Last Name
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            className="input-field white bg-neutrals-7 cursor-not-allowed"
                            value={formData.lastName}
                            readOnly
                            disabled
                        />
                        <p className="text-xs text-neutrals-4 mt-1">Last name cannot be changed</p>
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
                <div className="flex justify-end pt-4">
                    <button
                        className={`btn btn-md ${hasChanges && !emailError && !areaCodeError ? 'btn-primary' : 'btn-outline-primary'}`}
                        type="submit"
                        disabled={saving || !hasChanges || emailError || areaCodeError}
                    >
                        {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSection;