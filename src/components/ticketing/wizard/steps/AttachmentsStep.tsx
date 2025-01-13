import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { AttachmentInfo } from '../types';

interface AttachmentsStepProps {
  data: AttachmentInfo;
  onChange: (field: keyof AttachmentInfo, value: string) => void;
  categoryId: string;
}

interface Status {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
}

interface User {
  id: string;
  full_name: string;
  access_level: number;
}

export function AttachmentsStep({ data, onChange, categoryId }: AttachmentsStepProps) {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (categoryId) {
      loadStatuses(categoryId);
    } else {
      setStatuses([]);
    }
  }, [categoryId]);

  const loadData = async () => {
    try {
      // Load assignable users using the secure function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_assignable_users');

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  };

  const loadStatuses = async (catId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('name')
        .eq('id', catId)
        .single();

      if (categoryError) throw categoryError;
      if (!category) throw new Error('Category not found');

      const { data: statusesData, error: statusError } = await supabase
        .from('statuses')
        .select('*')
        .eq('category', category.name)
        .order('name');

      if (statusError) throw statusError;
      setStatuses(statusesData || []);
      
      // Set default status if available and no status is selected
      if (!data.status && statusesData.length > 0) {
        const defaultStatus = statusesData.find(s => s.is_default);
        if (defaultStatus) {
          onChange('status', defaultStatus.id);
        }
      }
    } catch (err) {
      console.error('Error loading statuses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statuses');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block font-medium">Accountability</label>
        <p className="text-sm text-gray-500">Select who is accountable for this issue</p>
        <select
          value={data.accountability}
          onChange={(e) => onChange('accountability', e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">Select Accountable User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
        {users.length === 0 && (
          <p className="text-sm text-amber-600 mt-1">
            No eligible users found. Users must have access level 2 or higher.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Status</label>
        <p className="text-sm text-gray-500">Current status of the ticket</p>
        <select
          value={data.status}
          onChange={(e) => onChange('status', e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
          required
          disabled={isLoading || !categoryId}
        >
          <option value="">
            {!categoryId 
              ? 'Select category first'
              : isLoading 
              ? 'Loading statuses...'
              : 'Select status'
            }
          </option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        {statuses.length === 0 && categoryId && !isLoading && (
          <p className="text-sm text-amber-600 mt-1">
            No statuses found for this category. Please contact an administrator.
          </p>
        )}
      </div>
    </div>
  );
}