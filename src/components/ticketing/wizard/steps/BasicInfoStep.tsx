import React, { useState, useEffect } from 'react';
import { FormField } from '../../../common/FormField';
import { getCategories, getDepartments, getKPIsByDepartment } from '../../../../lib/services/adminService';
import { supabase } from '../../../../lib/supabase';
import type { BasicInfo } from '../types';

interface BasicInfoStepProps {
  data: BasicInfo;
  onChange: (field: keyof BasicInfo, value: string) => void;
}

interface Category {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface KPI {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  access_level: number;
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (data.department_id) {
      loadKPIs(data.department_id);
    } else {
      setKPIs([]);
    }
  }, [data.department_id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load categories and departments
      const [categoriesData, departmentsData] = await Promise.all([
        getCategories(),
        getDepartments()
      ]);

      // Load assignable users using the secure function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_assignable_users');

      if (usersError) throw usersError;
      
      setCategories(categoriesData);
      setDepartments(departmentsData);
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadKPIs = async (departmentId: string) => {
    try {
      const kpisData = await getKPIsByDepartment(departmentId);
      setKPIs(kpisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPIs');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Category / Issue Type</label>
          <select
            value={data.category_id}
            onChange={(e) => onChange('category_id', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            value={data.department_id}
            onChange={(e) => onChange('department_id', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select Department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">KPI</label>
          <select
            value={data.kpi_id}
            onChange={(e) => onChange('kpi_id', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            required
            disabled={!data.department_id}
          >
            <option value="">
              {!data.department_id 
                ? 'Select department first' 
                : kpis.length === 0 
                ? 'No KPIs available for this department'
                : 'Select KPI'
              }
            </option>
            {kpis.map((kpi) => (
              <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Assigned To</label>
          <select
            value={data.assigned_to}
            onChange={(e) => onChange('assigned_to', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select Assignee</option>
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
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField
          label="Due Date"
          description="When should this be resolved by"
          type="date"
          value={data.due_date}
          onChange={(value) => onChange('due_date', value)}
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            value={data.priority}
            onChange={(e) => onChange('priority', e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <FormField
        label="Date/Time of Incident"
        description="When did this issue occur"
        type="datetime-local"
        value={data.incident_date}
        onChange={(value) => onChange('incident_date', value)}
        required
      />
    </div>
  );
}