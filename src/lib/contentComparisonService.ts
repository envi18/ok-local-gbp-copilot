// src/lib/contentComparisonService.ts - Part 1 of 4
/**
 * Content Comparison Service
 * 
 * Compares website content and generates specific content gaps
 * Creates actionable recommendations with competitor examples
 */

import type { Page, WebsiteContent } from './contentFetchingService';

export interface ContentGap {
  gap_type: 'structural' | 'thematic' | 'critical_topic' | 'significant_topic' | 'moderate_topic';
  gap_title: string;
  gap_description: string;
  severity: 'critical' | 'significant' | 'moderate';
  competitors_have_this: string[];
  recommended_action: string;
  content_type: 'website_content' | 'service_pages' | 'trust_building' | 'technical_seo' | 'user_experience';
  competitor_example_url: string | null;
  estimated_impact: 'high' | 'medium' | 'low';
  estimated_effort: 'high' | 'medium' | 'low';
}

export interface ComparisonSummary {
  total_gaps: number;
  critical_gaps: number;
  significant_gaps: number;
  moderate_gaps: number;
  target_strengths: string[];
  target_weaknesses: string[];
}

export class ContentComparisonService {
  /**
   * Compare target website to competitor
   */
  static async compareWebsites(
    target: WebsiteContent,
    competitor: WebsiteContent,
    targetName: string,
    competitorName: string
  ): Promise<ContentGap[]> {
    console.log(`[ContentComparison] Comparing ${targetName} vs ${competitorName}`);

    const gaps: ContentGap[] = [];

    // 1. Structural Comparison
    const structuralGaps = this.findStructuralGaps(target, competitor, competitorName);
    gaps.push(...structuralGaps);

    // 2. Topic Comparison
    const topicGaps = this.findTopicGaps(target, competitor, competitorName);
    gaps.push(...topicGaps);

    // 3. Feature Comparison
    const featureGaps = this.findFeatureGaps(target, competitor, competitorName);
    gaps.push(...featureGaps);

    console.log(`[ContentComparison] Found ${gaps.length} gaps (${gaps.filter(g => g.severity === 'critical').length} critical)`);

    return gaps;
  }

