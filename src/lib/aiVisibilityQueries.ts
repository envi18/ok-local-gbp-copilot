// src/lib/aiVisibilityQueries.ts
// Query generation for AI Visibility analysis

/**
 * Query template structure
 */
export interface QueryTemplate {
  intent: 'discovery' | 'comparison' | 'specific' | 'reviews';
  template: string;
  description: string;
}

/**
 * Generated query with metadata
 */
export interface GeneratedQuery {
  query: string;
  intent: QueryTemplate['intent'];
  description: string;
  businessName: string;
  location: string;
}

/**
 * Industry-specific query templates
 * These are designed to trigger natural AI recommendations
 */
export const QUERY_TEMPLATES: Record<string, QueryTemplate[]> = {
  // Coffee Shop Templates
  coffee_shop: [
    {
      intent: 'discovery',
      template: 'best coffee shops in {location}',
      description: 'General discovery query'
    },
    {
      intent: 'specific',
      template: 'where to get specialty coffee in {location}',
      description: 'Specialty coffee seekers'
    },
    {
      intent: 'discovery',
      template: 'coffee shops with great atmosphere in {location}',
      description: 'Ambiance-focused query'
    },
    {
      intent: 'comparison',
      template: 'top rated coffee shops {location}',
      description: 'Quality comparison'
    },
    {
      intent: 'specific',
      template: 'coffee shops with wifi for working in {location}',
      description: 'Remote worker query'
    }
  ],

  // Restaurant Templates
  restaurant: [
    {
      intent: 'discovery',
      template: 'best restaurants in {location}',
      description: 'General dining query'
    },
    {
      intent: 'specific',
      template: 'top {cuisine} restaurants in {location}',
      description: 'Cuisine-specific search'
    },
    {
      intent: 'comparison',
      template: 'highly rated restaurants {location}',
      description: 'Quality-focused search'
    },
    {
      intent: 'reviews',
      template: 'restaurants with best reviews in {location}',
      description: 'Review-based discovery'
    },
    {
      intent: 'specific',
      template: 'romantic dinner spots in {location}',
      description: 'Occasion-based search'
    }
  ],

  // Dental Office Templates
  dental_office: [
    {
      intent: 'discovery',
      template: 'best dentists in {location}',
      description: 'General dentist search'
    },
    {
      intent: 'specific',
      template: 'family dentist {location}',
      description: 'Family-focused search'
    },
    {
      intent: 'comparison',
      template: 'top rated dental offices {location}',
      description: 'Quality comparison'
    },
    {
      intent: 'specific',
      template: 'emergency dental care {location}',
      description: 'Urgent care search'
    },
    {
      intent: 'reviews',
      template: 'dentists with best patient reviews {location}',
      description: 'Review-based search'
    }
  ],

  // Auto Repair Templates
  auto_repair: [
    {
      intent: 'discovery',
      template: 'best auto repair shops in {location}',
      description: 'General repair search'
    },
    {
      intent: 'specific',
      template: 'trusted mechanic {location}',
      description: 'Trust-focused search'
    },
    {
      intent: 'comparison',
      template: 'top rated auto repair {location}',
      description: 'Quality comparison'
    },
    {
      intent: 'specific',
      template: 'affordable car repair {location}',
      description: 'Budget-conscious search'
    },
    {
      intent: 'reviews',
      template: 'honest mechanics with good reviews {location}',
      description: 'Integrity-focused search'
    }
  ],

  // Gym/Fitness Templates
  gym: [
    {
      intent: 'discovery',
      template: 'best gyms in {location}',
      description: 'General gym search'
    },
    {
      intent: 'specific',
      template: 'gyms with personal trainers {location}',
      description: 'Training-focused search'
    },
    {
      intent: 'comparison',
      template: 'top fitness centers {location}',
      description: 'Quality comparison'
    },
    {
      intent: 'specific',
      template: '24 hour gym {location}',
      description: 'Schedule-based search'
    },
    {
      intent: 'reviews',
      template: 'gyms with best member reviews {location}',
      description: 'Member satisfaction search'
    }
  ],

  // Hair Salon Templates
  hair_salon: [
    {
      intent: 'discovery',
      template: 'best hair salons in {location}',
      description: 'General salon search'
    },
    {
      intent: 'specific',
      template: 'hair colorist specialists {location}',
      description: 'Specialty service search'
    },
    {
      intent: 'comparison',
      template: 'top rated hair stylists {location}',
      description: 'Quality comparison'
    },
    {
      intent: 'reviews',
      template: 'hair salons with excellent reviews {location}',
      description: 'Review-based search'
    },
    {
      intent: 'specific',
      template: 'affordable haircuts {location}',
      description: 'Budget-conscious search'
    }
  ],

  // Default/Generic Templates
  default: [
    {
      intent: 'discovery',
      template: 'best {business_type} in {location}',
      description: 'General discovery'
    },
    {
      intent: 'comparison',
      template: 'top rated {business_type} {location}',
      description: 'Quality comparison'
    },
    {
      intent: 'reviews',
      template: '{business_type} with best reviews {location}',
      description: 'Review-based search'
    },
    {
      intent: 'specific',
      template: 'recommended {business_type} near {location}',
      description: 'Recommendation search'
    },
    {
      intent: 'comparison',
      template: 'most popular {business_type} in {location}',
      description: 'Popularity-based search'
    }
  ]
};

