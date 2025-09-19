import React from 'react';

export default function ProgressSteps({ currentStep, isMobile = false }) {
  const steps = [
    { step: 1, label: "Basic Info" },
    { step: 2, label: "Details" },
    { step: 3, label: "Pricing" },
    { step: 4, label: "Availability" }
  ];

  if (isMobile) {
    // Mobile version - show only current step
    const current = steps.find(s => s.step === currentStep);
    return (
      <div className="flex gap-4 items-center" style={{marginBottom: '20px'}}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-neutrals-2">
          {currentStep}
        </div>
        <span className="text-base font-medium text-neutrals-1">
          {current?.label}
        </span>
      </div>
    );
  }

  // Desktop version - show all steps
  return (
    <div className="flex items-start gap-16" style={{marginBottom: '30px'}}>
      {steps.map((item) => (
        <div key={item.step} className="flex flex-col">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
              item.step === currentStep ? 'bg-neutrals-1' : 'bg-neutrals-5'
            }`}>
              {item.step}
            </div>
            <span className={`text-lg font-semibold ${
              item.step === currentStep ? 'text-neutrals-1' : 'text-neutrals-5'
            }`}>
              {item.label}
            </span>
          </div>
          <div
            style={{
              backgroundColor: item.step === currentStep ? '#000' : '#d1d5db',
              width: '240px',
              height: item.step === currentStep ? '4px' : '2px',
              marginTop: '4px'
            }}
          />
        </div>
      ))}
    </div>
  );
}