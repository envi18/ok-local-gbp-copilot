// src/lib/contentFetchingService.ts
/**
 * Content Fetching Service - Part 1 of 5
 * 
 * Fetches and analyzes website content using ScrapingBee
 * Uses regex-based HTML parsing for Netlify compatibility
 */

export interface WebsiteContent {
  url: string;
  pages: Page[];
  navigation: NavigationItem[];
  footer_links: string[];
  content_summary: string;
  metadata: WebsiteMetadata;
  scraped_at: string;
}

export interface Page {
  url: string;
  title: string;
  heading_structure: string[];
  main_topics: string[];
  word_count: number;
  has_schema: boolean;
  has_faq: boolean;
  has_reviews: boolean;
  has_process: boolean;
  meta_description?: string;
}

export interface NavigationItem {
  text: string;
  url: string;
  children?: NavigationItem[];
}

export interface WebsiteMetadata {
  title: string;
  description: string;
  has_schema: boolean;
  main_business_type: string;
  location_mentioned: string[];
  phone_numbers: string[];
  email_addresses: string[];
}

export class ContentFetchingService {
  private static SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY || '';

  /**
   * Fetch complete website content and structure
   */
  static async fetchWebsite(url: string): Promise<WebsiteContent> {
    console.log(`[ContentFetch] Starting fetch for: ${url}`);

    try {
      // Fetch homepage HTML
      const html = await this.scrapeWebsite(url);
      
      // Extract navigation
      const navigation = this.extractNavigation(html, url);
      
      // Extract all unique page URLs
      const pageUrls = this.extractPageUrls(html, url, navigation);
      
      // Limit to top 20 pages for performance
      const limitedUrls = pageUrls.slice(0, 20);
      
      console.log(`[ContentFetch] Found ${pageUrls.length} URLs, analyzing top ${limitedUrls.length}`);
      
      // Analyze each page
      const pages: Page[] = [];
      for (const pageUrl of limitedUrls) {
        try {
          const page = await this.analyzePage(pageUrl);
          pages.push(page);
          
          // Rate limit: 100ms between requests
          await this.sleep(100);
        } catch (error: any) {
          console.warn(`[ContentFetch] Failed to analyze ${pageUrl}:`, error.message);
        }
      }

      // Extract metadata
      const metadata = this.extractMetadata(html, url);
      
      // Generate content summary
      const content_summary = this.summarizeContent(pages);

      console.log(`[ContentFetch] Successfully analyzed ${pages.length} pages from ${url}`);

      return {
        url,
        pages,
        navigation,
        footer_links: this.extractFooterLinks(html),
        content_summary,
        metadata,
        scraped_at: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error(`[ContentFetch] Error fetching ${url}:`, error.message);
      throw new Error(`Failed to fetch website: ${error.message}`);
    }
  }

  /**
   * Scrape website using ScrapingBee
   */
  private static async scrapeWebsite(url: string): Promise<string> {
    if (!this.SCRAPINGBEE_API_KEY) {
      throw new Error('ScrapingBee API key not configured');
    }

    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?` +
      `api_key=${this.SCRAPINGBEE_API_KEY}` +
      `&url=${encodeURIComponent(url)}` +
      `&render_js=false` +
      `&premium_proxy=false` +
      `&country_code=us`;

    const response = await fetch(scrapingBeeUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`ScrapingBee error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    if (html.length < 500) {
      throw new Error('Response too short, likely blocked or invalid');
    }

    return html;
  }

  // Part 2 of 5 - Add after Part 1

  /**
   * Extract navigation structure
   */
  private static extractNavigation(html: string, baseUrl: string): NavigationItem[] {
    const nav: NavigationItem[] = [];
    
    // Extract navigation links using regex
    const navRegex = /<nav[^>]*>(.*?)<\/nav>/is;
    const navMatch = html.match(navRegex);
    
    if (navMatch) {
      const navHtml = navMatch[1];
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
      let linkMatch;
      
      const seenUrls = new Set<string>();
      
      while ((linkMatch = linkRegex.exec(navHtml)) !== null && nav.length < 15) {
        const href = linkMatch[1];
        const text = linkMatch[2].trim();

        if (text && href && href.length > 1 && !href.startsWith('#')) {
          const fullUrl = this.normalizeUrl(href, baseUrl);
          
          if (!seenUrls.has(fullUrl) && this.isInternalUrl(fullUrl, baseUrl)) {
            seenUrls.add(fullUrl);
            nav.push({ text, url: fullUrl });
          }
        }
      }
    }

    return nav;
  }

  /**
   * Extract all page URLs from the site
   */
  private static extractPageUrls(
    html: string,
    baseUrl: string,
    navigation: NavigationItem[]
  ): string[] {
    const urls = new Set<string>();

    // Add navigation URLs
    navigation.forEach(item => urls.add(item.url));

    // Extract all internal links using regex
    const linkRegex = /href=["']([^"']+)["']/g;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (href && href.length > 1 && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const fullUrl = this.normalizeUrl(href, baseUrl);
        if (this.isInternalUrl(fullUrl, baseUrl)) {
          urls.add(fullUrl);
        }
      }
    }

    // Filter out non-content pages
    return Array.from(urls).filter(pageUrl => {
      try {
        const path = new URL(pageUrl).pathname.toLowerCase();
        const excluded = [
          '/cart', '/checkout', '/login', '/register', '/account',
          '.pdf', '.jpg', '.png', '.gif', '.css', '.js',
          '/tag/', '/category/', '/author/'
        ];
        return !excluded.some(ex => path.includes(ex));
      } catch {
        return false;
      }
    });
  }

