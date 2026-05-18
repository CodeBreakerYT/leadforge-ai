import { google } from 'googleapis';
import { Readable } from 'stream';
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
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function uploadPDFToDrive(
  companyName: string, 
  pdfBuffer: Buffer
): Promise<string | null> {
  try {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID is not defined');
    }

    const fileMetadata = {
      name: `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Growth_Report.pdf`,
      parents: [folderId],
    };

    // Convert Buffer to Readable Stream
    const media = {
      mimeType: 'application/pdf',
      body: Readable.from(pdfBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
      supportsAllDrives: true,
    });

    if (file.data.id) {
      // Make it readable by anyone with the link
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
    }

    return file.data.webViewLink || null;
  } catch (error) {
    console.error('Failed to upload PDF to Google Drive:', error);
    return null;
  }
}
