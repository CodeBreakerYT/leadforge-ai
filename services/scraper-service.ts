import * as cheerio from 'cheerio';

export interface ScrapedData {
  title: string;
  metaDescription: string;
  headings: string[];
  visibleText: string;
  links: string[];
  companyInfo: string;
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  try {
    // Add protocol if missing
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and other non-visible elements
    $('script, style, noscript, iframe, img, svg, video').remove();

    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || 
                            $('meta[property="og:description"]').attr('content')?.trim() || '';

    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 3) headings.push(text);
    });

    // Extract visible text from paragraphs and list items
    const visibleTextParts: string[] = [];
    $('p, li, span, div').each((_, el) => {
      const text = $(el).text().trim();
      // Only keep meaningful chunks
      if (text && text.length > 20 && !visibleTextParts.includes(text)) {
        visibleTextParts.push(text);
      }
    });
    
    // Limit visible text to avoid sending too much data to the AI
    const visibleText = visibleTextParts.join(' ').replace(/\s+/g, ' ').substring(0, 5000);

    const links: string[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) {
        links.push(href);
      }
    });

    const companyInfo = $('footer').text().replace(/\s+/g, ' ').trim().substring(0, 500) || '';

    return {
      title,
      metaDescription,
      headings: headings.slice(0, 10), // Take top 10 headings
      visibleText,
      links: [...new Set(links)].slice(0, 10), // 10 unique links
      companyInfo
    };

  } catch (error: any) {
    console.error(`Scraping failed for ${url}:`, error.message);
    
    // Fallback if scraping completely fails
    return {
      title: `Information about ${url}`,
      metaDescription: 'Website data could not be fully extracted.',
      headings: [],
      visibleText: 'Failed to scrape visible content. The website might have bot protection enabled or is unreachable.',
      links: [],
      companyInfo: 'N/A'
    };
  }
}
