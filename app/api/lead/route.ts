import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { scrapeWebsite } from '@/services/scraper-service';
import { generateAIReport } from '@/services/ai-service';
import { generatePDF } from '@/services/pdf-service';
import { appendLeadToSheet, updateLeadStatusInSheet } from '@/services/sheets-service';
import { uploadPDFToDrive } from '@/services/drive-service';
import { sendReportEmail } from '@/services/email-service';
import { Lead } from '@/types';
import crypto from 'crypto';

// This handles the background processing of a lead
async function processLeadWorkflow(lead: Lead) {
  const updateFirestoreStatus = async (status: string, extraData: any = {}) => {
    try {
      await adminDb.collection('leads').doc(lead.id!).update({ status, updatedAt: new Date().toISOString(), ...extraData });
    } catch (e: any) {
      console.warn("Skipping Firestore status update due to error:", e.message);
    }
  };

  const saveReportToFirestore = async (reportData: any) => {
    try {
      const reportRef = adminDb.collection('reports').doc();
      await reportRef.set({ leadId: lead.id, ...reportData, createdAt: new Date().toISOString() });
    } catch (e: any) {
      console.warn("Skipping Firestore report save due to error:", e.message);
    }
  };

  const logErrorToFirestore = async (errorMsg: string) => {
    try {
      await adminDb.collection('logs').add({ leadId: lead.id, error: errorMsg, timestamp: new Date().toISOString() });
    } catch (e: any) {
      console.warn("Skipping Firestore log save due to error:", e.message);
    }
  };

  try {
    // 1. Update status to SCRAPING
    await updateFirestoreStatus('SCRAPING');
    await updateLeadStatusInSheet(lead.email, 'SCRAPING');
    
    // Scrape website
    const scrapedData = await scrapeWebsite(lead.website);

    // 2. Update status to GENERATING_REPORT
    await updateFirestoreStatus('GENERATING_REPORT');
    await updateLeadStatusInSheet(lead.email, 'GENERATING_REPORT');
    
    // Generate AI Report
    const reportData = await generateAIReport(lead.company, lead.website, scrapedData);

    // Save report to firestore
    await saveReportToFirestore(reportData);

    // 3. Update status to PDF_CREATED
    await updateFirestoreStatus('PDF_CREATED', { reportSummary: reportData.insights });
    await updateLeadStatusInSheet(lead.email, 'PDF_CREATED');

    // Generate PDF
    const pdfBuffer = await generatePDF(reportData);

    // Upload to Drive
    const driveLink = await uploadPDFToDrive(lead.company, pdfBuffer);
    
    if (driveLink) {
      console.log(`[Google Drive] PDF archived successfully: ${driveLink}`);
      await updateFirestoreStatus('PDF_CREATED', { pdfUrl: driveLink });
    } else {
      console.warn("[Google Drive] Failed to archive PDF. Continuing email delivery without Drive link.");
    }

    // 4. Send Email
    const emailSent = await sendReportEmail(lead.email, lead.name, lead.company, pdfBuffer);

    // 5. Final Status Update
    if (emailSent) {
      await updateFirestoreStatus('EMAILED');
      await updateLeadStatusInSheet(lead.email, 'EMAILED');
    } else {
      throw new Error('Email sending failed');
    }

  } catch (error: any) {
    console.error(`Workflow failed for lead ${lead.id}:`, error);
    
    // Update status to FAILED
    await updateFirestoreStatus('FAILED');
    await updateLeadStatusInSheet(lead.email, 'FAILED');
    
    // Log error
    await logErrorToFirestore(error.message || 'Unknown error');
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, company, website, message } = body;

    if (!name || !email || !company || !website) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if lead already exists to prevent duplicate submits gracefully
    let isDuplicate = false;
    try {
      const existingLead = await adminDb.collection('leads').where('email', '==', email).get();
      if (!existingLead.empty) {
        isDuplicate = true;
      }
    } catch (e: any) {
      console.warn("Skipping duplicate check due to Firestore error:", e.message);
    }

    if (isDuplicate) {
      return NextResponse.json({ error: 'A report has already been requested for this email.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const leadId = crypto.randomUUID();

    const newLead: Lead = {
      id: leadId,
      name,
      email,
      company,
      website,
      message: message || '',
      status: 'PROCESSING',
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore gracefully
    try {
      await adminDb.collection('leads').doc(leadId).set(newLead);
    } catch (e: any) {
      console.warn("Skipping Firestore save due to error:", e.message);
    }

    // Append to Google Sheets gracefully
    try {
      await appendLeadToSheet(newLead);
    } catch (e: any) {
      console.warn("Skipping Google Sheets append due to error:", e.message);
    }

    // Start background workflow asynchronously
    processLeadWorkflow(newLead);

    return NextResponse.json({ 
      success: true, 
      message: 'Lead received and processing started',
      leadId
    }, { status: 202 });

  } catch (error: any) {
    console.error('Error handling lead submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
