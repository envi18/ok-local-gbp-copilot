// src/lib/reviewAutomationService.ts
// Review automation and AI response generation service


/**
 * Automation rule configuration for review responses
 */
export interface AutomationRule {
  minStars: number;
  maxStars: number;
  action: 'auto_respond' | 'draft_response' | 'manual_only';
  responseDelay?: number; // milliseconds
}

/**
 * SEO keyword configuration for responses
 */
export interface SEOKeywords {
  businessName: string;
  primaryKeywords: string[]; // e.g., "best coffee shop", "local coffee"
  secondaryKeywords: string[]; // e.g., "Oklahoma City", "organic beans"
  serviceKeywords: string[]; // e.g., "espresso", "latte", "pastries"
}

/**
 * Review response configuration
 */
export interface ReviewResponseConfig {
  tone: 'professional' | 'friendly' | 'casual';
  maxLength: number;
  includeCallToAction: boolean;
  seoKeywordDensity: 'light' | 'moderate' | 'heavy';
}

/**
 * Default automation rules
 * These would normally come from database based on organization settings
 */
export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    minStars: 5,
    maxStars: 5,
    action: 'auto_respond',
    responseDelay: 2000 // 2 second delay to simulate processing
  },
  {
    minStars: 4,
    maxStars: 4,
    action: 'draft_response',
    responseDelay: 1500
  },
  {
    minStars: 1,
    maxStars: 3,
    action: 'manual_only',
    responseDelay: 0
  }
];

/**
 * Default SEO keywords for OK Local Coffee House
 */
export const DEFAULT_SEO_KEYWORDS: SEOKeywords = {
  businessName: 'OK Local Coffee House',
  primaryKeywords: [
    'best coffee shop in Oklahoma City',
    'local coffee house',
    'Oklahoma City coffee',
    'specialty coffee'
  ],
  secondaryKeywords: [
    'Oklahoma City',
    'downtown OKC',
    'local business',
    'community coffee shop',
    'organic coffee beans'
  ],
  serviceKeywords: [
    'espresso',
    'latte',
    'cold brew',
    'pastries',
    'breakfast',
    'lunch',
    'free WiFi',
    'outdoor seating'
  ]
};

/**
 * Default response configuration
 */
export const DEFAULT_RESPONSE_CONFIG: ReviewResponseConfig = {
  tone: 'friendly',
  maxLength: 300,
  includeCallToAction: true,
  seoKeywordDensity: 'moderate'
};

/**
 * Determine automation action based on star rating
 */
export function getAutomationAction(
  starRating: number,
  rules: AutomationRule[] = DEFAULT_AUTOMATION_RULES
): AutomationRule | null {
  return rules.find(rule => 
    starRating >= rule.minStars && starRating <= rule.maxStars
  ) || null;
}

/**
 * Generate AI response to a review using ChatGPT
 * Incorporates SEO keywords naturally
 */
export async function generateAIReviewResponse(
  reviewText: string,
  starRating: number,
  reviewerName: string,
  seoKeywords: SEOKeywords = DEFAULT_SEO_KEYWORDS,
  config: ReviewResponseConfig = DEFAULT_RESPONSE_CONFIG
): Promise<string> {
  try {
    // Get OpenAI API key from environment
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!openaiKey) {
      console.warn('OpenAI API key not found, using template response');
      return generateTemplateResponse(reviewText, starRating, reviewerName, seoKeywords);
    }

    // Select keywords based on density setting
    const keywordsToUse = selectKeywordsByDensity(seoKeywords, config.seoKeywordDensity);

    // Build prompt for ChatGPT
    const prompt = buildResponsePrompt(
      reviewText,
      starRating,
      reviewerName,
      keywordsToUse,
      config
    );

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes thoughtful, SEO-optimized responses to Google Business Profile reviews for local businesses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedResponse = data.choices[0]?.message?.content || '';

    return generatedResponse.trim();

  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fallback to template response
    return generateTemplateResponse(reviewText, starRating, reviewerName, seoKeywords);
  }
}

/**
 * Build prompt for ChatGPT to generate review response
 */
