import fs from 'fs';
import path from 'path';

let credentialsLoaded = false;

export function loadDynamicCredentials() {
  if (credentialsLoaded) return;

  const possibleDirs = [
    path.join(process.cwd(), 'secrets'),
    path.join(process.cwd(), 'src', 'secrets'),
    path.join(process.cwd(), 'credentials'),
    path.join(process.cwd(), 'src', 'credentials'),
  ];

  for (const dir of possibleDirs) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      // 1. Scan for any JSON file in this directory
      const files = fs.readdirSync(dir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(dir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const json = JSON.parse(content);
          
          if (json.private_key && json.client_email) {
            // Load into process.env if they are not already set
            if (!process.env.FIREBASE_PRIVATE_KEY) {
              process.env.FIREBASE_PRIVATE_KEY = json.private_key;
            }
            if (!process.env.FIREBASE_CLIENT_EMAIL) {
              process.env.FIREBASE_CLIENT_EMAIL = json.client_email;
            }
            if (json.project_id && !process.env.FIREBASE_PROJECT_ID) {
              process.env.FIREBASE_PROJECT_ID = json.project_id;
            }

            if (!process.env.GOOGLE_PRIVATE_KEY) {
              process.env.GOOGLE_PRIVATE_KEY = json.private_key;
            }
            if (!process.env.GOOGLE_CLIENT_EMAIL) {
              process.env.GOOGLE_CLIENT_EMAIL = json.client_email;
            }
            
            console.log(`[Credentials Helper] Successfully loaded dynamic credentials from: ${filePath}`);
            credentialsLoaded = true;
            break;
          }
        } catch (e: any) {
          console.warn(`[Credentials Helper] Failed to parse JSON file ${filePath}:`, e.message);
        }
      }

      // 2. Also check if there is a .env file inside this folder to load extra variables!
      const envPath = path.join(dir, '.env');
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf-8');
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const eqIdx = trimmed.indexOf('=');
              const key = trimmed.slice(0, eqIdx).trim();
              let val = trimmed.slice(eqIdx + 1).trim();
              if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
              if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
              
              if (key && !process.env[key]) {
                process.env[key] = val;
              }
            }
          }
          console.log(`[Credentials Helper] Successfully loaded extra env variables from: ${envPath}`);
        } catch (e: any) {
          console.warn(`[Credentials Helper] Failed to load .env file from secrets folder:`, e.message);
        }
      }

      if (credentialsLoaded) {
        break;
      }
    }
  }
}