  /**
   * Extract footer links
   */
  private static extractFooterLinks(html: string): string[] {
    const links: string[] = [];
    
    const footerRegex = /<footer[^>]*>(.*?)<\/footer>/is;
    const footerMatch = html.match(footerRegex);
    
    if (footerMatch) {
      const footerHtml = footerMatch[1];
      const linkRegex = /<a[^>]*>([^<]+)<\/a>/gi;
      let linkMatch;
      
      while ((linkMatch = linkRegex.exec(footerHtml)) !== null && links.length < 10) {
        const text = linkMatch[1].trim();
        if (text) {
          links.push(text);
        }
      }
    }

    return Array.from(new Set(links));
  }

  /**
   * Analyze a single page
   */
  private static async analyzePage(pageUrl: string): Promise<Page> {
    const html = await this.scrapeWebsite(pageUrl);

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : 
                  h1Match ? h1Match[1].trim() : 
                  'Untitled Page';

    // Extract heading structure
    const heading_structure = this.extractHeadings(html);

    // Extract main topics
    const main_topics = this.extractTopics(html);

    // Count words
    const word_count = this.countWords(html);

    // Check for features
    const has_schema = html.includes('"@type"') || html.includes('itemtype=');
    const has_faq = this.hasFAQSection(html);
    const has_reviews = this.hasReviewSection(html);
    const has_process = this.hasProcessExplanation(html);

    // Meta description
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const meta_description = metaMatch ? metaMatch[1] : '';

    return {
      url: pageUrl,
      title,
      heading_structure,
      main_topics,
      word_count,
      has_schema,
      has_faq,
      has_reviews,
      has_process,
      meta_description
    };
  }

// Part 3 of 5 - Add after Part 2

  /**
   * Extract heading structure
   */
  private static extractHeadings(html: string): string[] {
    const headings: string[] = [];
    
    // Extract H1-H3 headings using regex
    const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
    const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
    const h3Regex = /<h3[^>]*>([^<]+)<\/h3>/gi;
    
    let match;
    
    while ((match = h1Regex.exec(html)) !== null && headings.length < 20) {
      const text = match[1].trim();
      if (text && text.length > 2 && text.length < 200) {
        headings.push(`H1: ${text}`);
      }
    }
    
    while ((match = h2Regex.exec(html)) !== null && headings.length < 20) {
      const text = match[1].trim();
      if (text && text.length > 2 && text.length < 200) {
        headings.push(`H2: ${text}`);
      }
    }
    
    while ((match = h3Regex.exec(html)) !== null && headings.length < 20) {
      const text = match[1].trim();
      if (text && text.length > 2 && text.length < 200) {
        headings.push(`H3: ${text}`);
      }
    }

    return headings;
  }

