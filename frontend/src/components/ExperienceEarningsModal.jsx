import React from 'react';
import Button from './Button';

const ExperienceEarningsModal = ({
    isOpen,
    onClose,
    experienceTitle,
    experienceId
}) => {
    if (!isOpen) return null;

    // Mock timeslot data for Phase 3
    const mockScheduleData = {
        experienceId: experienceId,
        schedules: [
            {
                scheduleId: 1,
                date: "2024-10-15",
                time: "9:00 AM",
                bookingCount: 3,
                totalGuests: 7,
                potentialEarnings: 420,
                status: "CONFIRMED"
            },
            {
                scheduleId: 2,
                date: "2024-10-16",
                time: "2:00 PM",
                bookingCount: 2,
                totalGuests: 4,
                potentialEarnings: 240,
                status: "COMPLETED"
            },
            {
                scheduleId: 3,
                date: "2024-10-18",
                time: "10:30 AM",
                bookingCount: 1,
                totalGuests: 2,
                potentialEarnings: 120,
                status: "CONFIRMED"
            },
            {
                scheduleId: 4,
                date: "2024-10-20",
                time: "3:00 PM",
                bookingCount: 4,
                totalGuests: 8,
                potentialEarnings: 480,
                status: "COMPLETED"
            }
        ]
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleCompleteTimeslot = (scheduleId) => {
        // Phase 6 implementation - for now just log
        console.log(`Complete timeslot ${scheduleId} for experience ${experienceId}`);
        alert(`Complete timeslot functionality will be implemented in Phase 6!`);
    };

    // Calculate experience-level earnings totals
    const calculateEarningsTotals = () => {
        const pending = mockScheduleData.schedules
            .filter(schedule => schedule.status === "CONFIRMED")
            .reduce((sum, schedule) => sum + schedule.potentialEarnings, 0);

        const paidOut = mockScheduleData.schedules
            .filter(schedule => schedule.status === "COMPLETED")
            .reduce((sum, schedule) => sum + schedule.potentialEarnings, 0);

        const total = pending + paidOut;

        return { total, pending, paidOut };
    };

    const earningsTotals = calculateEarningsTotals();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                    <div>
                        <h2 className="text-xl font-semibold text-neutrals-1">
                            {experienceTitle} - Earnings
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
                    {mockScheduleData.schedules.length === 0 ? (
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
                            {mockScheduleData.schedules.map((schedule) => (
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
                                                        {formatDate(schedule.date)}, {schedule.time}
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
                                                    <span className="font-semibold text-primary-1">${schedule.potentialEarnings}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div>
                                            {schedule.status === "CONFIRMED" ? (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleCompleteTimeslot(schedule.scheduleId)}
                                                >
                                                    Complete
                                                </Button>
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
        </div>
    );
};

export default ExperienceEarningsModal;