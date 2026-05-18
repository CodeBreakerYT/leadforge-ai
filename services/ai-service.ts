import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScrapedData } from './scraper-service';
import { ReportData } from '../types';

export async function generateAIReport(companyName: string, website: string, scrapedData: ScrapedData): Promise<ReportData> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      You are an expert business consultant, technical SEO auditor, and marketing strategist.
      I have scraped the website of a company named "${companyName}" (${website}).
      
      Here is the scraped data:
      Title: ${scrapedData.title}
      Meta Description: ${scrapedData.metaDescription}
      Headings: ${scrapedData.headings.join(' | ')}
      Company Info: ${scrapedData.companyInfo}
      Visible Content (Snippet): ${scrapedData.visibleText.substring(0, 3000)}

      Based on this information, perform a comprehensive audit and provide personalized insights. 
      Do NOT use generic AI wording. Be professional, contextual, and business-aware.
      
      You must respond ONLY with a valid JSON object matching this exact structure, with no markdown formatting or extra text outside the JSON block:
      {
        "niche": "A short sentence describing their exact business niche and target audience.",
        "insights": "2-3 paragraphs of personalized insights on their current market positioning and initial impressions of their website.",
        "seoRecommendations": "A detailed paragraph on SEO recommendations based on their title, meta description, and headings.",
        "uxSuggestions": "A detailed paragraph suggesting specific UX improvements to make the site more modern and usable.",
        "growthOpportunities": "A detailed paragraph highlighting 2-3 specific growth opportunities or features they could add to increase revenue.",
        "conversionOptimization": "A detailed paragraph with actionable steps to improve their conversion rate based on typical best practices for their niche.",
        "technicalRecommendations": "A short paragraph with technical recommendations (e.g., performance, accessibility, security)."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting (e.g., ```json ... ```)
    if (text.startsWith('```json')) {
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedData = JSON.parse(text);

    return {
      company: companyName,
      website: website,
      niche: parsedData.niche || 'General Business',
      insights: parsedData.insights || 'No insights generated.',
      seoRecommendations: parsedData.seoRecommendations || 'No SEO recommendations.',
      uxSuggestions: parsedData.uxSuggestions || 'No UX suggestions.',
      growthOpportunities: parsedData.growthOpportunities || 'No growth opportunities.',
      conversionOptimization: parsedData.conversionOptimization || 'No conversion optimizations.',
      technicalRecommendations: parsedData.technicalRecommendations || 'No technical recommendations.'
    };
  } catch (error: any) {
    console.error('AI generation failed:', error);
    // Fallback response
    return {
      company: companyName,
      website: website,
      niche: 'Unable to analyze niche due to limited data.',
      insights: 'We encountered an error while generating deep insights for your website. Our team has been notified.',
      seoRecommendations: 'Ensure your title and meta descriptions are descriptive and keyword-rich.',
      uxSuggestions: 'Focus on clear calls-to-action and mobile responsiveness.',
      growthOpportunities: 'Explore content marketing and targeted social media campaigns.',
      conversionOptimization: 'Simplify your forms and reduce friction in the user journey.',
      technicalRecommendations: 'Ensure fast load times and proper SSL configuration.'
    };
  }
}
