import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader } from 'lucide-react';

interface UserMetrics {
  user_id: string;
  full_name: string;
  assigned_tickets: number;
  accountable_tickets: number;
  resolved_tickets: number;
  reopened_tickets: number;
  avg_resolution_time: number | null;
  overdue_tickets: number;
}

export function PerformanceReport() {
  const [metrics, setMetrics] = useState<UserMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all assignable users first
      const { data: users, error: usersError } = await supabase
        .rpc('get_assignable_users');

      if (usersError) throw usersError;

      // For each user, get their metrics
      const userMetrics = await Promise.all((users || []).map(async (user) => {
        // Get tickets assigned to user
        const { data: assignedTickets } = await supabase
          .from('ticket_details_view')
          .select('*')
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: true });

        // Get tickets where user is accountable
        const { data: accountableTickets } = await supabase
          .from('ticket_details_view')
          .select('*')
          .eq('accountability', user.id);

        // Get unique tickets by ticket number (latest version)
        const latestTickets = (assignedTickets || []).reduce((acc, curr) => {
          if (!acc[curr.ticket_number] || new Date(curr.created_at) > new Date(acc[curr.ticket_number].created_at)) {
            acc[curr.ticket_number] = curr;
          }
          return acc;
        }, {} as Record<string, any>);

        const uniqueTickets = Object.values(latestTickets);

        // Calculate metrics
        const resolved = uniqueTickets.filter(t => t.status_name?.toLowerCase().includes('closed')).length;
        const reopened = uniqueTickets.filter(t => t.status_name?.toLowerCase().includes('reopened')).length;
        const overdue = uniqueTickets.filter(t => {
          const dueDate = new Date(t.due_date);
          return dueDate < new Date() && !t.status_name?.toLowerCase().includes('closed');
        }).length;

        // Calculate average lead time for all tickets
        const leadTimes = uniqueTickets
          .map(t => t.lead_time_days)
          .filter((days): days is number => days !== null);

        const avgResolutionTime = leadTimes.length > 0
          ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
          : null;

        return {
          user_id: user.id,
          full_name: user.full_name,
          assigned_tickets: uniqueTickets.length,
          accountable_tickets: accountableTickets?.length || 0,
          resolved_tickets: resolved,
          reopened_tickets: reopened,
          avg_resolution_time: avgResolutionTime,
          overdue_tickets: overdue
        };
      }));

      setMetrics(userMetrics);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-primary">{metrics.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-2">Total Tickets</h3>
          <p className="text-3xl font-bold text-green-600">
            {metrics.reduce((sum, user) => sum + user.assigned_tickets, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-2">Resolved Tickets</h3>
          <p className="text-3xl font-bold text-blue-600">
            {metrics.reduce((sum, user) => sum + user.resolved_tickets, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-2">Overdue Tickets</h3>
          <p className="text-3xl font-bold text-red-600">
            {metrics.reduce((sum, user) => sum + user.overdue_tickets, 0)}
          </p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">User</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Assigned</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Accountable</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Resolved</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Reopened</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Avg. Lead Time (Days)</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {user.assigned_tickets}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {user.accountable_tickets}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                    {user.resolved_tickets}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-amber-600 font-medium">
                    {user.reopened_tickets}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    {user.avg_resolution_time !== null 
                      ? user.avg_resolution_time.toFixed(1) 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                    {user.overdue_tickets}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}