import { Resend } from 'resend';

export async function sendReportEmail(
  toEmail: string, 
  name: string, 
  company: string, 
  pdfBuffer: Buffer
): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    // Check if the API key is missing or is just a placeholder string like '""'
    if (!apiKey || apiKey === '""' || apiKey === "''") {
      console.warn('RESEND_API_KEY is missing. Skipping email send and pretending it succeeded.');
      return true; 
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'LeadForge AI <onboarding@resend.dev>', // Resend test domain
      to: toEmail,
      subject: `Your Custom AI Growth Report for ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f172a;">Hello ${name},</h2>
          <p>Thank you for requesting an AI-powered audit from LeadForge AI.</p>
          <p>Our AI has finished analyzing <strong>${company}</strong>'s online presence, and we've attached your personalized growth report to this email.</p>
          <p>Inside the report, you'll find:</p>
          <ul>
            <li>SEO and technical recommendations</li>
            <li>UX and design improvements</li>
            <li>Growth and conversion opportunities</li>
          </ul>
          <p>If you have any questions or want to discuss how we can help you implement these recommendations, simply reply to this email.</p>
          <br/>
          <p>Best regards,</p>
          <p><strong>The LeadForge AI Team</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `${company.replace(/[^a-zA-Z0-9]/g, '_')}_Growth_Report.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
