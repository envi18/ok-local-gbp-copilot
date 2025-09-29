// src/lib/aiVisibilityMockService.ts
// Mock data service for AI Visibility (matches PDF example structure)

import type {
  AIQuery,
  AIVisibilityReport,
  Achievement,
  Competitor,
  ContentGap,
  PlatformScore,
  PriorityAction,
  TrendDataPoint
} from '../types/aiVisibility';

/**
 * Generate mock monthly reports for testing
 */
export function generateMockReports(organizationId: string, monthsBack: number = 6): AIVisibilityReport[] {
  const reports: AIVisibilityReport[] = [];
  const now = new Date();
  
  for (let i = 0; i < monthsBack; i++) {
    const reportDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = reportDate.toISOString().split('T')[0];
    
    // Scores gradually improving over time
    const baseScore = 65 + (monthsBack - i) * 3;
    
    reports.push({
      id: `report-${i}`,
      organization_id: organizationId,
      report_month: month,
      status: 'completed',
      overall_score: Math.min(baseScore + Math.floor(Math.random() * 10), 95),
      is_initial_report: i === monthsBack - 1,
      
      generated_at: new Date(reportDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      processing_started_at: new Date(reportDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      processing_completed_at: new Date(reportDate.getTime() + 5 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
      error_message: null,
      
      created_at: reportDate.toISOString(),
      updated_at: reportDate.toISOString()
    });
  }
  
  return reports;
}

/**
 * Generate mock platform scores for a report
 */
export function generateMockPlatformScores(reportId: string): PlatformScore[] {
  return [
    {
      id: `score-${reportId}-chatgpt`,
      report_id: reportId,
      platform: 'chatgpt',
      score: 71,
      mention_count: 8,
      ranking_position: 2.3,
      sentiment_score: 0.75,
      raw_responses: {},
      created_at: new Date().toISOString()
    },
    {
      id: `score-${reportId}-claude`,
      report_id: reportId,
      platform: 'claude',
      score: 0,
      mention_count: 0,
      ranking_position: null,
      sentiment_score: null,
      raw_responses: {},
      created_at: new Date().toISOString()
    },
    {
      id: `score-${reportId}-gemini`,
      report_id: reportId,
      platform: 'gemini',
      score: 92,
      mention_count: 12,
      ranking_position: 1.8,
      sentiment_score: 0.85,
      raw_responses: {},
      created_at: new Date().toISOString()
    },
    {
      id: `score-${reportId}-perplexity`,
      report_id: reportId,
      platform: 'perplexity',
      score: 0,
      mention_count: 0,
      ranking_position: null,
      sentiment_score: null,
      raw_responses: {},
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * Generate mock achievements (recent wins)
 */
export function generateMockAchievements(reportId: string, organizationId: string): Achievement[] {
  return [
    {
      id: `achievement-${reportId}-1`,
      report_id: reportId,
      organization_id: organizationId,
      achievement_text: 'Improved ChatGPT visibility score by 15 points',
      category: 'visibility',
      impact_level: 'high',
      previous_value: '56',
      current_value: '71',
      improvement_percentage: 26.8,
      created_at: new Date().toISOString()
    },
    {
      id: `achievement-${reportId}-2`,
      report_id: reportId,
      organization_id: organizationId,
      achievement_text: 'Added comprehensive gallery showcasing completed projects',
      category: 'content',
      impact_level: 'high',
      previous_value: null,
      current_value: null,
      improvement_percentage: null,
      created_at: new Date().toISOString()
    },
    {
      id: `achievement-${reportId}-3`,
      report_id: reportId,
      organization_id: organizationId,
      achievement_text: 'Ranking improved from position 3.2 to 1.8 on Gemini',
      category: 'ranking',
      impact_level: 'medium',
      previous_value: '3.2',
      current_value: '1.8',
      improvement_percentage: 43.8,
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * Generate mock priority actions (recommendations)
 */
export function generateMockPriorityActions(reportId: string, organizationId: string): PriorityAction[] {
  return [
    {
      id: `action-${reportId}-1`,
      report_id: reportId,
      organization_id: organizationId,
      action_title: 'Create Professional Landscape Design Services Page',
      action_description: 'Develop a dedicated service page highlighting professional landscape design process, benefits, and examples of design transformations.',
      priority: 'high',
      category: 'content_gap',
      fix_instructions: `## How to Fix This

**1. Create a New Service Page**
- Add a new page: /services/professional-landscape-design
- Include your design process (consultation → planning → visualization → implementation)
- Showcase before/after examples of design transformations

**2. Content to Include**
- Benefits of professional design vs DIY
- Your unique design approach
- Portfolio of completed design projects
- Customer testimonials specific to design services

**3. SEO Optimization**
- Target keywords: "professional landscape design [city]"
- Include local service area mentions
- Add FAQ section addressing common design questions

**4. Visual Elements**
- High-quality project photos
- Design sketches or 3D renderings if available
- Video walkthrough of your design process`,
      estimated_impact: 'high',
      estimated_effort: 'moderate',
      status: 'pending',
      completed_at: null,
      dismissed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: `action-${reportId}-2`,
      report_id: reportId,
      organization_id: organizationId,
      action_title: 'Develop Irrigation Systems & Water Management Page',
      action_description: 'Create comprehensive service page focusing on irrigation solutions, water conservation, and smart watering systems for Arizona properties.',
      priority: 'high',
      category: 'content_gap',
      fix_instructions: `## Implementation Guide

**1. Service Page Structure**
- Overview of irrigation services
- Types of systems offered (drip, sprinkler, smart systems)
- Water conservation benefits
- Arizona-specific considerations

**2. Content Strategy**
- Explain water management importance in Arizona climate
- Highlight smart irrigation technology
- Include water savings calculations
- Address common irrigation problems

**3. Technical Details**
- System installation process
- Maintenance requirements
- Seasonal adjustments
- Troubleshooting guide

**4. Call-to-Actions**
- Free irrigation assessment offer
- Water savings calculator
- Seasonal maintenance package`,
      estimated_impact: 'high',
      estimated_effort: 'moderate',
      status: 'pending',
      completed_at: null,
      dismissed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: `action-${reportId}-3`,
      report_id: reportId,
      organization_id: organizationId,
      action_title: 'Restructure Services Organization',
      action_description: 'Create a main Services landing page with clear categorization of all service offerings with visual navigation.',
      priority: 'medium',
      category: 'structural',
      fix_instructions: `## Restructuring Plan

**1. Create Main Services Hub**
- Design /services landing page
- Organize into clear categories:
  - Design Services
  - Installation Services
  - Maintenance Services
  - Specialty Services

**2. Navigation Improvements**
- Add visual service category cards
- Implement consistent page structure
- Add breadcrumb navigation
- Create service comparison table

**3. Content Consistency**
- Standardize service page templates
- Include pricing information (if applicable)
- Add "Related Services" sections
- Implement cross-linking strategy`,
      estimated_impact: 'medium',
      estimated_effort: 'extensive',
      status: 'in_progress',
      completed_at: null,
      dismissed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: `action-${reportId}-4`,
      report_id: reportId,
      organization_id: organizationId,
      action_title: 'Add Commercial vs Residential Content Segmentation',
      action_description: 'Create distinct sections for commercial and residential services with tailored content addressing specific needs of each customer segment.',
      priority: 'medium',
      category: 'content_gap',
      fix_instructions: `## Segmentation Strategy

**1. Create Separate Landing Pages**
- /commercial-services
- /residential-services

**2. Commercial Services Content**
- Property management partnerships
- HOA landscaping services
- Commercial maintenance contracts
- Large-scale project capabilities

**3. Residential Services Content**
- Homeowner-focused services
- Yard design and renovation
- Seasonal maintenance packages
- Budget-friendly options

**4. Navigation Updates**
- Add prominent commercial/residential selector
- Update main navigation
- Create targeted CTAs for each segment`,
      estimated_impact: 'medium',
      estimated_effort: 'moderate',
      status: 'pending',
      completed_at: null,
      dismissed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

/**
 * Generate mock content gaps
 */
export function generateMockContentGaps(reportId: string, organizationId: string): ContentGap[] {
  return [
    {
      id: `gap-${reportId}-1`,
      report_id: reportId,
      organization_id: organizationId,
      gap_type: 'structural',
      gap_title: 'Portfolio/Gallery Presentation',
      gap_description: 'Lacks a comprehensive visual gallery showcasing completed projects unlike competitor aspenlandscapinginc.com',
      severity: 'critical',
      competitors_have_this: ['aspenlandscapinginc.com'],
      recommended_action: 'Create structured gallery page organizing completed projects by category',
      content_type: 'gallery',
      created_at: new Date().toISOString()
    },
    {
      id: `gap-${reportId}-2`,
      report_id: reportId,
      organization_id: organizationId,
      gap_type: 'structural',
      gap_title: 'Services Organization',
      gap_description: 'Services are presented individually rather than in a comprehensive, organized structure like azmodlandscapes.com',
      severity: 'significant',
      competitors_have_this: ['azmodlandscapes.com'],
      recommended_action: 'Restructure service offerings into main categories with clear navigation',
      content_type: 'service_page',
      created_at: new Date().toISOString()
    },
    {
      id: `gap-${reportId}-3`,
      report_id: reportId,
      organization_id: organizationId,
      gap_type: 'critical_topic',
      gap_title: 'Professional Landscape Design',
      gap_description: 'Limited content on professional landscape design services and processes. Competitors showcase design services as professional offerings with dedicated service explanations.',
      severity: 'critical',
      competitors_have_this: ['aspenlandscapinginc.com', 'azmodlandscapes.com'],
      recommended_action: 'Create dedicated service page about professional landscape design',
      content_type: 'service_page',
      created_at: new Date().toISOString()
    },
    {
      id: `gap-${reportId}-4`,
      report_id: reportId,
      organization_id: organizationId,
      gap_type: 'significant_topic',
      gap_title: 'Irrigation Systems',
      gap_description: 'Missing content on irrigation systems, water management, and efficient watering solutions for Arizona landscapes',
      severity: 'significant',
      competitors_have_this: ['aspenlandscapinginc.com'],
      recommended_action: 'Develop comprehensive content on irrigation and water management',
      content_type: 'service_page',
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * Generate mock competitors
 */
export function generateMockCompetitors(organizationId: string): Competitor[] {
  return [
    {
      id: 'competitor-1',
      organization_id: organizationId,
      competitor_name: 'Aspen Landscaping Inc',
      competitor_website: 'aspenlandscapinginc.com',
      first_detected_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      detected_in_platforms: ['chatgpt', 'gemini'],
      detection_count: 6,
      is_user_disabled: false,
      disabled_at: null,
      last_seen_report_id: 'report-0',
      last_seen_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'competitor-2',
      organization_id: organizationId,
      competitor_name: 'AzMod Landscapes',
      competitor_website: 'azmodlandscapes.com',
      first_detected_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      detected_in_platforms: ['chatgpt', 'gemini', 'perplexity'],
      detection_count: 5,
      is_user_disabled: false,
      disabled_at: null,
      last_seen_report_id: 'report-0',
      last_seen_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'competitor-3',
      organization_id: organizationId,
      competitor_name: 'Desert Gardens Landscaping',
      competitor_website: 'desertgardensaz.com',
      first_detected_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      detected_in_platforms: ['chatgpt'],
      detection_count: 3,
      is_user_disabled: false,
      disabled_at: null,
      last_seen_report_id: 'report-0',
      last_seen_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

/**
 * Generate mock queries
 */
export function generateMockQueries(organizationId: string): AIQuery[] {
  return [
    {
      id: 'query-1',
      organization_id: organizationId,
      query_text: 'Best landscaping services in Prescott AZ',
      is_auto_generated: true,
      is_active: true,
      display_order: 1,
      last_used_at: new Date().toISOString(),
      times_used: 6,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'query-2',
      organization_id: organizationId,
      query_text: 'Professional landscape design Prescott Valley',
      is_auto_generated: true,
      is_active: true,
      display_order: 2,
      last_used_at: new Date().toISOString(),
      times_used: 6,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'query-3',
      organization_id: organizationId,
      query_text: 'Artificial turf installation Sedona Arizona',
      is_auto_generated: true,
      is_active: true,
      display_order: 3,
      last_used_at: new Date().toISOString(),
      times_used: 6,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'query-4',
      organization_id: organizationId,
      query_text: 'Retaining wall contractors near me',
      is_auto_generated: true,
      is_active: true,
      display_order: 4,
      last_used_at: new Date().toISOString(),
      times_used: 6,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'query-5',
      organization_id: organizationId,
      query_text: 'Native plant landscaping Arizona',
      is_auto_generated: true,
      is_active: true,
      display_order: 5,
      last_used_at: new Date().toISOString(),
      times_used: 6,
      created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

/**
 * Generate trend data for visibility chart
 */
export function generateMockTrendData(reports: AIVisibilityReport[]): TrendDataPoint[] {
  return reports.reverse().map((report, index) => {
    const date = new Date(report.report_month);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Simulated gradual improvement
    const baseImprovement = index * 3;
    
    return {
      month: monthName,
      overall_score: Math.min((report.overall_score || 65) + Math.floor(Math.random() * 5), 95),
      chatgpt_score: Math.min(60 + baseImprovement + Math.floor(Math.random() * 10), 90),
      claude_score: index < 2 ? 0 : Math.min(40 + (index - 2) * 8, 75),
      gemini_score: Math.min(75 + baseImprovement + Math.floor(Math.random() * 10), 95),
      perplexity_score: index < 3 ? 0 : Math.min(50 + (index - 3) * 7, 80)
    };
  });
}

/**
 * Mock service class (mimics real AI Visibility Service)
 */
export class AIVisibilityMockService {
  /**
   * Get all reports for an organization
   */
  static async getReports(organizationId: string): Promise<AIVisibilityReport[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockReports(organizationId);
  }

  /**
   * Get a specific report with all related data
   */
  static async getReportById(reportId: string, organizationId: string): Promise<{
    report: AIVisibilityReport;
    platformScores: PlatformScore[];
    achievements: Achievement[];
    priorityActions: PriorityAction[];
    contentGaps: ContentGap[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const reports = generateMockReports(organizationId);
    const report = reports.find(r => r.id === reportId) || reports[0];
    
    return {
      report,
      platformScores: generateMockPlatformScores(report.id),
      achievements: generateMockAchievements(report.id, organizationId),
      priorityActions: generateMockPriorityActions(report.id, organizationId),
      contentGaps: generateMockContentGaps(report.id, organizationId)
    };
  }

  /**
   * Get competitors for an organization
   */
  static async getCompetitors(organizationId: string): Promise<Competitor[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockCompetitors(organizationId);
  }

  /**
   * Get queries for an organization
   */
  static async getQueries(organizationId: string): Promise<AIQuery[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockQueries(organizationId);
  }

  /**
   * Get trend data for charts
   */
  static async getTrendData(organizationId: string): Promise<TrendDataPoint[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const reports = generateMockReports(organizationId);
    return generateMockTrendData(reports);
  }
}