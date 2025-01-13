export interface BasicInfo {
  category_id: string;
  department_id: string;
  kpi_id: string;
  assigned_to: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  incident_date: string;
}

export interface TicketDetails {
  title: string;
  description: string;
  attachment: File | null;
}

export interface AttachmentInfo {
  accountability: string;
  status: string;
}

export interface WizardFormData {
  basicInfo: BasicInfo;
  details: TicketDetails;
  attachments: AttachmentInfo;
}