import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSwitchConfirmation } from '../CaseSwitchConfirmation';

describe('CaseSwitchConfirmation', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <CaseSwitchConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        currentCaseId={123}
        locale="en-CA"
      />
    );

    expect(screen.getByText('Save Current Case?')).toBeInTheDocument();
    expect(screen.getByText(/You have an active case \(ID: 123\)/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CaseSwitchConfirmation
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        currentCaseId={123}
        locale="en-CA"
      />
    );

    expect(screen.queryByText('Save Current Case?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when Yes button is clicked', () => {
    render(
      <CaseSwitchConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        currentCaseId={123}
        locale="en-CA"
      />
    );

    fireEvent.click(screen.getByText('Yes, Save & Start New'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when No button is clicked', () => {
    render(
      <CaseSwitchConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        currentCaseId={123}
        locale="en-CA"
      />
    );

    fireEvent.click(screen.getByText('No, Keep Current'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('renders French text when locale is fr-CA', () => {
    render(
      <CaseSwitchConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        currentCaseId={123}
        locale="fr-CA"
      />
    );

    expect(screen.getByText('Sauvegarder le cas actuel?')).toBeInTheDocument();
    expect(screen.getByText('Oui, Sauvegarder et Nouveau')).toBeInTheDocument();
    expect(screen.getByText('Non, Garder l\'actuel')).toBeInTheDocument();
  });

  it('renders without case ID when not provided', () => {
    render(
      <CaseSwitchConfirmation
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        locale="en-CA"
      />
    );

    expect(screen.getByText(/You have an active case\. Do you want to save/)).toBeInTheDocument();
  });
});
