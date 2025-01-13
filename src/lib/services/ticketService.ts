import { supabase } from '../supabase';
import type { WizardFormData } from '../../components/ticketing/wizard/types';

export async function createTicket(formData: WizardFormData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    // Get the values for category, department, kpi, and status
    const [
      { data: category },
      { data: department },
      { data: kpi },
      { data: status }
    ] = await Promise.all([
      supabase.from('categories').select('name').eq('id', formData.basicInfo.category_id).single(),
      supabase.from('departments').select('name').eq('id', formData.basicInfo.department_id).single(),
      supabase.from('kpis').select('name').eq('id', formData.basicInfo.kpi_id).single(),
      supabase.from('statuses').select('name').eq('id', formData.attachments.status).single()
    ]);

    // Handle file upload first if there's an attachment
    let attachmentDetails = null;
    if (formData.details.attachment) {
      const file = formData.details.attachment;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      attachmentDetails = {
        attachment_name: file.name,
        attachment_size: file.size,
        attachment_type: file.type,
        attachment_path: filePath
      };
    }

    // Create the ticket with all details
    const { error: ticketError } = await supabase
      .from('tickets')
      .insert({
        category_name: category?.name,
        department_name: department?.name,
        kpi_name: kpi?.name,
        assigned_to: formData.basicInfo.assigned_to,
        title: formData.details.title,
        description: formData.details.description, // Use the description field directly
        priority: formData.basicInfo.priority,
        due_date: formData.basicInfo.due_date,
        incident_date: formData.basicInfo.incident_date,
        accountability: formData.attachments.accountability,
        status_name: status?.name,
        created_by: user.id,
        ...(attachmentDetails || {}) // Spread attachment details if they exist
      });

    if (ticketError) throw ticketError;

  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

export async function getMyTickets() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ticket_details_view')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTicketDetails(ticketNumber: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('ticket_details_view')
    .select('*')
    .eq('ticket_number', ticketNumber)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}