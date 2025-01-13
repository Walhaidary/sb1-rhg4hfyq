import React, { useState } from 'react';
import { InputField } from '../common/InputField';
import { Notification } from '../common/Notification';
import { supabase } from '../../lib/supabase';

interface RegistrationFormData {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  accessLevel: number;
}

export function RegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accessLevel: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      // Register user with Supabase
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.fullName,
            access_level: formData.accessLevel
          }
        }
      });

      if (signUpError) throw signUpError;
      
      setSuccess('Account created successfully! Redirecting to login...');
      
      // Redirect to login after showing success message
      setTimeout(() => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex justify-center items-center p-8 md:p-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[#0088CC] hover:text-[#0077B3] font-medium"
            >
              Sign in
            </button>
          </p>
        </div>

        {error && <Notification type="error" message={error} />}
        {success && <Notification type="success" message={success} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            label="Username"
            placeholder="Enter username"
            value={formData.username}
            onChange={(value) => setFormData({ ...formData, username: value })}
          />
          
          <InputField
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(value) => setFormData({ ...formData, fullName: value })}
          />

          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={(value) => setFormData({ ...formData, password: value })}
          />

          <InputField
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
          />

          <div className="mb-6">
            <label className="block text-[#333333] text-base mb-2">
              Access Level
            </label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-[#CCCCCC] rounded text-base focus:outline-none focus:border-[#0088CC] transition-colors"
            >
              <option value={1}>Level 1 - Monitor</option>
              <option value={2}>Level 2 - Manage SC</option>
              <option value={3}>Level 3 - Store Keeper</option>
              <option value={4}>Level 4 - WH Manager</option>
              <option value={5}>Level 5 - Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0088CC] text-white py-2 px-4 rounded text-base hover:bg-[#0077B3] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}