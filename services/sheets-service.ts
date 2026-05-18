import { google } from 'googleapis';
import { Lead } from '../types';
import { loadDynamicCredentials } from '../lib/credentials-helper';

function getAuthClient() {
  loadDynamicCredentials();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function appendLeadToSheet(lead: Lead): Promise<boolean> {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID is not defined');
    }

    const rowData = [
      lead.name,
      lead.email,
      lead.company,
      lead.website,
      lead.createdAt,
      lead.status,
    ];

    let response;
    try {
      response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:F', // Assuming default Sheet1
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });
    } catch (appendError: any) {
      console.warn("Failed to append to Sheet1!A:F, attempting generic A:F fallback...", appendError.message);
      response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A:F', // Fallback to whatever active sheet is
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });
    }

    return response.status === 200;
  } catch (error) {
    console.error('Failed to append lead to Google Sheets:', error);
    return false;
  }
}

export async function updateLeadStatusInSheet(email: string, newStatus: string): Promise<boolean> {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID is not defined');
    }

    // First find the row with this email
    let getResponse;
    let rangePrefix = 'Sheet1!';
    try {
      getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:F',
      });
    } catch (getError: any) {
      console.warn("Failed to read from Sheet1!A:F, attempting generic A:F fallback...", getError.message);
      getResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:F',
      });
      rangePrefix = '';
    }

    const rows = getResponse.data.values;
    if (!rows || rows.length === 0) {
      return false;
    }

    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][1] === email) { // Email is in column B (index 1)
        rowIndex = i + 1; // Sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return false; // Email not found
    }

    // Update the status (Column F)
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${rangePrefix}F${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[newStatus]],
        },
      });
    } catch (updateError: any) {
      console.warn(`Failed to update status on ${rangePrefix}F${rowIndex}, trying raw F${rowIndex} fallback...`, updateError.message);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `F${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[newStatus]],
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to update lead status in Google Sheets:', error);
    return false;
  }
}
