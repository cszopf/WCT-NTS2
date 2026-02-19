
export type Persona = 'Buyer' | 'Seller' | 'Real Estate Agent' | 'Lender';

export enum LocationType {
  IN_OFFICE = 'inOffice',
  REMOTE = 'remote',
  MOBILE = 'mobile'
}

export interface AppointmentType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  personaEligibility: Persona[];
  calendarId?: string;
  locationType: LocationType;
  businessHours: Record<string, { start: string; end: string } | null>;
  leadTimeMinutes: number;
  sameDayCutoffHour: number;
  intakeQuestions?: any;
}

export interface TimeSlot {
  start: string; // ISO
  end: string;   // ISO
  label: string; // "9:00 AM"
}

export interface Booking {
  id: string;
  appointmentTypeId: string;
  persona: Persona;
  startDateTime: string;
  endDateTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  answers: Record<string, any>;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  createdAt: string;
  googleEventId?: string; // New field for integration
}

export interface Hold {
  id: string;
  appointmentTypeId: string;
  startDateTime: string;
  expiresAt: string;
  status: 'held' | 'converted' | 'expired';
}
