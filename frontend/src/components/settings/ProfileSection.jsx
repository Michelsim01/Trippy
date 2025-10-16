import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { notificationService } from '../../services/notificationService';
import swal from 'sweetalert2';

const ProfileSection = ({ userData: propUserData, onUserDataUpdate }) => {
    const { user, logout } = useAuth();
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
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);
    const [newEmailVerified, setNewEmailVerified] = useState(true); // Start as true since original email is verified
    const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
    const [sendingVerification, setSendingVerification] = useState(false);
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
            const notificationData = {
                title: 'Personal Info Updated',
                message: 'Your personal information has been updated successfully.',
                userId: userId,
                type: 'UPDATE_INFO',
            };

            const result = await notificationService.createNotification(notificationData);
            
            if (result.success) {
                console.log('Notification sent successfully:', result.data);
            } else {
                console.error('Error sending notification:', result.error);
            }
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
        setNewEmailVerified(true); // Reset to verified since we're loading original data
        setEmailVerificationSent(false);
        setPendingVerificationEmail('');
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

            // Check if email has changed from original to determine verification status
            if (value !== originalData.email) {
                setNewEmailVerified(false);
                setEmailVerificationSent(false);
                setPendingVerificationEmail(value);
            } else {
                setNewEmailVerified(true);
                setEmailVerificationSent(false);
                setPendingVerificationEmail('');
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
                        confirmButtonColor: '#4AC63F'
                    });
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    setError('Only image files are allowed.');
                    swal.fire({
                        icon: 'error',
                        title: 'Invalid File Type',
                        text: 'Only image files are allowed.',
                        confirmButtonColor: '#4AC63F'
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
            confirmButtonColor: '#FD7FE9',
            cancelButtonColor: '#777E90',
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
            confirmButtonColor: '#FD7FE9',
            cancelButtonColor: '#777E90',
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
                setNewEmailVerified(true);
                setEmailVerificationSent(false);
                setPendingVerificationEmail('');
                swal.fire({
                    icon: 'success',
                    title: 'Changes Cancelled',
                    text: 'All changes have been cancelled.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };

    const handleVerifyEmail = async () => {
        if (!formData.email || !validateEmail(formData.email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        if (formData.email === originalData.email) {
            setNewEmailVerified(true);
            setEmailVerificationSent(false);
            return;
        }

        setSendingVerification(true);
        try {
            const result = await authService.sendVerificationEmail(formData.email);

            if (result.success) {
                setEmailVerificationSent(true);
                setPendingVerificationEmail(formData.email);
                swal.fire({
                    icon: 'success',
                    title: 'Verification Email Sent',
                    html: `
                        <p>A verification email has been sent to <strong>${formData.email}</strong>.</p>
                        <p style="margin-top: 12px;">Please:</p>
                        <ol style="text-align: left; margin: 12px 0; padding-left: 20px;">
                            <li>Check your inbox for the verification email</li>
                            <li>Click the verification link in the email</li>
                            <li>Return here and click the <strong>"Check Status"</strong> button</li>
                        </ol>
                    `,
                    confirmButtonText: 'Got it!',
                    confirmButtonColor: '#4AC63F'
                });
            } else {
                setEmailError(result.error || 'Failed to send verification email');
                swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: result.error || 'Failed to send verification email. Please try again.',
                    confirmButtonColor: '#4AC63F'
                });
            }
        } catch (error) {
            console.error('Error sending verification email:', error);
            setEmailError('Network error. Please try again.');
            swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Network error. Please try again.',
                confirmButtonColor: '#4AC63F'
            });
        } finally {
            setSendingVerification(false);
        }
    };

    const handleCheckEmailVerification = async () => {
        if (!pendingVerificationEmail) return;

        try {
            const result = await authService.checkEmailVerification(pendingVerificationEmail);

            if (result.success && result.data.emailVerified) {
                setNewEmailVerified(true);
                setEmailVerificationSent(false);
                swal.fire({
                    icon: 'success',
                    title: 'Email Verified!',
                    text: 'Your new email address has been verified. You can now save your changes.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                swal.fire({
                    icon: 'info',
                    title: 'Not Yet Verified',
                    text: 'Your email is not yet verified. Please check your inbox for the verification email and click the verification link.',
                    confirmButtonColor: '#4AC63F'
                });
            }
        } catch (error) {
            console.error('Error checking email verification:', error);
            swal.fire({
                icon: 'error',
                title: 'Check Failed',
                text: 'Failed to check verification status. Please try again.',
                confirmButtonColor: '#4AC63F'
            });
        }
    }; 

    const handleSubmit = async (e) => {
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
        const emailChanged = formData.email !== originalData.email;

        if (hasChanges) {
            await successfulUpdateNotification();
        }

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
            setNewEmailVerified(true); // Reset email verification state
            setEmailVerificationSent(false);
            setPendingVerificationEmail('');

            // Update parent component with new user data
            if (onUserDataUpdate && !emailChanged) {
                onUserDataUpdate(updatedData);
            }

            setEmailError('');
            setAreaCodeError('');
            setRefreshing(true);
            setError(null);

            if (emailChanged) {
                // Email was changed - log out user for security
                await swal.fire({
                    icon: 'success',
                    title: 'Email Updated Successfully',
                    text: 'Your email has been updated. For security purposes, you will be logged out and need to sign in again with your new email address.',
                    showConfirmButton: true,
                    confirmButtonText: 'Understand',
                    confirmButtonColor: '#4AC63F',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

                logout();
            } else {
                // Show success message for non-email changes
                swal.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your profile has been updated successfully!',
                    timer: 2000,
                    showConfirmButton: false
                });
            }

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
            confirmButtonColor: '#4AC63F'
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
                            className="btn btn-sm btn-outline-primary"
                        >
                            {uploadingImage ? 'Uploading...' : 'Change'}
                        </button>
                        {(formData.profilePicture || stagedImageFile || stagedImageUrl) && (
                            <button
                                type="button"
                                onClick={handleRemoveProfilePicture}
                                disabled={saving || uploadingImage}
                                className="btn btn-sm btn-outline-accent"
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
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className={`input-field white flex-1 ${emailError ? 'error' : ''}`}
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                            {formData.email !== originalData.email && formData.email && validateEmail(formData.email) && (
                                <div className="flex gap-2">
                                    {!newEmailVerified && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyEmail}
                                            disabled={sendingVerification}
                                            className="btn btn-sm btn-primary whitespace-nowrap"
                                        >
                                            {sendingVerification ? 'Sending...' : (emailVerificationSent ? 'Resend Verification' : 'Verify Email')}
                                        </button>
                                    )}
                                    {emailVerificationSent && !newEmailVerified && (
                                        <button
                                            type="button"
                                            onClick={handleCheckEmailVerification}
                                            className="btn btn-sm btn-info whitespace-nowrap"
                                        >
                                            Check Status
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Email verification status messages */}
                        {formData.email !== originalData.email && formData.email && validateEmail(formData.email) && (
                            <div className="space-y-2">
                                {!emailVerificationSent && !newEmailVerified && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-5 h-5 text-yellow-600 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-yellow-800 text-sm font-medium">Email verification required</p>
                                                <p className="text-yellow-700 text-sm">Please verify your new email address before saving changes.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {emailVerificationSent && !newEmailVerified && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-5 h-5 text-blue-600 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                                                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-blue-800 text-sm font-medium">Verification email sent</p>
                                                <p className="text-blue-700 text-sm">
                                                    Verification email sent to <span className="font-medium">{pendingVerificationEmail}</span>. 
                                                    Please check your inbox and click the verification link, then click "Check Status" to continue.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {newEmailVerified && formData.email !== originalData.email && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-5 h-5 text-green-600 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.53 10.53a.75.75 0 00-1.06 1.061l2.03 2.03a.75.75 0 001.137-.089l3.857-5.401z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-green-800 text-sm font-medium">Email verified successfully!</p>
                                                <p className="text-green-700 text-sm">Your new email address has been verified. You can now save your changes.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                        className={`btn btn-md ${hasChanges && !emailError && !areaCodeError && newEmailVerified ? 'btn-primary' : 'btn-outline-primary'}`}
                        type="submit"
                        disabled={saving || uploadingImage || refreshing || !hasChanges || emailError || areaCodeError || !newEmailVerified}
                        style={{ position: 'relative' }}
                        title={!newEmailVerified && formData.email !== originalData.email ? 'Please verify your new email address before saving' : ''}
                    >
                        {refreshing ? (
                            <span className="flex items-center justify-center">
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                                Refreshing...
                            </span>
                        ) : saving ? (uploadingImage ? 'Uploading Image...' : 'Saving...') : hasChanges ? (
                            !newEmailVerified && formData.email !== originalData.email ? 'Verify Email First' : 'Save Changes'
                        ) : 'No Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSection;