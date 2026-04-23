export interface Photographer {
  id: string;
  name: string;
  email: string;
}

export interface PhotographerProfile {
  id: string;
  name: string;
  strengths?: string;
  weaknesses?: string;
  experience?: string;
  expertise?: string;
}

export interface Job {
  id: string;
  title: string;
  due_date: string;
  deadline?: string;
  type: string;
  nmids: string[];
  folder_link: string;
  pipeline: string;
  status: string;
  description?: string;
  owner_names?: string[];
  all_properties?: Record<string, any>;
}
