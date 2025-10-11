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

    // Cancellation state
    const [showCancellationDialog, setShowCancellationDialog] = useState(false);
    const [selectedCancellationSchedule, setSelectedCancellationSchedule] = useState(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [cancellingSchedule, setCancellingSchedule] = useState(null);

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

    // Calculate cancellation fee based on timing policy
    const calculateCancellationFee = (schedule) => {
        const now = new Date();
        const experienceStart = new Date(schedule.startDateTime);
        const hoursUntilStart = (experienceStart - now) / (1000 * 60 * 60);

        const totalRevenue = parseFloat(schedule.potentialEarnings || 0);

        if (hoursUntilStart <= 48) {
            return {
                amount: totalRevenue * 0.50,
                percentage: 50,
                policy: '≤48 hours before'
            };
        } else if (hoursUntilStart <= (30 * 24)) { // 30 days in hours
            return {
                amount: totalRevenue * 0.25,
                percentage: 25,
                policy: '2-30 days before'
            };
        } else {
            return {
                amount: totalRevenue * 0.10,
                percentage: 10,
                policy: '>30 days before'
            };
        }
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

    // Cancellation handlers
    const handleCancelTimeslot = (schedule) => {
        setSelectedCancellationSchedule(schedule);
        setCancellationReason('');
        setShowCancellationDialog(true);
    };

    const handleConfirmCancellation = async () => {
        if (!selectedCancellationSchedule || !cancellationReason) return;

        try {
            setCancellingSchedule(selectedCancellationSchedule.scheduleId);
            setShowCancellationDialog(false);

            const response = await fetch(`http://localhost:8080/api/bookings/experiences/schedules/${selectedCancellationSchedule.scheduleId}/cancel?reason=${encodeURIComponent(cancellationReason)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Refresh earnings data
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
                title: 'Timeslot Cancelled',
                text: `Tour cancelled successfully. ${result.affectedBookings || 0} customers will receive full refunds. Cancellation fee: $${result.totalFee?.toFixed(2) || '0.00'}`,
            });

        } catch (error) {
            console.error('Error cancelling timeslot:', error);
            alert('Failed to cancel timeslot. Please try again.');
        } finally {
            setCancellingSchedule(null);
            setSelectedCancellationSchedule(null);
            setCancellationReason('');
        }
    };

    const handleCancelCancellation = () => {
        setShowCancellationDialog(false);
        setSelectedCancellationSchedule(null);
        setCancellationReason('');
    };

    // Get earnings totals from API data or default values
    const earningsTotals = earningsData ? {
        total: parseFloat(earningsData.totalEarnings || 0),
        pending: parseFloat(earningsData.pendingEarnings || 0),
        paidOut: parseFloat(earningsData.paidOutEarnings || 0),
        pendingDeductions: parseFloat(earningsData.pendingDeductions || 0)
    } : { total: 0, pending: 0, paidOut: 0, pendingDeductions: 0 };

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
                    <div className="grid grid-cols-4 gap-3">
                        {/* Total Earnings */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-center">
                                <div className="text-xl font-bold text-blue-600 mb-1">
                                    ${earningsTotals.total.toFixed(2)}
                                </div>
                                <div className="text-xs text-blue-700 font-medium">Total</div>
                            </div>
                        </div>

                        {/* Pending Earnings */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="text-center">
                                <div className="text-xl font-bold text-yellow-600 mb-1">
                                    ${earningsTotals.pending.toFixed(2)}
                                </div>
                                <div className="text-xs text-yellow-700 font-medium">Pending</div>
                            </div>
                        </div>

                        {/* Pending Deductions */}
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <div className="text-center">
                                <div className="text-xl font-bold text-red-600 mb-1">
                                    -${earningsTotals.pendingDeductions.toFixed(2)}
                                </div>
                                <div className="text-xs text-red-700 font-medium">Deductions</div>
                            </div>
                        </div>

                        {/* Paid Out Earnings */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="text-center">
                                <div className="text-xl font-bold text-green-600 mb-1">
                                    ${earningsTotals.paidOut.toFixed(2)}
                                </div>
                                <div className="text-xs text-green-700 font-medium">Paid Out</div>
                            </div>
                        </div>
                    </div>

                    {/* Net Available Summary */}
                    {earningsTotals.pendingDeductions > 0 && (
                        <div className="mt-4 p-3 bg-neutrals-7 rounded-lg border border-neutrals-6">
                            <div className="text-center">
                                <div className="text-sm text-neutrals-3 mb-1">Net Available After Deductions</div>
                                <div className="text-lg font-bold text-neutrals-1">
                                    ${Math.max(0, earningsTotals.pending - earningsTotals.pendingDeductions).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-300px)]">
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
                                                    ) : schedule.status === "CANCELLED" ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            CANCELLED
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
                                                    {schedule.status === "CANCELLED" ? (
                                                        <>
                                                            <span className="text-red-600">Cancelled by guide</span>
                                                            <span>•</span>
                                                            <span className="font-semibold text-red-600">Cancellation fees applied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{schedule.bookingCount} bookings</span>
                                                            <span>•</span>
                                                            <span>{schedule.totalGuests} guests</span>
                                                            <span>•</span>
                                                            <span className="font-semibold text-primary-1">${parseFloat(schedule.potentialEarnings || 0).toFixed(2)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col items-end space-y-2">
                                            {schedule.status === "CONFIRMED" ? (
                                                <>
                                                    {/* Complete Timeslot Button */}
                                                    {(() => {
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
                                                    })()}

                                                    {/* Cancel Timeslot Button */}
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleCancelTimeslot(schedule)}
                                                        disabled={cancellingSchedule === schedule.scheduleId}
                                                        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                                        title="Cancel this timeslot and refund all customers"
                                                    >
                                                        {cancellingSchedule === schedule.scheduleId
                                                            ? 'Cancelling...'
                                                            : 'Cancel Timeslot'
                                                        }
                                                    </Button>
                                                </>
                                            ) : schedule.status === "COMPLETED" ? (
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            ) : schedule.status === "CANCELLED" ? (
                                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </div>
                                            ) : null}
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

            {/* Cancellation Dialog */}
            {showCancellationDialog && selectedCancellationSchedule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        {/* Dialog Header */}
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutrals-1">Cancel Timeslot Confirmation</h3>
                        </div>

                        {/* Dialog Content */}
                        <div className="mb-6">
                            <p className="text-sm text-neutrals-2 mb-4">
                                You are about to <strong>CANCEL</strong> this timeslot. This will:
                            </p>
                            <ul className="list-disc list-inside text-sm text-neutrals-2 mb-4 space-y-1">
                                <li>Cancel all confirmed bookings for this timeslot</li>
                                <li>Provide full refunds to all {selectedCancellationSchedule.bookingCount} customers</li>
                                <li>Cannot be undone once confirmed</li>
                            </ul>

                            {/* Fee Calculation */}
                            {(() => {
                                const feeInfo = calculateCancellationFee(selectedCancellationSchedule);
                                return (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-semibold text-red-800 mb-1">CANCELLATION FEE</p>
                                                <p className="text-xs text-red-700 mb-2">
                                                    Based on timing policy ({feeInfo.policy}):
                                                </p>
                                                <p className="text-lg font-bold text-red-700">
                                                    ${feeInfo.amount.toFixed(2)} ({feeInfo.percentage}% of booking revenue)
                                                </p>
                                                <p className="text-xs text-red-700 mt-2">
                                                    This fee will be deducted from your future earnings.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Customer Protection Notice */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-green-800 mb-1">CUSTOMER PROTECTION</p>
                                        <p className="text-xs text-green-700">
                                            All customers will receive full refunds (including service fees) and will be notified immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cancellation Reason */}
                            <div>
                                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                                    Reason for cancellation *
                                </label>
                                <select
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    className="w-full p-3 border border-neutrals-6 rounded-lg focus:border-primary-1 focus:outline-none"
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="illness">Illness</option>
                                    <option value="weather">Weather conditions</option>
                                    <option value="equipment_failure">Equipment failure</option>
                                    <option value="safety_concerns">Safety concerns</option>
                                    <option value="personal_reasons">Personal reasons</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Dialog Actions */}
                        <div className="flex space-x-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleCancelCancellation}
                                className="flex-1"
                            >
                                Go Back
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleConfirmCancellation}
                                disabled={!cancellationReason}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm Cancellation
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExperienceEarningsModal;