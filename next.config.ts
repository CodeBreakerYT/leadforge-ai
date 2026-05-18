import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Dynamic secrets loader for Next.js early boot phase
const possibleDirs = [
  path.join(process.cwd(), 'secrets'),
  path.join(process.cwd(), 'src', 'secrets'),
  path.join(process.cwd(), 'credentials'),
  path.join(process.cwd(), 'src', 'credentials'),
];

for (const dir of possibleDirs) {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    // 1. Load .env if present in the secrets folder
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
        console.log(`[NextConfig] Successfully pre-loaded env variables from secrets: ${envPath}`);
      } catch (e: any) {
        console.warn(`[NextConfig] Failed to load secrets .env:`, e.message);
      }
    }

    // 2. Load JSON service account key if present in secrets folder
    try {
      const files = fs.readdirSync(dir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      for (const file of jsonFiles) {
        const filePath = path.join(dir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const json = JSON.parse(content);
          if (json.private_key && json.client_email) {
            if (!process.env.FIREBASE_PRIVATE_KEY) process.env.FIREBASE_PRIVATE_KEY = json.private_key;
            if (!process.env.FIREBASE_CLIENT_EMAIL) process.env.FIREBASE_CLIENT_EMAIL = json.client_email;
            if (json.project_id && !process.env.FIREBASE_PROJECT_ID) process.env.FIREBASE_PROJECT_ID = json.project_id;
            if (!process.env.GOOGLE_PRIVATE_KEY) process.env.GOOGLE_PRIVATE_KEY = json.private_key;
            if (!process.env.GOOGLE_CLIENT_EMAIL) process.env.GOOGLE_CLIENT_EMAIL = json.client_email;
            console.log(`[NextConfig] Successfully pre-loaded Google credentials from secrets: ${filePath}`);
            break;
          }
        } catch (e: any) {
          // Skip
        }
      }
    } catch (e: any) {
      // Skip
    }
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

