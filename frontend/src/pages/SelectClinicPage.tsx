import React, { useState } from 'react';
import { Building2, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// TODO: Replace with actual clinic data from API
const mockClinics = [
  { id: '1', name: 'Centomo Medical Center - Downtown', address: '123 Main St, Montreal, QC' },
  { id: '2', name: 'Centomo Medical Center - West Island', address: '456 West Ave, Montreal, QC' },
  { id: '3', name: 'Centomo Medical Center - Laval', address: '789 North Blvd, Laval, QC' },
];

export const SelectClinicPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClinicSelection = async () => {
    if (!selectedClinic) return;

    setIsLoading(true);
    try {
      // TODO: Call API to update user's clinic assignment
      // await updateUserClinic(selectedClinic);
      
      // For now, just redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to update clinic selection:', error);
      // TODO: Show error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="flex items-center space-x-3 mb-6">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Select Your Clinic</h1>
            <p className="text-sm text-gray-600">Choose the clinic you work with</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {mockClinics.map((clinic) => (
            <div
              key={clinic.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedClinic === clinic.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedClinic(clinic.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="clinic"
                  value={clinic.id}
                  checked={selectedClinic === clinic.id}
                  onChange={() => setSelectedClinic(clinic.id)}
                  className="mt-1"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{clinic.name}</h3>
                  <p className="text-sm text-gray-600">{clinic.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleClinicSelection}
            disabled={!selectedClinic || isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Continue'}
          </Button>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
