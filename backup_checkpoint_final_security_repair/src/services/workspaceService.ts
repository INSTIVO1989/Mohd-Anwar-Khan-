import { Job } from '../types';

/**
 * GOOGLE DRIVE API CALLS
 */
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
}

export const listDriveFiles = async (accessToken: string): Promise<DriveFileItem[]> => {
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,webViewLink,size)&orderBy=modifiedTime desc',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Drive files (${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
};

export const createDriveFile = async (
  accessToken: string,
  name: string,
  mimeType: string,
  content: string
): Promise<DriveFileItem> => {
  const metadata = { name, mimeType };
  const boundary = 'foo_bar_baz_furniture_fix';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
  }
  return await res.json();
};

export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
  }
};

/**
 * GOOGLE SHEETS API CALLS
 */
export const createSpreadsheet = async (
  accessToken: string,
  title: string,
  initialRows: any[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: { title: 'Bookings & Ledger' },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: initialRows.map((row) => ({
                values: row.map((cell) => ({
                  userEnteredValue:
                    typeof cell === 'number'
                      ? { numberValue: cell }
                      : { stringValue: String(cell) },
                })),
              })),
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }
  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
};

export const appendSpreadsheetRows = async (
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rows: any[][]
): Promise<any> => {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to append rows to Google Sheet');
  }
  return await res.json();
};

/**
 * GOOGLE CALENDAR API CALLS
 */
export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export const listCalendarEvents = async (accessToken: string): Promise<CalendarEventItem[]> => {
  const timeMin = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime&maxResults=20`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch Calendar events');
  }
  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (
  accessToken: string,
  job: Job,
  techName: string
): Promise<CalendarEventItem> => {
  // Parse slot e.g. "10:00 AM – 12:00 PM"
  const dateStr = job.appointmentDate;
  let startHour = 10;
  let endHour = 12;

  if (job.appointmentSlot.includes('09:00')) {
    startHour = 9;
    endHour = 11;
  } else if (job.appointmentSlot.includes('02:00')) {
    startHour = 14;
    endHour = 16;
  } else if (job.appointmentSlot.includes('04:00')) {
    startHour = 16;
    endHour = 18;
  } else if (job.appointmentSlot.includes('06:00')) {
    startHour = 18;
    endHour = 20;
  }

  const startIso = `${dateStr}T${String(startHour).padStart(2, '0')}:00:00+05:30`;
  const endIso = `${dateStr}T${String(endHour).padStart(2, '0')}:00:00+05:30`;

  const eventPayload = {
    summary: `Furniture Fix: ${job.items.map((i) => i.name).join(', ')} (${job.customer.name})`,
    description: `Job ID: ${job.id}\nCustomer: ${job.customer.name}\nPhone: ${job.customer.mobile}\nAddress: ${job.customer.address}, ${job.customer.locality}\nEstimated Amount: ₹${job.finalTotal}\nAssigned Tech: ${techName}\nPayment Terms: Pay after completion via Cash or UPI`,
    location: `${job.customer.address}, ${job.customer.locality}, Mumbai, India`,
    start: { dateTime: startIso },
    end: { dateTime: endIso },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to add event to Google Calendar');
  }
  return await res.json();
};

export const deleteCalendarEvent = async (accessToken: string, eventId: string): Promise<void> => {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete Calendar event');
  }
};

/**
 * GMAIL API CALLS
 */
export interface GmailMessageHeader {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const listGmailMessages = async (accessToken: string): Promise<GmailMessageHeader[]> => {
  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=subject:(Furniture OR Booking OR Receipt OR "Furniture Fix")',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Gmail messages');
  }
  const data = await res.json();
  const list = data.messages || [];

  // Fetch headers for each message
  const details = await Promise.all(
    list.slice(0, 8).map(async (m: { id: string; threadId: string }) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!itemRes.ok) return { id: m.id, threadId: m.threadId };
        const itemData = await itemRes.json();
        const headers = itemData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        return {
          id: m.id,
          threadId: m.threadId,
          snippet: itemData.snippet,
          subject,
          from,
          date,
        };
      } catch {
        return { id: m.id, threadId: m.threadId };
      }
    })
  );

  return details;
};

// Base64Url encoder for RFC 2822 email format
const base64UrlEncode = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const sendGmailMessage = async (
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<any> => {
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    bodyText,
  ];
  const rawEmail = emailLines.join('\r\n');
  const encodedRaw = base64UrlEncode(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedRaw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to send email via Gmail');
  }
  return await res.json();
};
