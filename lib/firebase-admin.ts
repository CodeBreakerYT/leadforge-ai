import * as admin from 'firebase-admin';
import { loadDynamicCredentials } from './credentials-helper';

if (!admin.apps.length) {
  try {
    loadDynamicCredentials();
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Initialize with service account credentials if available, otherwise fallback to application default credentials
    if (process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

let adminDb: admin.firestore.Firestore;

try {
  adminDb = admin.firestore();
} catch (error: any) {
  console.warn('Failed to initialize real Firestore instance, using mock fallback. Error:', error.message);
  
  // Provide a safe mock Firestore interface to prevent any route crashes
  adminDb = {
    collection: (collectionName: string) => {
      const mockDoc = (docId?: string) => ({
        set: async (data: any) => {
          console.log(`[Mock Firestore] Saved doc in ${collectionName}/${docId || 'auto-id'}`);
          return {};
        },
        update: async (data: any) => {
          console.log(`[Mock Firestore] Updated doc in ${collectionName}/${docId || 'auto-id'}`);
          return {};
        },
        get: async () => ({
          exists: false,
          data: () => null,
        }),
      });

      return {
        doc: mockDoc,
        add: async (data: any) => {
          console.log(`[Mock Firestore] Added doc in ${collectionName}`);
          return { id: 'mock-id' };
        },
        where: () => ({
          get: async () => ({
            empty: true,
            docs: [],
          }),
        }),
      } as any;
    },
  } as any;
}

export { adminDb, admin };
