import React from 'react';

export default function CheckoutProgressSteps({ currentStep, isMobile = false }) {
  const steps = [
    { number: 1, label: 'Contact', isActive: currentStep >= 1 },
    { number: 2, label: 'Payment', isActive: currentStep >= 2 }
  ];

  if (isMobile) {
    // Mobile - show current step only
    const currentStepData = steps.find(step => step.number === currentStep);
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutrals-1 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {currentStepData?.number}
          </div>
          <span className="text-base font-semibold text-neutrals-1">
            {currentStepData?.label}
          </span>
        </div>
      </div>
    );
  }

  // Desktop - show all steps
  return (
    <div className="mb-12">
      <div className="flex items-center gap-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step.isActive
                  ? 'bg-neutrals-1 text-white'
                  : 'bg-neutrals-6 text-neutrals-4'
                }`}>
                {step.number}
              </div>
              <span className={`text-lg font-semibold transition-colors ${step.isActive ? 'text-neutrals-1' : 'text-neutrals-4'
                }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 transition-colors ${currentStep > step.number ? 'bg-neutrals-1' : 'bg-neutrals-6'
                }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}