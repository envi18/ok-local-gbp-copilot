// railway-backend/services/scrapingBee.js
// Website content extraction using ScrapingBee API

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extract comprehensive website content for AI analysis
 * @param {string} url - Website URL to scrape
 * @returns {Promise<Object>} Extracted website data
 */
export async function extractWebsiteContent(url) {
  console.log(`🔍 Extracting content from: ${url}`);
  
  try {
    // Call ScrapingBee API
    const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
        api_key: process.env.SCRAPINGBEE_API_KEY,
        url: url,
        render_js: 'true', // Enable JavaScript rendering
        premium_proxy: 'false', // Use standard proxy (cheaper)
        country_code: 'us'
      },
      timeout: 30000 // 30 second timeout
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
      
      // Contact information
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
      
      extraction_timestamp: new Date().toISOString()
    };

    console.log(`✅ Content extracted successfully`);
    console.log(`   Title: ${websiteData.title}`);
    console.log(`   Text length: ${websiteData.text_content.length} chars`);
    console.log(`   Services found: ${websiteData.services.length}`);
    
    return websiteData;

  } catch (error) {
    console.error('❌ ScrapingBee extraction failed:', error.message);
    throw new Error(`Failed to extract website content: ${error.message}`);
  }
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
 */
function extractContactInfo($, html) {
  const contact = {
    emails: [],
    phones: [],
    addresses: []
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
  
  return contact;
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
      const items = match[1].split(/[,\n]/).slice(0, 5);
      items.forEach(item => {
        const cleaned = item.trim();
        if (cleaned && cleaned.length < 100) {
          services.add(cleaned);
        }
      });
    }
  });
  
  return Array.from(services).slice(0, 10); // Limit to 10 services
}

/**
 * Extract about/company description
 */
function extractAboutContent($, html) {
  // Try various about section patterns
  const aboutSelectors = [
    'section[class*="about"]',
    'div[class*="about"]',
    '#about',
    'section[id*="about"]'
  ];
  
  for (const selector of aboutSelectors) {
    const content = $(selector).text().trim();
    if (content && content.length > 50) {
      return content.substring(0, 1000); // Limit to 1000 chars
    }
  }
  
  // Fallback: look for about keyword in text
  const aboutRegex = /about\s+us:?\s*([^<]{100,500})/i;
  const match = html.match(aboutRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return '';
}

/**
 * Extract links (internal or external)
 */
function extractLinks($, domain, internal = true) {
  const links = new Set();
  
  $('a[href]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return;
    }
    
    try {
      const url = new URL(href, `https://${domain}`);
      const isInternal = url.hostname.includes(domain);
      
      if ((internal && isInternal) || (!internal && !isInternal)) {
        links.add(url.href);
      }
    } catch (e) {
      // Invalid URL
    }
  });
  
  return Array.from(links).slice(0, 20); // Limit to 20 links
}

/**
 * Extract image information
 */
function extractImages($) {
  const images = [];
  
  $('img[src]').slice(0, 10).each((i, elem) => {
    const src = $(elem).attr('src');
    const alt = $(elem).attr('alt') || '';
    
    if (src && !src.startsWith('data:')) {
      images.push({ src, alt });
    }
  });
  
  return images;
}