export interface Profile {
  uid: string;
  role: 'company' | 'translator';
  email: string;
  name: string;
  createdAt: any; // Firestore Timestamp
  
  // Translator specific fields
  languages?: string[]; // e.g. ["English", "Mandarin Chinese", "Cantonese"]
  bio?: string;
  experience?: string;
  rate?: string; // e.g. "$40/hour" or "$0.12 / word"
  location?: string;
  skills?: string[]; // e.g. ["Technical Documents", "Simultaneous Interpretation", "Legal", "Subtitling"]
  avatarUrl?: string;
  emailNotificationsEnabled?: boolean;

  // Company specific fields
  companyName?: string;
  website?: string;
  industry?: string;
  about?: string;
  logoUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  languagePair: string; // e.g. "English -> Simplified Chinese"
  location: string; // e.g. "Remote" or "Shanghai, China (On-site)"
  createdAt: any;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  status: 'open' | 'closed';
  applicantsCount: number;
  requirements?: string; // extra context / notes
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  translatorId: string;
  translatorName: string;
  translatorEmail: string;
  translatorLanguages?: string[];
  translatorRate?: string;
  coverLetter: string;
  rateProposal: string;
  status: 'submitted' | 'reviewed' | 'accepted' | 'declined';
  createdAt: any;
  companyId: string; // to easily query on company side
}

export interface TriggerNotification {
  id: string;
  companyId: string;
  applicationId: string;
  translatorName: string;
  jobTitle: string;
  subject: string;
  summaryText: string;
  htmlContent: string;
  sentAt: any;
  toEmail: string;
}

export interface Review {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  translatorId: string;
  translatorName: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: any;
}


