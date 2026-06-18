import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();

const db = admin.firestore();

// Initialize the Gemini SDK if the environment key is provided
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// NodeMailer Setup - Update these with actual SMTP/OAuth settings in production
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'no-reply@lingoloop.com',
    pass: process.env.GMAIL_PASS || 'your-smtp-password',
  },
});

/**
 * Cloud Function Trigger: onCreate application
 * Sends a highly professional summary email to companies whenever a translator applies.
 */
export const onApplicationCreated = functions.firestore
  .document('applications/{appId}')
  .onCreate(async (snapshot, context) => {
    const appData = snapshot.data();
    if (!appData) {
      functions.logger.warn('No application data found.');
      return;
    }

    const {
      jobId,
      jobTitle,
      translatorName,
      translatorEmail,
      translatorLanguages = [],
      translatorRate = 'N/A',
      coverLetter,
      rateProposal,
      companyId,
    } = appData;

    try {
      // 1. Fetch Company profile to obtain native contact email address
      const companyDoc = await db.collection('profiles').doc(companyId).get();
      if (!companyDoc.exists) {
        functions.logger.error(`Company Profile with ID ${companyId} not found.`);
        return;
      }

      const companyData = companyDoc.data() || {};
      const companyEmail = companyData.email || 'partner-relations@lingoloop.com';
      const companyName = companyData.companyName || companyData.name || 'Hiring Department';

      // 2. Generate a translation-focused summary of the portfolio & bid using Gemini
      let summary = 'A new translator has applied to your localization brief.';
      if (ai) {
        try {
          const prompt = `
            You are a translation service manager. Summarize this candidate's application in exactly 3 bullet points.
            Candidate Name: ${translatorName}
            Languages: ${translatorLanguages.join(', ')}
            Stated Rate: ${translatorRate}
            Rate Proposal for this Job: ${rateProposal}
            Cover Letter:
            "${coverLetter}"

            Analyze their experience & suitability for the translation brief "${jobTitle}".
            Provide exactly 3 bullet points, clear, objective, and highlighting key qualifications.
          `;
          
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt,
          });
          
          if (response.text) {
            summary = response.text;
          }
        } catch (geminiErr: any) {
          functions.logger.error('Gemini summary compilation failed. Falling back to default layout.', geminiErr);
          summary = `
            • Language Pair Focus: ${translatorLanguages.join(', ') || 'Global pair'}
            • Stated Rate proposal: ${rateProposal} (vs general rate of ${translatorRate})
            • Stated experience outline: "${coverLetter.slice(0, 180)}..."
          `;
        }
      } else {
        // Simple structured fallback summary if AI key isn't set up yet
        summary = `
          • Candidate is focused in ${translatorLanguages.join(', ') || 'relevant language sets'}
          • Proposed a rate of ${rateProposal} for this specific brief
          • Cover cover/motivation excerpt: "${coverLetter.slice(0, 180)}..."
        `;
      }

      // 3. Draft the beautiful corporate styled email body
      const subject = `[LingoLoop Alert] New Application from ${translatorName} for: "${jobTitle}"`;
      
      const emailHtml = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f6f6f6;">
            <span style="font-size: 24px; font-weight: 800; color: #ff6b35; letter-spacing: -0.5px;">LingoLoop</span>
            <div style="font-size: 11px; color: #a0a0a0; margin-top: 4px; font-weight: 500; text-transform: uppercase; tracking: 0.5px;">Enterprise Localization Dispatch</div>
          </div>
          
          <h2 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-top: 0; line-height: 1.4;">
            Hi ${companyName},
          </h2>
          
          <p style="font-size: 14px; color: #4a4a4a; line-height: 1.6; margin-bottom: 20px;">
            A translator has successfully bid on your translation brief <strong>"${jobTitle}"</strong>.
          </p>

          <div style="background-color: #fffaf7; border: 1px solid #ffe8dd; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <h3 style="font-size: 12px; font-weight: 800; color: #e0531c; text-transform: uppercase; margin: 0 0 12px 0;">
              AI Candidate Evaluation Summary
            </h3>
            <div style="font-size: 13.5px; color: #2d2d2d; line-height: 1.6; padding-left: 12px; border-left: 2px solid #ff6b35;">
              ${summary.replace(/\n/g, '<br />')}
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f3f3f3;">
              <td style="padding: 8px 0; color: #7a7a7a; font-weight: 500;">Translator Name</td>
              <td style="padding: 8px 0; font-weight: 700; color: #1a1a1a; text-align: right;">${translatorName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f3f3;">
              <td style="padding: 8px 0; color: #7a7a7a; font-weight: 500;">Contact Email</td>
              <td style="padding: 8px 0; font-weight: 700; color: #1a1a1a; text-align: right;">
                <a href="mailto:${translatorEmail}" style="color: #ff6b35; text-decoration: none;">${translatorEmail}</a>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f3f3;">
              <td style="padding: 8px 0; color: #7a7a7a; font-weight: 500;">Rate Proposal</td>
              <td style="padding: 8px 0; font-weight: 750; color: #ff6b35; text-align: right;">${rateProposal}</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
            <a href="https://lingoloop.web.app/" style="background-color: #ff6b35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block;">
              Review Application Details
            </a>
          </div>

          <div style="text-align: center; font-size: 11px; color: #9c9c9c; border-t: 1px solid #f3f3f3; padding-top: 16px; margin-top: 32px;">
            This is an automated serverless trigger email compiled by LingoLoop Cloud Operations.<br />
            To configure notification frequencies, edit your LingoLoop Profile settings.
          </div>
        </div>
      `;

      // 4. Send the actual email
      await mailTransport.sendMail({
        from: '"LingoLoop Notifications" <no-reply@lingoloop.com>',
        to: companyEmail,
        subject: subject,
        html: emailHtml,
      });

      functions.logger.info(`Summary email sent to company ${companyEmail} for job ${jobId}`);

      // 5. Audit-log this notification to database
      await db.collection('notifications').add({
        companyId,
        applicationId: snapshot.id,
        translatorName,
        jobTitle,
        subject,
        summaryText: summary,
        htmlContent: emailHtml,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        toEmail: companyEmail,
      });

    } catch (err) {
      functions.logger.error('Error processing application trigger email: ', err);
    }
  });