  /**
   * Find structural gaps (missing pages/sections)
   */
  private static findStructuralGaps(
    target: WebsiteContent,
    competitor: WebsiteContent,
    competitorName: string
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    // Check for FAQ page
    const targetHasFAQ = target.pages.some((p: Page) => p.has_faq || this.isFAQUrl(p.url));
    const competitorHasFAQ = competitor.pages.some((p: Page) => p.has_faq || this.isFAQUrl(p.url));

    if (!targetHasFAQ && competitorHasFAQ) {
      const competitorFAQPage = competitor.pages.find((p: Page) => p.has_faq || this.isFAQUrl(p.url));
      gaps.push({
        gap_type: 'structural',
        gap_title: 'Missing FAQ Section',
        gap_description: `Competitor ${competitorName} has a comprehensive FAQ page addressing common customer questions. Your site lacks this critical trust-building element that helps reduce customer service burden and improves SEO.`,
        severity: 'significant',
        competitors_have_this: [competitorName],
        recommended_action: 'Create a dedicated FAQ page at /faq with 10-15 common questions covering: pricing, scheduling, service process, areas served, accepted payment methods, and guarantees.',
        content_type: 'trust_building',
        competitor_example_url: competitorFAQPage ? competitorFAQPage.url : null,
        estimated_impact: 'high',
        estimated_effort: 'medium'
      });
    }

    // Check for process/how-it-works page
    const targetHasProcess = target.pages.some((p: Page) => p.has_process || this.isProcessUrl(p.url));
    const competitorHasProcess = competitor.pages.some((p: Page) => p.has_process || this.isProcessUrl(p.url));

    if (!targetHasProcess && competitorHasProcess) {
      const competitorProcessPage = competitor.pages.find((p: Page) => p.has_process || this.isProcessUrl(p.url));
      gaps.push({
        gap_type: 'structural',
        gap_title: 'Missing Process Explanation Page',
        gap_description: `Competitor ${competitorName} has a dedicated page explaining their service process step-by-step. This helps set customer expectations and builds trust by demonstrating professionalism and transparency.`,
        severity: 'critical',
        competitors_have_this: [competitorName],
        recommended_action: 'Create /how-it-works page with step-by-step process: 1) Initial contact/quote, 2) Scheduling appointment, 3) On-site assessment, 4) Service execution, 5) Follow-up. Include timeline expectations and what customers should prepare.',
        content_type: 'service_pages',
        competitor_example_url: competitorProcessPage ? competitorProcessPage.url : null,
        estimated_impact: 'high',
        estimated_effort: 'medium'
      });
    }

    // Check for schema markup
    if (!target.metadata.has_schema && competitor.metadata.has_schema) {
      gaps.push({
        gap_type: 'structural',
        gap_title: 'Missing Schema Markup (Structured Data)',
        gap_description: `Competitor ${competitorName} uses schema markup to help search engines and AI platforms understand their business better. This improves visibility in search results and voice search responses.`,
        severity: 'critical',
        competitors_have_this: [competitorName],
        recommended_action: 'Implement LocalBusiness schema markup on homepage including: business name, address, phone, hours, services, aggregate rating, and price range. Use Google\'s Structured Data Testing Tool to validate.',
        content_type: 'technical_seo',
        competitor_example_url: competitor.url,
        estimated_impact: 'high',
        estimated_effort: 'low'
      });
    }

    // Check for review/testimonial section
    const targetHasReviews = target.pages.some((p: Page) => p.has_reviews);
    const competitorHasReviews = competitor.pages.some((p: Page) => p.has_reviews);

    if (!targetHasReviews && competitorHasReviews) {
      const competitorReviewPage = competitor.pages.find((p: Page) => p.has_reviews);
      gaps.push({
        gap_type: 'structural',
        gap_title: 'Missing Customer Reviews/Testimonials Section',
        gap_description: `Competitor ${competitorName} prominently displays customer reviews and testimonials. Social proof is critical for conversion - 88% of consumers trust online reviews as much as personal recommendations.`,
        severity: 'significant',
        competitors_have_this: [competitorName],
        recommended_action: 'Add testimonials section to homepage with 3-5 customer reviews. Include customer name, service used, and specific results. Consider adding aggregate rating schema markup.',
        content_type: 'trust_building',
        competitor_example_url: competitorReviewPage ? competitorReviewPage.url : null,
        estimated_impact: 'high',
        estimated_effort: 'low'
      });
    }

    // Check for service-specific pages
    const targetServicePages = target.pages.filter((p: Page) => this.isServiceUrl(p.url));
    const competitorServicePages = competitor.pages.filter((p: Page) => this.isServiceUrl(p.url));

    if (competitorServicePages.length > targetServicePages.length + 2) {
      gaps.push({
        gap_type: 'structural',
        gap_title: 'Insufficient Service-Specific Pages',
        gap_description: `Competitor ${competitorName} has ${competitorServicePages.length} dedicated service pages while you have ${targetServicePages.length}. More specific service pages improve SEO and help customers find exactly what they need.`,
        severity: 'significant',
        competitors_have_this: [competitorName],
        recommended_action: 'Create dedicated pages for each major service offering. Each page should include: service description, process, pricing information, FAQs, and call-to-action.',
        content_type: 'service_pages',
        competitor_example_url: competitorServicePages[0] ? competitorServicePages[0].url : null,
        estimated_impact: 'medium',
        estimated_effort: 'high'
      });
    }

    return gaps;
  }

  // Part 2 of 4 - Add after Part 1

  /**
   * Find topic/content gaps
   */
  private static findTopicGaps(
    target: WebsiteContent,
    competitor: WebsiteContent,
    competitorName: string
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    // Get all topics from both sites
    const targetTopics = new Set<string>();
    target.pages.forEach((p: Page) => p.main_topics.forEach((t: string) => targetTopics.add(t.toLowerCase())));

    const competitorTopicPages: Record<string, Page[]> = {};
    competitor.pages.forEach((p: Page) => {
      p.main_topics.forEach((t: string) => {
        const topic = t.toLowerCase();
        if (!competitorTopicPages[topic]) {
          competitorTopicPages[topic] = [];
        }
        competitorTopicPages[topic].push(p);
      });
    });

    // Find topics competitor emphasizes but target doesn't
    const missingTopics: Array<{ topic: string; pages: Page[] }> = [];
    Object.keys(competitorTopicPages).forEach(topic => {
      if (!targetTopics.has(topic) && topic.length > 3) {
        const pages = competitorTopicPages[topic] || [];
        if (pages.length >= 2) { // Only if mentioned on 2+ pages
          missingTopics.push({ topic, pages });
        }
      }
    });

    // Sort by frequency (pages mentioning topic)
    missingTopics.sort((a, b) => b.pages.length - a.pages.length);

    // Create gaps for top missing topics
    missingTopics.slice(0, 5).forEach(({ topic, pages }) => {
      const severity = pages.length >= 4 ? 'critical' : 
                      pages.length >= 3 ? 'significant' : 'moderate';
      
      gaps.push({
        gap_type: pages.length >= 4 ? 'critical_topic' : 
                 pages.length >= 3 ? 'significant_topic' : 'moderate_topic',
        gap_title: `Missing Topic Coverage: ${this.capitalizeWords(topic)}`,
        gap_description: `Competitor ${competitorName} emphasizes "${topic}" across ${pages.length} pages, but your site doesn't cover this topic. This represents a content gap that competitors are using to attract customers searching for this information.`,
        severity,
        competitors_have_this: [competitorName],
        recommended_action: `Add content about "${topic}" to relevant pages. Consider creating a dedicated page or blog post if it's a major service aspect. Include specific details, benefits, and how it relates to your services.`,
        content_type: 'website_content',
        competitor_example_url: pages[0] ? pages[0].url : null,
        estimated_impact: severity === 'critical' ? 'high' : severity === 'significant' ? 'medium' : 'low',
        estimated_effort: 'medium'
      });
    });

    return gaps;
  }

