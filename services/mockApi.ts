
import { TimeSlot, Booking, Persona, AppointmentType } from '../types';
import { APPOINTMENT_TYPES } from '../constants';

// Simulated latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchAvailability = async (typeId: string, dateStr: string): Promise<TimeSlot[]> => {
  await delay(600);
  const type = APPOINTMENT_TYPES.find(t => t.id === typeId);
  if (!type) return [];

  const date = new Date(dateStr + 'T00:00:00');
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayKeys[date.getDay()];
  
  const hours = (type.businessHours as any)[dayKey];
  if (!hours) return []; // Closed on this day

  const [startH, startM] = hours.start.split(':').map(Number);
  const [endH, endM] = hours.end.split(':').map(Number);

  const slots: TimeSlot[] = [];
  const current = new Date(date);
  current.setHours(startH, startM, 0, 0);

  const businessEnd = new Date(date);
  businessEnd.setHours(endH, endM, 0, 0);

  while (current.getTime() < businessEnd.getTime()) {
    const slotStart = new Date(current);
    const totalNeededMinutes = type.durationMinutes + type.bufferAfterMinutes;
    const slotEnd = new Date(slotStart.getTime() + totalNeededMinutes * 60000);

    if (slotEnd.getTime() <= businessEnd.getTime()) {
      const isBusy = Math.random() < 0.2;
      if (!isBusy) {
        slots.push({
          start: slotStart.toISOString(),
          end: new Date(slotStart.getTime() + type.durationMinutes * 60000).toISOString(),
          label: slotStart.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true,
            timeZone: 'America/New_York'
          })
        });
      }
    }
    current.setMinutes(current.getMinutes() + 15);
  }

  return slots;
};

export const createBooking = async (data: any): Promise<{ id: string, googleEventId: string }> => {
  await delay(1200);
  
  const addr = data.propertyAddress || { formattedAddress: 'N/A', placeId: 'N/A', lat: 0, lng: 0 };
  
  // Google Calendar Integration Payload Simulation
  const calendarEvent = {
    summary: `WCT: ${data.persona} Closing - ${data.firstName} ${data.lastName}`,
    location: addr.formattedAddress,
    description: `
WCT: ${data.persona} Closing
Contact: ${data.firstName} ${data.lastName} (${data.phone})
Email: ${data.email}

Property Address:
${addr.formattedAddress}
Place ID: ${addr.placeId}
Lat/Lng: ${addr.lat},${addr.lng}

Notes: ${data.notes || 'None'}
    `.trim(),
    start: {
      dateTime: data.slot.start,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: data.slot.end,
      timeZone: 'America/New_York',
    },
    attendees: [
      { email: data.email },
      { email: 'closings@worldclasstitle.com' }
    ]
  };

  const mockGoogleEventId = `gcal_${Math.random().toString(36).substring(7)}`;

  console.log('--- GOOGLE CALENDAR API INTEGRATION ---');
  console.log('API Endpoint: POST https://www.googleapis.com/calendar/v3/calendars/primary/events');
  console.log('Payload:', calendarEvent);
  console.log('Response Status: 200 OK');
  console.log('Google Event ID Created:', mockGoogleEventId);
  
  return {
    id: Math.random().toString(36).substring(7).toUpperCase(),
    googleEventId: mockGoogleEventId
  };
};
