import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { WizardNavigation } from './WizardNavigation';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { TicketDetailsStep } from './steps/TicketDetailsStep';
import { AttachmentsStep } from './steps/AttachmentsStep';
import { createTicket } from '../../../lib/services/ticketService';
import type { WizardFormData } from './types';

const initialFormData: WizardFormData = {
  basicInfo: {
    category_id: '',
    department_id: '',
    kpi_id: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    incident_date: ''
  },
  details: {
    title: '',
    description: '',
    attachment: null
  },
  attachments: {
    accountability: '',
    status: ''
  }
};

export function TicketWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.basicInfo.category_id &&
          formData.basicInfo.department_id &&
          formData.basicInfo.kpi_id &&
          formData.basicInfo.assigned_to &&
          formData.basicInfo.due_date &&
          formData.basicInfo.incident_date
        );
      case 2:
        return !!formData.details.title && !!formData.details.description;
      case 3:
        return !!formData.attachments.status && !!formData.attachments.accountability;
      default:
        return false;
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= Math.max(...Array.from(completedSteps), currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      await createTicket(formData);
      setSuccess('Ticket created successfully');
      setFormData(initialFormData);
      setCurrentStep(1);
      setCompletedSteps(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      handleSubmit();
      return;
    }

    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={formData.basicInfo}
            onChange={(field, value) => setFormData(prev => ({
              ...prev,
              basicInfo: { ...prev.basicInfo, [field]: value }
            }))}
          />
        );
      case 2:
        return (
          <TicketDetailsStep
            data={formData.details}
            onChange={(field, value) => setFormData(prev => ({
              ...prev,
              details: { ...prev.details, [field]: value }
            }))}
          />
        );
      case 3:
        return (
          <AttachmentsStep
            data={formData.attachments}
            onChange={(field, value) => setFormData(prev => ({
              ...prev,
              attachments: { ...prev.attachments, [field]: value }
            }))}
            categoryId={formData.basicInfo.category_id}
          />
        );
      default:
        return null;
    }
  };

  const isStepValid = validateStep(currentStep);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-6">
      <div className="flex gap-8">
        <WizardNavigation
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
        />

        <div className="flex-1 space-y-6">
          <h2 className="text-lg font-medium mb-4">
            Step {currentStep} of 3: {
              currentStep === 1 ? 'Basic Information' :
              currentStep === 2 ? 'Ticket Details' :
              'Accountability'
            }
          </h2>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
              {success}
            </div>
          )}

          {renderStep()}

          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                currentStep === 3 ? 'Submit' : 'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}