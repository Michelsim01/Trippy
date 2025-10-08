import React, { useState, useEffect } from 'react';
import Button from './Button';
import swal from 'sweetalert2';

const ExperienceEarningsModal = ({
    isOpen,
    onClose,
    experienceTitle,
    experienceId,
    userId
}) => {
    const [earningsData, setEarningsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [completingSchedule, setCompletingSchedule] = useState(null);

    // Fetch earnings data when modal opens
    useEffect(() => {
        const fetchEarningsData = async () => {
            if (!isOpen || !experienceId || !userId) return;

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`http://localhost:8080/api/earnings/experience/${experienceId}/guide/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setEarningsData(data);
            } catch (error) {
                console.error('Error fetching experience earnings:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEarningsData();
    }, [isOpen, experienceId, userId]);

    if (!isOpen) return null;

    const formatDate = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const isTourCompleted = (endDateTime) => {
        const now = new Date();
        const tourEndTime = new Date(endDateTime);
        return now > tourEndTime;
    };

    const handleCompleteTimeslot = (scheduleId) => {
        setSelectedScheduleId(scheduleId);
        setShowConfirmDialog(true);
    };

    const handleConfirmComplete = async () => {
        if (!selectedScheduleId) return;

        // Find the selected schedule to validate end time
        const selectedSchedule = schedules.find(schedule => schedule.scheduleId === selectedScheduleId);
        if (selectedSchedule && !isTourCompleted(selectedSchedule.endDateTime)) {
            swal.fire({
                icon: 'error',
                title: 'Tour Still in Progress',
                text: 'This tour has not ended yet. You can only complete a tour after its scheduled end time.',
                confirmButtonText: 'OK'
            });
            setShowConfirmDialog(false);
            setSelectedScheduleId(null);
            return;
        }

        try {
            setCompletingSchedule(selectedScheduleId);
            setShowConfirmDialog(false);

            const response = await fetch(`http://localhost:8080/api/bookings/complete-timeslot/${selectedScheduleId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json();

            // Refresh earnings data to show updated amounts
            if (isOpen && experienceId && userId) {
                const earningsResponse = await fetch(`http://localhost:8080/api/earnings/experience/${experienceId}/guide/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (earningsResponse.ok) {
                    const updatedData = await earningsResponse.json();
                    setEarningsData(updatedData);
                }
            }

            swal.fire({
                icon: 'success',
                title: 'Timeslot Completed',
                text: `Review request notifications sent to participants.`,
            });

        } catch (error) {
            console.error('Error completing timeslot:', error);
            alert('Failed to complete timeslot. Please try again.');
        } finally {
            setCompletingSchedule(null);
            setSelectedScheduleId(null);
        }
    };

    const handleCancelComplete = () => {
        setShowConfirmDialog(false);
        setSelectedScheduleId(null);
    };

    // Get earnings totals from API data or default values
    const earningsTotals = earningsData ? {
        total: parseFloat(earningsData.totalEarnings || 0),
        pending: parseFloat(earningsData.pendingEarnings || 0),
        paidOut: parseFloat(earningsData.paidOutEarnings || 0)
    } : { total: 0, pending: 0, paidOut: 0 };

    const schedules = earningsData?.schedules || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                    <div>
                        <h2 className="text-xl font-semibold text-neutrals-1">
                            {earningsData?.experienceTitle || experienceTitle} - Earnings
                        </h2>
                        <p className="text-sm text-neutrals-4 mt-1">
                            Manage your scheduled tours and earnings
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutrals-7 transition-colors"
                    >
                        <svg className="w-5 h-5 text-neutrals-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Experience Earnings Summary */}
                <div className="p-6 border-b border-neutrals-6">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Total Earnings */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    ${earningsTotals.total.toFixed(2)}
                                </div>
                                <div className="text-xs text-blue-700 font-medium">Total</div>
                            </div>
                        </div>

                        {/* Pending Earnings */}
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">
                                    ${earningsTotals.pending.toFixed(2)}
                                </div>
                                <div className="text-xs text-yellow-700 font-medium">Pending</div>
                            </div>
                        </div>

                        {/* Paid Out Earnings */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    ${earningsTotals.paidOut.toFixed(2)}
                                </div>
                                <div className="text-xs text-green-700 font-medium">Paid Out</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-240px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-1"></div>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">Loading earnings data...</h3>
                            <p className="text-neutrals-4">Please wait while we fetch your earnings information.</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">Error loading earnings</h3>
                            <p className="text-neutrals-4">{error}</p>
                        </div>
                    ) : schedules.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 text-neutrals-5">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-neutrals-2 mb-2">No scheduled tours</h3>
                            <p className="text-neutrals-4">No upcoming or completed tours for this experience.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {schedules.map((schedule) => (
                                <div key={schedule.scheduleId} className="bg-neutrals-8 rounded-lg p-4 border border-neutrals-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {/* Date Icon */}
                                            <div className="w-12 h-12 bg-primary-1 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>

                                            {/* Schedule Info */}
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-lg font-medium text-neutrals-1">
                                                        {formatDate(schedule.startDateTime)}, {formatTime(schedule.startDateTime)}
                                                    </h3>
                                                    {schedule.status === "COMPLETED" ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            COMPLETED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            CONFIRMED
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 mt-1 text-sm text-neutrals-4">
                                                    <span>{schedule.bookingCount} bookings</span>
                                                    <span>•</span>
                                                    <span>{schedule.totalGuests} guests</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-primary-1">${parseFloat(schedule.potentialEarnings || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div>
                                            {schedule.status === "CONFIRMED" ? (
                                                (() => {
                                                    const tourCompleted = isTourCompleted(schedule.endDateTime);
                                                    const isDisabled = completingSchedule === schedule.scheduleId || !tourCompleted;

                                                    return (
                                                        <Button
                                                            variant={tourCompleted ? "primary" : "secondary"}
                                                            size="sm"
                                                            onClick={() => handleCompleteTimeslot(schedule.scheduleId)}
                                                            disabled={isDisabled}
                                                            className={!tourCompleted ? "opacity-50 cursor-not-allowed" : ""}
                                                            title={!tourCompleted ? "Tour must end before it can be marked as completed" : "Mark this tour as completed"}
                                                        >
                                                            {completingSchedule === schedule.scheduleId
                                                                ? 'Completing...'
                                                                : tourCompleted
                                                                    ? 'Mark As Completed'
                                                                    : 'Tour Not Completed'
                                                            }
                                                        </Button>
                                                    );
                                                })()
                                            ) : (
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        {/* Dialog Header */}
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutrals-1">Complete Timeslot Confirmation</h3>
                        </div>

                        {/* Dialog Content */}
                        <div className="mb-6">
                            <p className="text-sm text-neutrals-2 mb-4">
                                You are about to mark this timeslot as <strong>COMPLETED</strong>. This will:
                            </p>
                            <ul className="list-disc list-inside text-sm text-neutrals-2 mb-4 space-y-1">
                                <li>Move all confirmed bookings to "Paid Out" status</li>
                                <li>Release earnings for payout processing</li>
                                <li>Send review request notifications to all participants</li>
                                <li>Cannot be undone</li>
                            </ul>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-red-800 mb-1">IMPORTANT BUYER PROTECTION WARNING</p>
                                        <p className="text-xs text-red-700 mb-2">
                                            Completing a timeslot before the tour has actually ended may result in:
                                        </p>
                                        <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                                            <li>Account suspension or permanent ban</li>
                                            <li>Police report for fraudulent activity</li>
                                            <li>Legal action for breach of platform terms</li>
                                        </ul>
                                        <p className="text-xs text-red-700 mt-2 font-medium">
                                            Only complete this timeslot if the tour has genuinely ended and all participants have been served.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dialog Actions */}
                        <div className="flex space-x-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleCancelComplete}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleConfirmComplete}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                I Understand - Complete Timeslot
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExperienceEarningsModal;