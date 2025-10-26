// railway-backend/services/scrapingBee.js
// ENHANCED: Website content extraction with RETRY LOGIC and footer business name detection

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,           // Try 3 times total
  initialDelay: 2000,      // Start with 2 second delay
  maxDelay: 10000,         // Max 10 second delay
  timeoutMs: 60000,        // Increase timeout to 60 seconds
  backoffMultiplier: 2     // Double delay each retry
};

/**
 * Sleep helper for delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff
 */
function getRetryDelay(attemptNumber) {
  const delay = Math.min(
    RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber - 1),
    RETRY_CONFIG.maxDelay
  );
  return delay;
}

/**
 * Extract comprehensive website content for AI analysis
 * WITH RETRY LOGIC: Automatically retries on timeout or network errors
 * 
 * @param {string} url - Website URL to scrape
 * @returns {Promise<Object>} Extracted website data
 */
export async function extractWebsiteContent(url) {
  console.log(`🔍 Extracting content from: ${url}`);
  
  let lastError;
  
  // Retry loop
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = getRetryDelay(attempt);
        console.log(`   ⏳ Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries} after ${delay}ms delay...`);
        await sleep(delay);
      }
      
      // Call ScrapingBee API with increased timeout
      const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
        params: {
          api_key: process.env.SCRAPINGBEE_API_KEY,
          url: url,
          render_js: 'true',        // Enable JavaScript rendering
          premium_proxy: 'false',   // Use standard proxy (cheaper)
          country_code: 'us',
          wait: 3000                // Wait 3s for JS to execute
        },
        timeout: RETRY_CONFIG.timeoutMs  // 60 second timeout
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract domain from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');

      // Extract comprehensive data
      const websiteData = {
        url: url,
        domain: domain,
        html: html,
        
        // Basic metadata
        title: extractTitle($),
        meta_description: $('meta[name="description"]').attr('content') || '',
        
        // Schema.org structured data
        schema_data: extractSchemaData($),
        
        // Open Graph data
        og_data: extractOpenGraphData($),
        
        // Headings for content structure
        headings: extractHeadings($),
        
        // Text content
        text_content: extractTextContent($),
        
        // Contact information + FOOTER BUSINESS NAME
        contact_info: extractContactInfo($, html),
        
        // Services/products mentioned
        services: extractServices($, html),
        
        // About content
        about_content: extractAboutContent($, html),
        
        // Links
        internal_links: extractLinks($, domain, true),
        external_links: extractLinks($, domain, false),
        
        // Images
        images: extractImages($),
        
        extraction_timestamp: new Date().toISOString(),
        extraction_attempts: attempt  // Track how many attempts it took
      };

      console.log(`✅ Content extracted successfully (attempt ${attempt}/${RETRY_CONFIG.maxRetries})`);
      console.log(`   Title: ${websiteData.title}`);
      console.log(`   Footer Business Name: ${websiteData.contact_info.business_name_from_footer?.from_copyright || 'Not found'}`);
      console.log(`   Text length: ${websiteData.text_content.length} chars`);
      console.log(`   Services found: ${websiteData.services.length}`);
      
      return websiteData;

    } catch (error) {
      lastError = error;
      
      // Determine if error is retryable
      const isRetryable = isRetryableError(error);
      const isLastAttempt = attempt === RETRY_CONFIG.maxRetries;
      
      if (isRetryable && !isLastAttempt) {
        console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message}`);
        console.log(`   🔄 Will retry... (${RETRY_CONFIG.maxRetries - attempt} attempts remaining)`);
        continue; // Try again
      } else {
        // Either not retryable, or we're out of retries
        if (!isRetryable) {
          console.error(`   ❌ Non-retryable error: ${error.message}`);
        } else {
          console.error(`   ❌ All ${RETRY_CONFIG.maxRetries} attempts failed: ${error.message}`);
        }
        break; // Exit retry loop
      }
    }
  }
  
  // If we get here, all retries failed
  throw new Error(`Failed to extract website content after ${RETRY_CONFIG.maxRetries} attempts: ${lastError.message}`);
}

/**
 * Determine if an error is retryable
 * Timeout, network errors, and 5xx errors are retryable
 * 4xx errors (except 429 rate limit) are not retryable
 */
function isRetryableError(error) {
  // Timeout errors - always retry
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return true;
  }
  
  // Network errors - always retry
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    
    // 5xx server errors - retry
    if (status >= 500) {
      return true;
    }
    
    // 429 rate limit - retry
    if (status === 429) {
      return true;
    }
    
    // 408 request timeout - retry
    if (status === 408) {
      return true;
    }
    
    // 4xx client errors (except 429) - don't retry
    if (status >= 400 && status < 500) {
      return false;
    }
  }
  
  // Unknown errors - retry to be safe
  return true;
}

/**
 * Extract page title with fallbacks
 */
function extractTitle($) {
  return $('title').text().trim() ||
         $('h1').first().text().trim() ||
         $('meta[property="og:title"]').attr('content') ||
         'Untitled';
}

/**
 * Extract Schema.org JSON-LD data
 */
function extractSchemaData($) {
  const schemaData = [];
  
  $('script[type="application/ld+json"]').each((i, elem) => {
    try {
      const data = JSON.parse($(elem).html());
      schemaData.push(data);
    } catch (e) {
      // Invalid JSON, skip
    }
  });
  
  return schemaData;
}

/**
 * Extract Open Graph metadata
 */
function extractOpenGraphData($) {
  const ogData = {};
  
  $('meta[property^="og:"]').each((i, elem) => {
    const property = $(elem).attr('property').replace('og:', '');
    const content = $(elem).attr('content');
    if (content) {
      ogData[property] = content;
    }
  });
  
  return ogData;
}

/**
 * Extract all headings with hierarchy
 */
function extractHeadings($) {
  const headings = [];
  
  $('h1, h2, h3, h4').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text) {
      headings.push({
        level: elem.name,
        text: text
      });
    }
  });
  
  return headings;
}

/**
 * Extract main text content
 */
function extractTextContent($) {
  // Remove script, style, and navigation elements
  $('script, style, nav, header, footer').remove();
  
  // Get text from body
  const text = $('body').text()
    .replace(/\s+/g, ' ')
    .trim();
  
  return text.substring(0, 10000); // Limit to 10k chars for AI processing
}

/**
 * Extract contact information
 * ENHANCED: Now includes business name from footer
 */
function extractContactInfo($, html) {
  const contact = {
    emails: [],
    phones: [],
    addresses: [],
    business_name_from_footer: null  // NEW: Extract business name from footer
  };
  
  // Email patterns
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];
  contact.emails = [...new Set(emails)].slice(0, 3); // Dedupe and limit
  
  // Phone patterns (US format)
  const phoneRegex = /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const phones = html.match(phoneRegex) || [];
  contact.phones = [...new Set(phones)].slice(0, 3);
  
  // Try to find address in schema data or text
  const schemaScript = $('script[type="application/ld+json"]').first().html();
  if (schemaScript) {
    try {
      const schema = JSON.parse(schemaScript);
      if (schema.address) {
        contact.addresses.push(JSON.stringify(schema.address));
      }
    } catch (e) {
      // Invalid JSON
    }
  }
  
  // NEW: Extract business name from footer
  contact.business_name_from_footer = extractBusinessNameFromFooter($);
  
  return contact;
}

/**
 * NEW: Extract business name from footer area
 * Looks in footer, copyright text, and address blocks
 * 
 * Returns object with multiple attempts and confidence level
 */
function extractBusinessNameFromFooter($) {
  const businessName = {
    from_copyright: null,
    from_footer_text: null,
    from_address_block: null,
    confidence: 'none'
  };
  
  // Method 1: Look for copyright text (most reliable)
  $('footer').find('*').each((i, elem) => {
    const text = $(elem).text().trim();
    
    // Copyright patterns
    const copyrightPatterns = [
      /©\s*(?:\d{4})?\s*([^.©]+?)(?:\s*[-–—]\s*|\s*\.\s*|All Rights Reserved|\s*$)/i,
      /Copyright\s*©?\s*(?:\d{4})?\s*([^.©]+?)(?:\s*[-–—]\s*|\s*\.\s*|All Rights Reserved|\s*$)/i
    ];
    
    for (const pattern of copyrightPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let name = match[1]
          .replace(/\s*All Rights Reserved.*/i, '')
          .replace(/\s*[-–—]\s*.*/, '')
          .replace(/\s*\.\s*$/, '')
          .trim();
        
        // Clean up common suffixes
        name = name.replace(/\s*,?\s*(Inc|LLC|Ltd|Corp|Co\.)\.?$/i, '');
        
        // Validate: reasonable length, no URLs
        if (name.length >= 5 && name.length <= 80 && !name.includes('http') && !name.includes('www')) {
          businessName.from_copyright = name;
          businessName.confidence = 'high';
          console.log(`   ✓ Found copyright name: "${name}"`);
          return false; // Break the loop
        }
      }
    }
  });
  
  // Method 2: Look for text immediately above address in footer
  if (!businessName.from_copyright) {
    $('footer').find('address').each((i, elem) => {
      const prevText = $(elem).prev().text().trim();
      const parentText = $(elem).parent().contents().first().text().trim();
      
      const candidateName = prevText || parentText;
      
      if (candidateName.length >= 5 && candidateName.length <= 80 && 
          !candidateName.includes('http') && !candidateName.includes('@') &&
          !candidateName.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) {
        
        businessName.from_address_block = candidateName;
        businessName.confidence = 'medium';
        console.log(`   ✓ Found address block name: "${candidateName}"`);
        return false;
      }
    });
  }
  
  // Method 3: Look for strong/bold text in footer
  if (!businessName.from_copyright && !businessName.from_address_block) {
    const footerBoldSelectors = ['footer strong', 'footer b', 'footer .brand', 'footer .company-name', 'footer h3', 'footer h4'];
    
    for (const selector of footerBoldSelectors) {
      $(selector).first().each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length >= 5 && text.length <= 80 && !text.includes('http')) {
          businessName.from_footer_text = text;
          businessName.confidence = 'low';
          console.log(`   ✓ Found footer bold name: "${text}"`);
          return false;
        }
      });
      
      if (businessName.from_footer_text) break;
    }
  }
  
  // Method 4: Try schema.org name
  if (!businessName.from_copyright && !businessName.from_address_block && !businessName.from_footer_text) {
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const schema = JSON.parse($(elem).html());
        if (schema.name && typeof schema.name === 'string') {
          businessName.from_footer_text = schema.name;
          businessName.confidence = 'medium';
          console.log(`   ✓ Found schema name: "${schema.name}"`);
          return false;
        }
      } catch (e) {
        // Invalid JSON, continue
      }
    });
  }
  
  return businessName;
}

/**
 * Extract services/products mentioned
 */
function extractServices($, html) {
  const services = new Set();
  
  // Look for common service indicators
  const serviceSelectors = [
    'ul.services li',
    '.service-item',
    '[class*="service"]',
    'ul[class*="offering"] li'
  ];
  
  serviceSelectors.forEach(selector => {
    $(selector).each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 100) {
        services.add(text);
      }
    });
  });
  
  // Look for keywords in text
  const serviceKeywords = [
    'services:', 'we offer:', 'what we do:', 'our services include',
    'specializing in:', 'we provide:', 'offerings:'
  ];
  
  serviceKeywords.forEach(keyword => {
    const regex = new RegExp(keyword + '([^.]+)', 'i');
    const match = html.match(regex);
    if (match && match[1]) {
      const items = match[1].split(',');
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned.length > 3 && cleaned.length < 100) {
          services.add(cleaned);
        }
      });
    }
  });
  
  return Array.from(services).slice(0, 20);
}

/**
 * Extract about content
 */
function extractAboutContent($, html) {
  const aboutSelectors = [
    'section#about',
    'section.about',
    '[id*="about"]',
    '[class*="about"]'
  ];
  
  let aboutText = '';
  
  for (const selector of aboutSelectors) {
    const elem = $(selector).first();
    if (elem.length) {
      aboutText = elem.text().trim();
      break;
    }
  }
  
  if (!aboutText) {
    const aboutMatch = html.match(/about us[^<]*<\/h\d>(.*?)<(?:h\d|section|div class)/is);
    if (aboutMatch && aboutMatch[1]) {
      aboutText = aboutMatch[1].replace(/<[^>]+>/g, '').trim();
    }
  }
  
  return aboutText.substring(0, 1000);
}

/**
 * Extract links (internal or external)
 */
function extractLinks($, domain, internal = true) {
  const links = [];
  
  $('a[href]').each((i, elem) => {
    const href = $(elem).attr('href');
    const text = $(elem).text().trim();
    
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return;
    }
    
    const isInternal = href.startsWith('/') || href.includes(domain);
    
    if ((internal && isInternal) || (!internal && !isInternal)) {
      links.push({
        url: href.startsWith('http') ? href : `https://${domain}${href}`,
        text: text.substring(0, 100)
      });
    }
  });
  
  return links.slice(0, 50);
}

/**
 * Extract images
 */
function extractImages($) {
  const images = [];
  
  $('img[src]').each((i, elem) => {
    const src = $(elem).attr('src');
    const alt = $(elem).attr('alt') || '';
    
    if (src && !src.includes('data:image')) {
      images.push({
        src: src,
        alt: alt
      });
    }
  });
  
  return images.slice(0, 20);
}