/**
 * Normalize business type to template key
 */
export function normalizeBusinessType(businessType: string): string {
  const normalized = businessType.toLowerCase().trim();
  
  // Direct matches
  if (QUERY_TEMPLATES[normalized]) {
    return normalized;
  }
  
  // Common variations
  const variations: Record<string, string> = {
    'cafe': 'coffee_shop',
    'coffee': 'coffee_shop',
    'espresso bar': 'coffee_shop',
    'dentist': 'dental_office',
    'dental': 'dental_office',
    'orthodontist': 'dental_office',
    'mechanic': 'auto_repair',
    'car repair': 'auto_repair',
    'auto shop': 'auto_repair',
    'fitness center': 'gym',
    'fitness': 'gym',
    'health club': 'gym',
    'salon': 'hair_salon',
    'hair stylist': 'hair_salon',
    'barber': 'hair_salon',
    'dining': 'restaurant',
    'eatery': 'restaurant',
    'bistro': 'restaurant'
  };
  
  return variations[normalized] || 'default';
}

/**
 * Generate queries for a business
 */
export function generateQueriesForBusiness(
  businessName: string,
  businessType: string,
  location: string,
  options: {
    count?: number;
    customQueries?: string[];
    includeBusinessName?: boolean;
  } = {}
): GeneratedQuery[] {
  const {
    count = 10,
    customQueries = [],
    includeBusinessName = false
  } = options;

  const queries: GeneratedQuery[] = [];

  // Add custom queries first
  if (customQueries.length > 0) {
    for (const customQuery of customQueries) {
      queries.push({
        query: customQuery,
        intent: 'specific',
        description: 'Custom query',
        businessName,
        location
      });
    }
  }

  // Get template category
  const templateKey = normalizeBusinessType(businessType);
  const templates = QUERY_TEMPLATES[templateKey] || QUERY_TEMPLATES.default;

  // Generate queries from templates
  let templateIndex = 0;
  while (queries.length < count && templateIndex < templates.length * 2) {
    const template = templates[templateIndex % templates.length];
    
    // Replace placeholders
    let query = template.template
      .replace('{location}', location)
      .replace('{business_type}', businessType)
      .replace('{cuisine}', businessType); // For restaurants

    // Optionally include business name in some queries
    if (includeBusinessName && templateIndex % 3 === 0) {
      query = `${query} like ${businessName}`;
    }

    queries.push({
      query,
      intent: template.intent,
      description: template.description,
      businessName,
      location
    });

    templateIndex++;
  }

  // Return requested number of queries
  return queries.slice(0, count);
}

/**
 * Generate a single discovery query
 */
export function generateDiscoveryQuery(
  businessType: string,
  location: string
): string {
  const templateKey = normalizeBusinessType(businessType);
  const templates = QUERY_TEMPLATES[templateKey] || QUERY_TEMPLATES.default;
  
  // Find first discovery template
  const discoveryTemplate = templates.find(t => t.intent === 'discovery');
  
  if (discoveryTemplate) {
    return discoveryTemplate.template
      .replace('{location}', location)
      .replace('{business_type}', businessType);
  }
  
  return `best ${businessType} in ${location}`;
}

/**
 * Generate comparison query
 */
export function generateComparisonQuery(
  businessType: string,
  location: string
): string {
  const templateKey = normalizeBusinessType(businessType);
  const templates = QUERY_TEMPLATES[templateKey] || QUERY_TEMPLATES.default;
  
  // Find first comparison template
  const comparisonTemplate = templates.find(t => t.intent === 'comparison');
  
  if (comparisonTemplate) {
    return comparisonTemplate.template
      .replace('{location}', location)
      .replace('{business_type}', businessType);
  }
  
  return `top rated ${businessType} ${location}`;
}

/**
 * Validate query quality
 */
export function validateQuery(query: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum length
  if (query.length < 10) {
    errors.push('Query too short (minimum 10 characters)');
  }

  // Check maximum length
  if (query.length > 200) {
    errors.push('Query too long (maximum 200 characters)');
  }

  // Check for placeholder remnants
  if (query.includes('{') || query.includes('}')) {
    errors.push('Query contains unreplaced placeholders');
  }

  // Check for common issues
  if (query.trim() !== query) {
    errors.push('Query has leading/trailing whitespace');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all supported business types
 */
export function getSupportedBusinessTypes(): string[] {
  return Object.keys(QUERY_TEMPLATES).filter(key => key !== 'default');
}

/**
 * Get query count by intent
 */
export function getQueryIntentDistribution(queries: GeneratedQuery[]): Record<string, number> {
  const distribution: Record<string, number> = {
    discovery: 0,
    comparison: 0,
    specific: 0,
    reviews: 0
  };

  for (const query of queries) {
    distribution[query.intent]++;
  }

  return distribution;
}