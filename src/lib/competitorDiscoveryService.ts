// src/lib/competitorDiscoveryService.ts
/**
 * Competitor Discovery Service
 * 
 * Discovers real competitor businesses using Google Custom Search API
 * Validates competitor websites and extracts basic information
 */

export interface CompetitorInfo {
  name: string;
  website: string;
  snippet: string;
  is_valid: boolean;
  business_type: string;
  location: string;
  detection_method: 'search' | 'manual';
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class CompetitorDiscoveryService {
  private static GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
  private static GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || '';

  /**
   * Find top competitors using Google Custom Search
   */
  static async findCompetitors(
    businessType: string,
    location: string,
    excludeUrl?: string,
    limit: number = 2
  ): Promise<CompetitorInfo[]> {
    console.log(`[CompetitorDiscovery] Searching for ${businessType} in ${location}`);

    try {
      // Build search query
      const query = `best ${businessType} in ${location}`;
      
      // Search Google
      const results = await this.searchGoogle(query);
      
      console.log(`[CompetitorDiscovery] Found ${results.length} initial results`);
      
      // Filter and validate results
      const competitors: CompetitorInfo[] = [];
      
      for (const result of results) {
        // Skip if this is the target business
        if (excludeUrl && this.isSameDomain(result.url, excludeUrl)) {
          console.log(`[CompetitorDiscovery] Skipping target business: ${result.url}`);
          continue;
        }
        
        // Validate competitor
        const competitor = await this.validateCompetitor(result, businessType, location);
        
        if (competitor.is_valid) {
          competitors.push(competitor);
          console.log(`[CompetitorDiscovery] Valid competitor found: ${competitor.name}`);
          
          // Stop when we have enough
          if (competitors.length >= limit) {
            break;
          }
        }
        
        // Rate limit between validations
        await this.sleep(500);
      }

      console.log(`[CompetitorDiscovery] Found ${competitors.length} valid competitors`);
      
      return competitors;
      
    } catch (error: any) {
      console.error('[CompetitorDiscovery] Error:', error.message);
      
      // Return empty array on error - don't fail the whole report
      return [];
    }
  }

  /**
   * Search Google using Custom Search API
   */
  private static async searchGoogle(query: string): Promise<SearchResult[]> {
    if (!this.GOOGLE_API_KEY || !this.GOOGLE_CX) {
      throw new Error('Google Custom Search API not configured');
    }

    const url = `https://www.googleapis.com/customsearch/v1?` +
      `key=${this.GOOGLE_API_KEY}` +
      `&cx=${this.GOOGLE_CX}` +
      `&q=${encodeURIComponent(query)}` +
      `&num=10`; // Get 10 results

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn('[CompetitorDiscovery] No search results found');
      return [];
    }

    return data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || ''
    }));
  }

  /**
   * Validate competitor is a real business website
   */
  private static async validateCompetitor(
    result: SearchResult,
    businessType: string,
    location: string
  ): Promise<CompetitorInfo> {
    try {
      // Check if URL is valid and not a directory/social site
      if (!this.isValidBusinessUrl(result.url)) {
        return {
          name: result.title,
          website: result.url,
          snippet: result.snippet,
          is_valid: false,
          business_type: businessType,
          location: location,
          detection_method: 'search'
        };
      }

      // Try to fetch the homepage (with timeout)
      const html = await this.fetchWithTimeout(result.url, 10000);
      
      // Validate it has business indicators
      const hasBusinessInfo = this.hasBusinessIndicators(html);
      
      if (!hasBusinessInfo) {
        console.log(`[CompetitorDiscovery] ${result.url} lacks business indicators`);
        return {
          name: result.title,
          website: result.url,
          snippet: result.snippet,
          is_valid: false,
          business_type: businessType,
          location: location,
          detection_method: 'search'
        };
      }

      // Extract business name
      const businessName = this.extractBusinessName(html, result.title);

      return {
        name: businessName,
        website: result.url,
        snippet: result.snippet,
        is_valid: true,
        business_type: businessType,
        location: location,
        detection_method: 'search'
      };
      
    } catch (error: any) {
      console.warn(`[CompetitorDiscovery] Validation failed for ${result.url}:`, error.message);
      
      // Mark as invalid but return the info we have
      return {
        name: result.title,
        website: result.url,
        snippet: result.snippet,
        is_valid: false,
        business_type: businessType,
        location: location,
        detection_method: 'search'
      };
    }
  }

  /**
   * Check if URL is valid business site (not directory/social)
   */
  private static isValidBusinessUrl(url: string): boolean {
    const invalidDomains = [
      'yelp.com',
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'linkedin.com',
      'yellowpages.com',
      'bbb.org',
      'mapquest.com',
      'google.com',
      'youtube.com',
      'thumbtack.com',
      'angi.com',
      'homeadvisor.com',
      'indeed.com',
      'glassdoor.com'
    ];

    const lowerUrl = url.toLowerCase();
    
    return !invalidDomains.some(domain => lowerUrl.includes(domain));
  }

  /**
   * Check if HTML has business indicators
   */
  private static hasBusinessIndicators(html: string): boolean {
    // Must have substantial content
    if (html.length < 1000) {
      return false;
    }

    // Look for business indicators
    const indicators = [
      // Phone number pattern
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      // Email pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      // Schema.org business types
      /"@type":\s*"(LocalBusiness|Organization|Service|ProfessionalService)"/,
      // Common business sections
      /(contact|about|services|pricing|quote)/i,
      // Address pattern
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)/i
    ];

    // Count how many indicators are present
    let indicatorCount = 0;
    for (const pattern of indicators) {
      if (pattern.test(html)) {
        indicatorCount++;
      }
    }

    // Need at least 2 indicators to consider it a business site
    return indicatorCount >= 2;
  }

  /**
   * Extract business name from HTML
   */
  private static extractBusinessName(html: string, fallbackTitle: string): string {
    // Try schema markup first
    const schemaMatch = html.match(/"name":\s*"([^"]+)"/);
    if (schemaMatch && schemaMatch[1].length < 100) {
      return this.cleanBusinessName(schemaMatch[1]);
    }

    // Try meta title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      return this.cleanBusinessName(titleMatch[1]);
    }

    // Try H1
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return this.cleanBusinessName(h1Match[1]);
    }

    // Fallback to search result title
    return this.cleanBusinessName(fallbackTitle);
  }

  /**
   * Clean business name (remove common suffixes, separators)
   */
  private static cleanBusinessName(name: string): string {
    // Remove common separators and everything after
    let cleaned = name.split('|')[0].split('-')[0].split('–')[0].trim();
    
    // Remove common suffixes
    cleaned = cleaned.replace(/\s*(LLC|Inc|Corp|Ltd|Co\.|Company)\.?$/i, '').trim();
    
    // Remove location info in parentheses
    cleaned = cleaned.replace(/\s*\([^)]+\)$/, '').trim();
    
    // Limit length
    if (cleaned.length > 60) {
      cleaned = cleaned.substring(0, 60).trim() + '...';
    }

    return cleaned;
  }

  /**
   * Check if two URLs are the same domain
   */
  private static isSameDomain(url1: string, url2: string): boolean {
    try {
      const domain1 = new URL(url1).hostname.replace('www.', '');
      const domain2 = new URL(url2).hostname.replace('www.', '');
      return domain1 === domain2;
    } catch {
      return false;
    }
  }

  /**
   * Fetch URL with timeout
   */
  private static async fetchWithTimeout(url: string, timeout: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GBP-Content-Analyzer/1.0)'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Sleep helper
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate manually provided competitor URLs
   * (Alternative to search API for budget-conscious users)
   */
  static async validateManualCompetitors(
    urls: string[],
    businessType: string,
    location: string
  ): Promise<CompetitorInfo[]> {
    console.log(`[CompetitorDiscovery] Validating ${urls.length} manual competitor URLs`);

    const competitors: CompetitorInfo[] = [];

    for (const url of urls) {
      try {
        const html = await this.fetchWithTimeout(url, 10000);
        const name = this.extractBusinessName(html, url);
        const isValid = this.hasBusinessIndicators(html);

        competitors.push({
          name,
          website: url,
          snippet: '',
          is_valid: isValid,
          business_type: businessType,
          location: location,
          detection_method: 'manual'
        });

        await this.sleep(500);
      } catch (error: any) {
        console.warn(`[CompetitorDiscovery] Failed to validate ${url}:`, error.message);
        competitors.push({
          name: url,
          website: url,
          snippet: '',
          is_valid: false,
          business_type: businessType,
          location: location,
          detection_method: 'manual'
        });
      }
    }

    return competitors;
  }
}