function buildResponsePrompt(
  reviewText: string,
  starRating: number,
  reviewerName: string,
  keywords: string[],
  config: ReviewResponseConfig
): string {
  const toneGuidance = {
    professional: 'professional and courteous',
    friendly: 'warm and friendly',
    casual: 'casual and conversational'
  }[config.tone];

  let prompt = `Write a ${toneGuidance} response to this ${starRating}-star Google Business Profile review:\n\n`;
  prompt += `Review by ${reviewerName}: "${reviewText}"\n\n`;
  prompt += `Requirements:\n`;
  prompt += `- Keep response under ${config.maxLength} characters\n`;
  prompt += `- Naturally incorporate these SEO keywords: ${keywords.join(', ')}\n`;
  prompt += `- Address specific points mentioned in the review\n`;
  prompt += `- Express gratitude for the feedback\n`;
  
  if (starRating >= 4) {
    prompt += `- Thank them for their positive feedback\n`;
    prompt += `- Encourage them to visit again\n`;
  } else {
    prompt += `- Acknowledge their concerns professionally\n`;
    prompt += `- Offer to make things right\n`;
    prompt += `- Provide contact information if needed\n`;
  }

  if (config.includeCallToAction) {
    prompt += `- Include a subtle call-to-action (visit again, try something new, contact us)\n`;
  }

  prompt += `\nWrite ONLY the response text, no additional commentary.`;

  return prompt;
}

/**
 * Select keywords based on density setting
 */
function selectKeywordsByDensity(
  keywords: SEOKeywords,
  density: 'light' | 'moderate' | 'heavy'
): string[] {
  const allKeywords = [
    keywords.businessName,
    ...keywords.primaryKeywords,
    ...keywords.secondaryKeywords,
    ...keywords.serviceKeywords
  ];

  switch (density) {
    case 'light':
      return [
        keywords.businessName,
        keywords.primaryKeywords[0] || '',
        keywords.serviceKeywords[0] || ''
      ].filter(Boolean);
    
    case 'moderate':
      return [
        keywords.businessName,
        ...keywords.primaryKeywords.slice(0, 2),
        ...keywords.serviceKeywords.slice(0, 2)
      ].filter(Boolean);
    
    case 'heavy':
      return allKeywords.slice(0, 8);
    
    default:
      return allKeywords.slice(0, 4);
  }
}

/**
 * Generate template response (fallback when AI is unavailable)
 */
function generateTemplateResponse(
  reviewText: string,
  starRating: number,
  reviewerName: string,
  seoKeywords: SEOKeywords
): string {
  const businessName = seoKeywords.businessName;
  const firstName = reviewerName.split(' ')[0];

  if (starRating === 5) {
    return `Thank you so much for the wonderful 5-star review, ${firstName}! We're thrilled to hear you enjoyed your experience at ${businessName}. Our team works hard to provide the best ${seoKeywords.serviceKeywords[0] || 'service'} and create a welcoming atmosphere for our customers. We can't wait to see you again soon at our ${seoKeywords.secondaryKeywords[0] || 'location'}!`;
  } else if (starRating === 4) {
    return `Thank you for your review, ${firstName}! We're glad you enjoyed ${businessName} and appreciate your feedback. We're always working to improve our ${seoKeywords.serviceKeywords[0] || 'service'} and would love to hear any suggestions you might have. Hope to see you again soon!`;
  } else {
    return `Thank you for sharing your feedback, ${firstName}. We're sorry to hear your experience at ${businessName} didn't meet expectations. We take all feedback seriously and would appreciate the opportunity to make this right. Please contact us directly so we can address your concerns. We hope to serve you better next time.`;
  }
}

/**
 * Simulate processing delay based on automation rule
 */
export async function simulateProcessingDelay(delay: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Save review response to database (for production)
 */
export async function saveReviewResponse(
  reviewId: string,
  responseText: string,
  responseType: 'auto' | 'draft' | 'manual'
): Promise<boolean> {
  try {
    // This would save to your actual database
    // For now, just simulate success
    console.log('Saving review response:', { reviewId, responseType, responseText });
    return true;
  } catch (error) {
    console.error('Error saving review response:', error);
    return false;
  }
}