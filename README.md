# LeadForge AI

LeadForge AI is a fully automated, AI-powered lead intake and processing platform built with Next.js 15, Firebase, Google Gemini, and Puppeteer. It captures leads, scrapes their websites, generates personalized growth audits, creates professional PDFs, uploads them to Google Drive, and emails them automatically.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Firebase Firestore (Client & Admin SDK)
- Google Gemini 1.5 Flash
- Puppeteer Core & Sparticuz Chromium (for Vercel support)
- Resend API (Email Delivery)
- Google Sheets & Drive API

## Architecture Overview
1. **Frontend**: A modern Next.js landing page with a lead capture form.
2. **API Orchestrator (`/api/lead`)**: Receives the form submission and immediately returns a 202 response, then continues processing the heavy workflow asynchronously.
3. **Services**:
   - `scraper-service`: Uses Cheerio to extract text, headings, and metadata from the lead's website.
   - `ai-service`: Uses Google Gemini 1.5 Flash to generate structured, personalized insights and recommendations based on the scraped data.
   - `pdf-service`: Uses Puppeteer to generate a beautiful, styled PDF report.
   - `drive-service`: Uploads the generated PDF to a Google Drive folder.
   - `sheets-service`: Appends the lead data and updates its status in a Google Sheet.
   - `email-service`: Uses Resend to email the PDF report to the lead.

## Local Setup

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in the values:

- **Firebase**: Go to Firebase Console -> Project Settings -> General (for client keys). For the Admin SDK, go to Service Accounts and generate a new private key JSON. Extract `project_id`, `client_email`, and `private_key`.
- **Google APIs (Sheets & Drive)**: 
  - Create a Service Account in Google Cloud Console.
  - Enable Google Sheets API and Google Drive API.
  - Share your target Google Sheet and Google Drive Folder with the Service Account email.
- **Gemini API**: Get a free API key from Google AI Studio.
- **Resend API**: Get an API key from Resend.com.

> **Note on Private Keys**: Ensure your private keys in `.env` are wrapped in quotes if they contain `\n`. The codebase automatically handles `\n` replacements.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

## Deployment Guide (Vercel)

### 1. Vercel Configuration
This project is ready to be deployed to Vercel. However, since the PDF generation requires Chromium, we use `@sparticuz/chromium`.

- Connect your GitHub repository to Vercel.
- Add all environment variables in the Vercel project settings.
- Deploy.

### 2. Serverless Function Timeouts
> [!WARNING]
> The complete workflow (Scrape -> AI -> PDF -> Drive -> Email) can take 10-25 seconds depending on website response times and AI generation speed.
> Vercel's **Hobby (Free) Tier** has a hard limit of 10 seconds for Serverless Functions. If you are on the free tier, the background process might be killed before the email is sent.
> **Solution**: Upgrade to Vercel Pro (60s+ limit) or offload the background processing to a queue like Upstash QStash or Inngest.

## Database Structure (Firestore)

### `leads` collection
- `id`: string
- `name`: string
- `email`: string
- `company`: string
- `website`: string
- `status`: PROCESSING | SCRAPING | GENERATING_REPORT | PDF_CREATED | EMAILED | FAILED
- `createdAt`: ISO Date String
- `pdfUrl`: string (Drive Link)
- `reportSummary`: string

### `reports` collection
Stores the raw AI JSON output for each lead for historical reference.

### `logs` collection
Stores any errors encountered during the automated workflow.