  /**
   * Find feature gaps (technical/UX features)
   */
  private static findFeatureGaps(
    target: WebsiteContent,
    competitor: WebsiteContent,
    competitorName: string
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    // Check for online booking/forms
    const targetHasBooking = target.pages.some((p: Page) => 
      p.url.match(/book|schedule|appointment|quote|estimate/) !== null ||
      p.title.toLowerCase().includes('book') ||
      p.title.toLowerCase().includes('quote')
    );
    const competitorHasBooking = competitor.pages.some((p: Page) => 
      p.url.match(/book|schedule|appointment|quote|estimate/) !== null ||
      p.title.toLowerCase().includes('book') ||
      p.title.toLowerCase().includes('quote')
    );

    if (!targetHasBooking && competitorHasBooking) {
      const bookingPage = competitor.pages.find((p: Page) => 
        p.url.match(/book|schedule|quote/) !== null
      );
      gaps.push({
        gap_type: 'structural',
        gap_title: 'Missing Online Booking/Quote System',
        gap_description: `Competitor ${competitorName} offers online booking or instant quote requests. Modern customers expect 24/7 ability to request services without phone calls.`,
        severity: 'significant',
        competitors_have_this: [competitorName],
        recommended_action: 'Add online quote request form or booking system. Minimum: simple contact form with service selection, date preference, and details field. Better: integrated scheduling system.',
        content_type: 'user_experience',
        competitor_example_url: bookingPage ? bookingPage.url : null,
        estimated_impact: 'high',
        estimated_effort: 'medium'
      });
    }

    // Check content depth (word count comparison)
    const targetAvgWords = target.pages.reduce((sum: number, p: Page) => sum + p.word_count, 0) / Math.max(target.pages.length, 1);
    const competitorAvgWords = competitor.pages.reduce((sum: number, p: Page) => sum + p.word_count, 0) / Math.max(competitor.pages.length, 1);

    if (competitorAvgWords > targetAvgWords * 1.5) {
      const sortedPages = competitor.pages.sort((a: Page, b: Page) => b.word_count - a.word_count);
      gaps.push({
        gap_type: 'thematic',
        gap_title: 'Thin Content - Pages Need More Depth',
        gap_description: `Competitor ${competitorName} has significantly more detailed content (avg ${Math.round(competitorAvgWords)} words per page vs your ${Math.round(targetAvgWords)}). Search engines favor comprehensive, detailed content.`,
        severity: 'moderate',
        competitors_have_this: [competitorName],
        recommended_action: 'Expand key service pages with more detail: add sections on process, benefits, FAQs, pricing factors, and examples. Aim for 800-1200 words on main service pages.',
        content_type: 'website_content',
        competitor_example_url: sortedPages[0] ? sortedPages[0].url : null,
        estimated_impact: 'medium',
        estimated_effort: 'high'
      });
    }

    return gaps;
  }

  /**
   * Generate comparison summary
   */
  static generateSummary(
    target: WebsiteContent,
    gaps: ContentGap[]
  ): ComparisonSummary {
    const critical_gaps = gaps.filter(g => g.severity === 'critical').length;
    const significant_gaps = gaps.filter(g => g.severity === 'significant').length;
    const moderate_gaps = gaps.filter(g => g.severity === 'moderate').length;

    // Identify target strengths
    const target_strengths: string[] = [];
    if (target.pages.some((p: Page) => p.has_faq)) {
      target_strengths.push('Comprehensive FAQ section');
    }
    if (target.pages.some((p: Page) => p.has_process)) {
      target_strengths.push('Clear process explanation');
    }
    if (target.metadata.has_schema) {
      target_strengths.push('Proper schema markup implementation');
    }
    if (target.pages.some((p: Page) => p.has_reviews)) {
      target_strengths.push('Customer testimonials displayed');
    }
    if (target.pages.length > 10) {
      target_strengths.push('Comprehensive site structure with multiple pages');
    }

    // Identify target weaknesses from gaps
    const target_weaknesses = gaps
      .filter(g => g.severity === 'critical' || g.severity === 'significant')
      .map(g => g.gap_title)
      .slice(0, 5);

    return {
      total_gaps: gaps.length,
      critical_gaps,
      significant_gaps,
      moderate_gaps,
      target_strengths,
      target_weaknesses
    };
  }

