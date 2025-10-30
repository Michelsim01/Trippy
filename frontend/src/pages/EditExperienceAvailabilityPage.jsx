import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { useFormData } from '../contexts/FormDataContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ProgressSteps from '../components/create-experience/ProgressSteps';
import Button from '../components/Button';
import Swal from 'sweetalert2';

export default function EditExperienceAvailabilityPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    formData: contextData,
    updateFormData,
    isEditMode,
    experienceId,
    isFieldRestricted,
    saveCurrentChanges,
    loadExistingExperience,
    // Booking status functionality
    realBookingStatus,
    scheduleBookingStatuses,
    isScheduleEditable
  } = useFormData();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    startDateTime: '',
    endDateTime: ''
  });

  // Master schedule settings state
  const [masterSchedule, setMasterSchedule] = useState({
    startDateTime: '',
    duration: ''  // Duration in hours
  });

  // Initialize form data for direct page access
  useEffect(() => {
    const initializeData = async () => {
      if (id && (!isEditMode || experienceId !== id)) {
        try {
          await loadExistingExperience(id);
        } catch (error) {
          console.error('Failed to load experience data:', error);
        }
      }
      setIsLoading(false);
    };

    initializeData();
  }, [id, isEditMode, experienceId, loadExistingExperience]);

  // Initialize master schedule from context data
  useEffect(() => {
    if (contextData) {
      setMasterSchedule({
        startDateTime: contextData.startDateTime || '',
        duration: contextData.duration || ''
      });
    }
  }, [contextData]);

  // Get sorted schedules
  const sortedSchedules = (contextData?.schedules || []).sort((a, b) => {
    return new Date(a.startDateTime) - new Date(b.startDateTime);
  });


  // Check if schedule can be edited/deleted (use new context method)
  const checkScheduleEditable = (schedule) => {
    // Use the context method which handles both real and mock booking data
    return isScheduleEditable(schedule.scheduleId || schedule.id);
  };

  // Calculate end time from start time and duration
  const calculateEndTime = (startDateTime, durationHours) => {
    if (!startDateTime || !durationHours) return '';

    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + (parseFloat(durationHours) * 60 * 60 * 1000));

    // Format back to datetime-local format (preserve local timezone)
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Handle master schedule changes
  const handleMasterScheduleChange = (field, value) => {
    setMasterSchedule(prev => {
      const updated = { ...prev, [field]: value };

      // Update context data when master schedule changes
      updateFormData({
        startDateTime: field === 'startDateTime' ? value : updated.startDateTime,
        duration: field === 'duration' ? value : updated.duration
      });

      return updated;
    });
  };

  // Handle adding new schedule
  const handleAddSchedule = () => {
    // Pre-populate with master schedule if available
    const initialForm = {
      startDateTime: masterSchedule.startDateTime || '',
      endDateTime: masterSchedule.startDateTime && masterSchedule.duration
        ? calculateEndTime(masterSchedule.startDateTime, masterSchedule.duration)
        : ''
    };
    setScheduleForm(initialForm);
    setEditingScheduleId(null);
    setShowAddScheduleForm(true);
  };

  // Handle editing existing schedule
  const handleEditSchedule = (schedule) => {
    setScheduleForm({
      startDateTime: schedule.startDateTime || '',
      endDateTime: schedule.endDateTime || ''
    });
    setEditingScheduleId(schedule.scheduleId || schedule.id);
    setShowAddScheduleForm(true);
  };

  // Handle deleting schedule
  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      const updatedSchedules = sortedSchedules.filter(schedule =>
        (schedule.scheduleId || schedule.id) !== scheduleId
      );
      updateFormData({ schedules: updatedSchedules });
    }
  };

  // Handle schedule form changes with auto-duration calculation
  const handleScheduleFormChange = (field, value) => {
    if (field === 'startDateTime' && masterSchedule.duration) {
      // Auto-calculate end time when start time changes and master duration exists
      const endDateTime = calculateEndTime(value, masterSchedule.duration);
      setScheduleForm(prev => ({
        ...prev,
        startDateTime: value,
        endDateTime: endDateTime
      }));
    } else {
      setScheduleForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Calculate duration in hours between two datetime strings
  const calculateDurationHours = (startDateTime, endDateTime) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  // Validate duration consistency with master schedule
  const validateDurationConsistency = (startDateTime, endDateTime) => {
    if (!masterSchedule.duration) return true; // No master duration set, skip validation

    const calculatedDuration = calculateDurationHours(startDateTime, endDateTime);
    const masterDuration = parseFloat(masterSchedule.duration);

    // Allow small floating point tolerance (5 minutes = 0.083 hours)
    const tolerance = 0.083;
    return Math.abs(calculatedDuration - masterDuration) <= tolerance;
  };

  // Handle schedule form submission
  const handleScheduleSubmit = async () => {
    if (!scheduleForm.startDateTime || !scheduleForm.endDateTime) {
      await Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in both start and end date/time',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    if (new Date(scheduleForm.startDateTime) >= new Date(scheduleForm.endDateTime)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Time Range',
        text: 'End date/time must be after start date/time',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    // Validate duration consistency if master duration is set
    if (masterSchedule.duration && !validateDurationConsistency(scheduleForm.startDateTime, scheduleForm.endDateTime)) {
      const actualDuration = calculateDurationHours(scheduleForm.startDateTime, scheduleForm.endDateTime);
      await Swal.fire({
        icon: 'warning',
        title: 'Duration Mismatch',
        html: `This schedule is <strong>${actualDuration.toFixed(1)} hours</strong>, but master duration is <strong>${masterSchedule.duration} hours</strong>.<br><br>Please adjust the times or master duration.`,
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    // Check for conflicts with existing schedules
    const hasConflict = sortedSchedules.some(schedule => {
      if (editingScheduleId && (schedule.scheduleId || schedule.id) === editingScheduleId) {
        return false; // Skip self when editing
      }

      const newStart = new Date(scheduleForm.startDateTime);
      const newEnd = new Date(scheduleForm.endDateTime);
      const existingStart = new Date(schedule.startDateTime);
      const existingEnd = new Date(schedule.endDateTime);

      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasConflict) {
      await Swal.fire({
        icon: 'warning',
        title: 'Schedule Conflict',
        text: 'This schedule conflicts with an existing schedule. Please choose different times.',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    let updatedSchedules;
    if (editingScheduleId) {
      // Update existing schedule
      updatedSchedules = sortedSchedules.map(schedule =>
        (schedule.scheduleId || schedule.id) === editingScheduleId
          ? { ...schedule, ...scheduleForm }
          : schedule
      );
    } else {
      // Add new schedule
      const newSchedule = {
        ...scheduleForm,
        scheduleId: Date.now(), // Temporary ID for new schedules
        availableSpots: parseInt(contextData?.participantsAllowed),
        isAvailable: true,
        isNew: true
      };
      updatedSchedules = [...sortedSchedules, newSchedule];
    }

    updateFormData({ schedules: updatedSchedules });
    setShowAddScheduleForm(false);
    setEditingScheduleId(null);
    setScheduleForm({ startDateTime: '', endDateTime: '' });
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: 'Cancel Editing?',
      text: 'Any unsaved changes will be lost. Are you sure you want to cancel?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF385C',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'Continue Editing'
    });

    if (result.isConfirmed) {
      navigate('/my-tours');
    }
  };

  // Handle navigation
  const handleBack = async () => {
    // Auto-save before going back
    try {
      setIsSaving(true);
      setSaveError(null);
      await saveCurrentChanges();
      navigate(`/edit-experience/${id}/pricing`);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(error.message);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save changes. Please try again.',
        confirmButtonColor: '#FF385C'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    // Validate before finishing
    if (!contextData?.schedules || contextData.schedules.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Schedules',
        text: 'Please add at least one schedule before finishing.',
        confirmButtonColor: '#FF385C'
      });
      return;
    }

    // Auto-save before finishing
    try {
      setIsSaving(true);
      setSaveError(null);
      await saveCurrentChanges();
      setSaveSuccess(true);
      // Give user feedback before navigating
      setTimeout(() => {
        navigate(`/my-tours`);
      }, 500);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(error.message);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save changes. Please try again.',
        confirmButtonColor: '#FF385C'
      });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutrals-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-1 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutrals-4">Loading availability data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} variant="desktop" />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={true}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* Main Content - Centered with max width */}
          <div className="max-w-7xl mx-auto py-16" style={{paddingLeft: '20px', paddingRight: '20px'}}>
          {/* Progress Steps */}
          <ProgressSteps currentStep={4} isEditMode={isEditMode} />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutrals-1 mb-2">
              Edit Experience - Availability
            </h1>
            <p className="text-neutrals-4">Manage your experience schedules and time slots</p>
          </div>



          {/* Master Schedule Settings */}
          <div className="bg-white rounded-2xl border border-neutrals-6 p-6 mb-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-neutrals-1 mb-2">Master Schedule Settings</h3>
              <p className="text-neutrals-4 text-sm">
                Set the base schedule that applies to all dates. Individual schedules will auto-calculate end times based on these settings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Master Start Date & Time */}
              <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                  Master Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={masterSchedule.startDateTime}
                  onChange={(e) => handleMasterScheduleChange('startDateTime', e.target.value)}
                  className="w-full p-3 border border-neutrals-6 rounded-lg focus:border-primary-1 focus:outline-none"
                />
                <p className="text-xs text-neutrals-4 mt-1">Base date and time for new schedules</p>
              </div>

              {/* Master Duration */}
              <div>
                <label className="block text-sm font-medium text-neutrals-2 mb-2">
                  Master Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={masterSchedule.duration}
                  onChange={(e) => handleMasterScheduleChange('duration', e.target.value)}
                  placeholder="e.g., 2.5"
                  disabled={masterSchedule.duration && sortedSchedules.length > 0}
                  className={`w-full p-3 border rounded-lg focus:outline-none ${
                    masterSchedule.duration && sortedSchedules.length > 0
                      ? 'border-neutrals-6 bg-neutrals-7 text-neutrals-4 cursor-not-allowed'
                      : 'border-neutrals-6 focus:border-primary-1'
                  }`}
                />
                <p className="text-xs text-neutrals-4 mt-1">
                  {masterSchedule.duration && sortedSchedules.length > 0
                    ? "Duration is locked after schedules are created. Delete experience and recreate to change."
                    : "Duration that applies to all schedules"}
                </p>
              </div>
            </div>

            {/* Duration Preview */}
            {masterSchedule.duration && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    All schedules will be {masterSchedule.duration} hour{parseFloat(masterSchedule.duration) !== 1 ? 's' : ''} long
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Schedules List */}
          <div className="bg-white rounded-2xl border border-neutrals-6 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-neutrals-1">Experience Schedules</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddSchedule}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add More Dates
              </Button>
            </div>

            {sortedSchedules.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 text-neutrals-5">
                  <Calendar className="w-full h-full" />
                </div>
                <h4 className="text-lg font-medium text-neutrals-2 mb-2">No schedules yet</h4>
                <p className="text-neutrals-4 mb-4">Add your first schedule to make this experience available for booking.</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleAddSchedule}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedSchedules.map((schedule, index) => {
                  const isEditable = checkScheduleEditable(schedule);
                  return (
                    <div
                      key={schedule.scheduleId || schedule.id || index}
                      className="flex items-center justify-between p-4 border border-neutrals-6 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Indicator */}
                        <div className={`w-3 h-3 rounded-full ${isEditable ? 'bg-green-500' : 'bg-red-500'}`}></div>

                        <div>
                          {/* Date Display */}
                          <div className="flex items-center gap-2 text-neutrals-2 font-semibold">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {schedule.startDateTime && schedule.endDateTime ? (() => {
                                const startDate = new Date(schedule.startDateTime);
                                const endDate = new Date(schedule.endDateTime);
                                const isMultiDay = startDate.toDateString() !== endDate.toDateString();

                                if (isMultiDay) {
                                  const startStr = startDate.toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short'
                                  });
                                  const endStr = endDate.toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short'
                                  });
                                  return `${startStr} to ${endStr}`;
                                } else {
                                  return startDate.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  });
                                }
                              })() : 'Invalid Date'}
                            </span>
                          </div>
                          {/* Time Range Display */}
                          <div className="flex items-center gap-2 text-neutrals-4 text-sm mt-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {schedule.startDateTime && schedule.endDateTime ?
                                `${new Date(schedule.startDateTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })} - ${new Date(schedule.endDateTime).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}` : 'Invalid Time'
                              }
                            </span>
                            {/* Duration indicator */}
                            {schedule.startDateTime && schedule.endDateTime && (
                              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {calculateDurationHours(schedule.startDateTime, schedule.endDateTime).toFixed(1)}h
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditable ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSchedule(schedule)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule.scheduleId || schedule.id)}
                              className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                            Protected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add/Edit Schedule Form Modal */}
          {showAddScheduleForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                <h3 className="text-xl font-semibold text-neutrals-1 mb-4">
                  {editingScheduleId ? 'Edit Schedule' : 'Add New Schedule'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutrals-2 mb-2">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleForm.startDateTime}
                      onChange={(e) => handleScheduleFormChange('startDateTime', e.target.value)}
                      className="w-full p-3 border border-neutrals-6 rounded-lg focus:border-primary-1 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutrals-2 mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleForm.endDateTime}
                      onChange={(e) => handleScheduleFormChange('endDateTime', e.target.value)}
                      className="w-full p-3 border border-neutrals-6 rounded-lg focus:border-primary-1 focus:outline-none"
                      disabled={masterSchedule.duration ? true : false}
                    />
                    {masterSchedule.duration && (
                      <p className="text-xs text-blue-600 mt-1">
                        End time is auto-calculated from master duration ({masterSchedule.duration} hours)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setShowAddScheduleForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleScheduleSubmit}
                    className="flex-1"
                  >
                    {editingScheduleId ? 'Update' : 'Add'} Schedule
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{saveError}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">Changes saved successfully!</p>
            </div>
          )}

          <div className="flex gap-3" style={{marginBottom: '15px'}}>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-red-500 border-2 border-neutrals-5 text-white font-bold py-4 rounded-full hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBack}
                  disabled={isSaving}
                  className="flex-1 border-2 border-neutrals-5 text-neutrals-2 font-bold py-4 rounded-full hover:bg-neutrals-7 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Back'}
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="flex-1 bg-primary-1 text-white font-bold py-4 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Finish'}
                </button>
              </div>
        </div>
      </div>
    </div>
      <Footer />
    </div>
  );
}