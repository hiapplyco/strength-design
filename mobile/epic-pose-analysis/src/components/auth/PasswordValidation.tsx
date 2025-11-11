
import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordValidationProps {
  password: string;
  showValidation: boolean;
}

export const PasswordValidation = ({ password, showValidation }: PasswordValidationProps) => {
  if (!showValidation) return null;

  const validations = [
    {
      test: password.length >= 12,
      message: 'At least 12 characters'
    },
    {
      test: /[A-Z]/.test(password),
      message: 'One uppercase letter'
    },
    {
      test: /[a-z]/.test(password),
      message: 'One lowercase letter'
    },
    {
      test: /[0-9]/.test(password),
      message: 'One number'
    },
    {
      test: /[^a-zA-Z0-9]/.test(password),
      message: 'One special character'
    }
  ];

  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm text-gray-600 dark:text-gray-400">Password requirements:</p>
      {validations.map((validation, index) => (
        <div key={index} className="flex items-center space-x-2 text-sm">
          {validation.test ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span className={validation.test ? 'text-green-600' : 'text-red-600'}>
            {validation.message}
          </span>
        </div>
      ))}
    </div>
  );
};