  // Part 3 of 4 - Add after Part 2

  /**
   * Generate implementation timeline from gaps
   */
  static generateImplementationTimeline(gaps: ContentGap[]): {
    immediate: ContentGap[];
    short_term: ContentGap[];
    long_term: ContentGap[];
  } {
    // Immediate (1-2 weeks): Critical gaps with low effort
    const immediate = gaps.filter(g => 
      g.severity === 'critical' && 
      (g.estimated_effort === 'low' || g.estimated_effort === 'medium')
    );

    // Short-term (1-3 months): Significant gaps and remaining critical
    const short_term = gaps.filter(g => 
      (g.severity === 'significant' || 
       (g.severity === 'critical' && g.estimated_effort === 'high')) &&
      !immediate.includes(g)
    );

    // Long-term (3-6 months): Moderate gaps and nice-to-haves
    const long_term = gaps.filter(g => 
      g.severity === 'moderate' &&
      !immediate.includes(g) &&
      !short_term.includes(g)
    );

    return {
      immediate: immediate.slice(0, 5),
      short_term: short_term.slice(0, 8),
      long_term: long_term.slice(0, 10)
    };
  }

  /**
   * Generate specific recommendations from gaps
   */
  static generateRecommendations(gaps: ContentGap[]): Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    steps: string[];
    example_url: string | null;
  }> {
    return gaps.map(gap => ({
      title: gap.gap_title,
      description: gap.recommended_action,
      priority: gap.severity === 'critical' ? 'high' : 
                gap.severity === 'significant' ? 'medium' : 'low',
      impact: gap.estimated_impact,
      effort: gap.estimated_effort,
      steps: this.generateActionSteps(gap),
      example_url: gap.competitor_example_url
    }));
  }

  /**
   * Generate specific action steps for a gap
   */
  private static generateActionSteps(gap: ContentGap): string[] {
    const steps: string[] = [];

    if (gap.gap_type === 'structural') {
      if (gap.gap_title.includes('FAQ')) {
        steps.push('Compile 10-15 most frequently asked customer questions');
        steps.push('Write clear, helpful answers (100-200 words each)');
        steps.push('Organize by category (pricing, scheduling, process, etc.)');
        steps.push('Add FAQ schema markup for rich snippets');
        steps.push('Link to FAQ from footer and contact page');
      } else if (gap.gap_title.includes('Process')) {
        steps.push('Document your step-by-step service process');
        steps.push('Create visual timeline or numbered steps');
        steps.push('Include estimated timeframes for each step');
        steps.push('Add photos or icons for each step');
        steps.push('Include CTA at end (Get Quote or Book Now)');
      } else if (gap.gap_title.includes('Schema')) {
        steps.push('Choose appropriate schema type (LocalBusiness, etc.)');
        steps.push('Add JSON-LD script to homepage <head>');
        steps.push('Include name, address, phone, hours, services');
        steps.push('Test with Google Structured Data Testing Tool');
        steps.push('Submit to Google Search Console');
      }
    }

    // Default generic steps if no specific steps
    if (steps.length === 0) {
      steps.push('Research competitor examples');
      steps.push('Create content outline');
      steps.push('Write/design content');
      steps.push('Review and refine');
      steps.push('Publish and promote');
    }

    return steps;
  }

  // Part 4 of 4 - Add after Part 3 and close the class

  /**
   * Helper: Check if URL is FAQ page
   */
  private static isFAQUrl(url: string): boolean {
    return url.toLowerCase().match(/\/(faq|frequently-asked|questions)/) !== null;
  }

  /**
   * Helper: Check if URL is process page
   */
  private static isProcessUrl(url: string): boolean {
    return url.toLowerCase().match(/\/(how-it-works|process|our-process|procedure)/) !== null;
  }

  /**
   * Helper: Check if URL is service page
   */
  private static isServiceUrl(url: string): boolean {
    return url.toLowerCase().match(/\/(services|service)\//) !== null ||
           url.toLowerCase().includes('-service') ||
           url.toLowerCase().includes('-services');
  }

  /**
   * Helper: Capitalize words
   */
  private static capitalizeWords(str: string): string {
    return str.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}