  /**
   * Extract main topics from page content
   */
  private static extractTopics(html: string): string[] {
    // Get all text content (remove HTML tags)
    const text = html.replace(/<[^>]+>/g, ' ').toLowerCase();
    
    // Remove common words (stop words)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'including', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'our', 'we', 'us', 'you', 'your'
    ]);

    // Extract words
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    
    // Count frequency
    const frequency: Record<string, number> = {};
    words.forEach((word: string) => {
      if (!stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // Sort by frequency and get top topics
    const topics = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);

    return topics;
  }

  /**
   * Count words in page
   */
  private static countWords(html: string): number {
    const text = html.replace(/<[^>]+>/g, ' ');
    const words = text.match(/\b\w+\b/g) || [];
    return words.length;
  }

  /**
   * Detect FAQ section
   */
  private static hasFAQSection(html: string): boolean {
    // Check schema markup
    if (html.includes('FAQPage') || html.includes('"@type":"Question"')) {
      return true;
    }

    // Check headings
    const headingRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      const text = match[1].toLowerCase();
      if (text.match(/faq|frequently asked|questions|q&a/)) {
        return true;
      }
    }

    // Check for accordion/collapse patterns
    return html.toLowerCase().includes('class="accordion"') ||
           html.toLowerCase().includes('class="faq-item"');
  }

  /**
   * Detect review section
   */
  private static hasReviewSection(html: string): boolean {
    // Check schema markup
    if (html.includes('"@type":"Review"') || html.includes('aggregateRating')) {
      return true;
    }

    // Check for review classes
    return html.toLowerCase().includes('class="review') ||
           html.toLowerCase().includes('class="testimonial') ||
           html.toLowerCase().includes('customer-review');
  }

  /**
   * Detect process explanation
   */
  private static hasProcessExplanation(html: string): boolean {
    // Check for common process patterns in headings
    const headingRegex = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi;
    let match;
    
    while ((match = headingRegex.exec(html)) !== null) {
      const text = match[1].toLowerCase();
      if (text.match(/how it works|our process|how we work|process|step[s]?|procedure/)) {
        return true;
      }
    }

    // Check for numbered steps or process items
    const hasSteps = (html.match(/class="step/gi) || []).length >= 3 ||
                    (html.match(/class="process-item/gi) || []).length >= 3;

    // Check for HowTo schema
    const hasHowToSchema = html.includes('"@type":"HowTo"');

    return hasSteps || hasHowToSchema;
  }  

  // Part 4 of 5 - Add after Part 3

  /**
   * Extract website metadata
   */
  private static extractMetadata(
    html: string,
    siteUrl: string
  ): WebsiteMetadata {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1].trim() : 
                  ogTitleMatch ? ogTitleMatch[1] : 
                  '';
    
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1] : 
                       ogDescMatch ? ogDescMatch[1] : 
                       '';

    const has_schema = html.includes('"@type"');

    // Extract business type from schema if present
    let main_business_type = '';
    const schemaMatch = html.match(/"@type":\s*"([^"]+)"/);
    if (schemaMatch) {
      main_business_type = schemaMatch[1];
    }

    // Extract location mentions
    const location_mentioned: string[] = [];
    const locationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/g;
    let locationMatch;
    while ((locationMatch = locationPattern.exec(html)) !== null && location_mentioned.length < 3) {
      location_mentioned.push(locationMatch[1]);
    }

    // Extract phone numbers
    const phone_numbers: string[] = [];
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    let phoneMatch;
    while ((phoneMatch = phonePattern.exec(html)) !== null && phone_numbers.length < 2) {
      phone_numbers.push(phoneMatch[0]);
    }

    // Extract email addresses
    const email_addresses: string[] = [];
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let emailMatch;
    while ((emailMatch = emailPattern.exec(html)) !== null && email_addresses.length < 2) {
      email_addresses.push(emailMatch[0]);
    }

    return {
      title,
      description,
      has_schema,
      main_business_type,
      location_mentioned: Array.from(new Set(location_mentioned)),
      phone_numbers: Array.from(new Set(phone_numbers)),
      email_addresses: Array.from(new Set(email_addresses))
    };
  }

  /**
   * Summarize website content
   */
  private static summarizeContent(pages: Page[]): string {
    const totalPages = pages.length;
    const totalWords = pages.reduce((sum, p) => sum + p.word_count, 0);
    const avgWords = Math.round(totalWords / Math.max(totalPages, 1));
    
    const hasFAQ = pages.some(p => p.has_faq);
    const hasReviews = pages.some(p => p.has_reviews);
    const hasProcess = pages.some(p => p.has_process);
    const hasSchema = pages.some(p => p.has_schema);

    const features: string[] = [];
    if (hasFAQ) features.push('FAQ section');
    if (hasReviews) features.push('customer reviews');
    if (hasProcess) features.push('process explanation');
    if (hasSchema) features.push('schema markup');

    return `Website has ${totalPages} pages with average of ${avgWords} words per page. ` +
           (features.length > 0 ? `Features: ${features.join(', ')}.` : 'Limited features detected.');
  }

  // Part 5 of 5 - Add after Part 4 and close the class

  /**
   * Normalize URL
   */
  private static normalizeUrl(href: string, baseUrl: string): string {
    try {
      const base = new URL(baseUrl);
      const url = new URL(href, base);
      return url.toString();
    } catch {
      return baseUrl + href;
    }
  }

  /**
   * Check if URL is internal
   */
  private static isInternalUrl(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(baseUrl);
      return urlObj.hostname === baseObj.hostname;
    } catch {
      return false;
    }
  }

  /**
   * Sleep helper
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}