// src/lib/aiVisibilityService.ts
// Main service coordinator for AI Visibility feature

import { v4 as uuidv4 } from 'uuid';
import type {
  Achievement,
  AIPlatform,
  AIVisibilityReport,
  Competitor,
  ContentGap,
  PlatformScore,
  PriorityAction
} from '../types/aiVisibility';
import { executeQueryOnAllPlatforms } from './aiPlatforms/index';
import { generateQueriesForBusiness, type GeneratedQuery } from './aiVisibilityQueries';
import {
  calculateGrade,
  calculateOverallScore,
  calculatePlatformScore,
  identifyScoringOpportunities,
  type PlatformScoreBreakdown,
  type ScoreParams
} from './aiVisibilityScoring';

/**
 * Service input parameters
 */
export interface GenerateReportParams {
  organization_id: string;
  business_name: string;
  business_type: string;
  location: string;
  queries?: string[];
  query_count?: number;
  platforms?: AIPlatform[];
}

/**
 * Query execution results
 */
export interface QueryResults {
  query: string;
  responses: Map<AIPlatform, any>;
}

/**
 * AI Visibility Service
 * Coordinates AI platform queries, scoring, and report generation
 */
export class AIVisibilityService {
  /**
   * Generate complete monthly AI visibility report
   */
  async generateMonthlyReport(params: GenerateReportParams): Promise<AIVisibilityReport> {
    const {
      organization_id,
      business_name,
      business_type,
      location,
      queries: customQueries,
      query_count = 10,
      platforms = ['chatgpt', 'claude', 'gemini', 'perplexity']
    } = params;

    console.log(`\n🚀 Generating AI Visibility Report`);
    console.log(`   Business: ${business_name}`);
    console.log(`   Type: ${business_type}`);
    console.log(`   Location: ${location}`);
    console.log(`   Queries: ${query_count}`);
    console.log(`   Platforms: ${platforms.join(', ')}\n`);

    // Step 1: Generate queries
    const generatedQueries = this.generateQueries(
      business_name,
      business_type,
      location,
      customQueries,
      query_count
    );

    console.log(`✅ Generated ${generatedQueries.length} queries`);

    // Step 2: Execute queries across all platforms
    const queryResults = await this.executeQueries(generatedQueries, platforms);

    console.log(`✅ Executed queries across ${platforms.length} platforms`);

    // Step 3: Calculate platform scores
    const platformScores = this.calculatePlatformScores(
      queryResults,
      business_name,
      platforms
    );

    console.log(`✅ Calculated platform scores`);

    // Step 4: Calculate overall score
    const overall_score = calculateOverallScore(platformScores).score;
    const grade = calculateGrade(overall_score);

    console.log(`✅ Overall Score: ${overall_score}/100 (${grade})`);

    // Step 5: Detect competitors
    const competitors = this.detectCompetitors(queryResults, business_name);

    console.log(`✅ Detected ${competitors.length} competitors`);

    // Step 6: Analyze content gaps
    const content_gaps = this.analyzeContentGaps(queryResults, business_name, competitors);

    console.log(`✅ Identified ${content_gaps.length} content gaps`);

    // Step 7: Generate priority actions
    const priority_actions = this.generatePriorityActions(
      platformScores,
      competitors,
      content_gaps,
      overall_score
    );

    console.log(`✅ Generated ${priority_actions.length} priority actions`);

    // Step 8: Identify achievements (only if previous report exists)
    const achievements = this.generateAchievements(platformScores, overall_score);

    console.log(`✅ Generated ${achievements.length} achievements\n`);

    // Create report
    const report: AIVisibilityReport = {
      id: uuidv4(),
      organization_id,
      report_month: this.getCurrentReportMonth(),
      status: 'completed',
      overall_score,
      is_initial_report: true, // Would check database for previous reports
      generated_at: new Date().toISOString(),
      processing_started_at: new Date().toISOString(),
      processing_completed_at: new Date().toISOString(),
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Joined data
      platform_scores: this.createPlatformScoreRecords(platformScores, uuidv4()),
      achievements,
      priority_actions,
      content_gaps
    };

    return report;
  }

  /**
   * Generate queries for business
   */
  private generateQueries(
    business_name: string,
    business_type: string,
    location: string,
    customQueries?: string[],
    count: number = 10
  ): GeneratedQuery[] {
    return generateQueriesForBusiness(business_name, business_type, location, {
      count,
      customQueries,
      includeBusinessName: false
    });
  }

  /**
   * Execute queries across all platforms
   */
  async executeQueries(
    queries: GeneratedQuery[],
    platforms: AIPlatform[]
  ): Promise<QueryResults[]> {
    const results: QueryResults[] = [];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      console.log(`   [${i + 1}/${queries.length}] "${query.query}"`);

      try {
        const responses = await executeQueryOnAllPlatforms(query.query, platforms);
        
        // Convert to Map
        const responsesMap = new Map<AIPlatform, any>();
        for (const platform of platforms) {
          const response = responses[platform as keyof typeof responses];
          if (response) {
            responsesMap.set(platform, response);
          }
        }
        
        results.push({
          query: query.query,
          responses: responsesMap
        });

        // Add small delay between queries to avoid rate limiting
        if (i < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`   ❌ Error executing query: ${error.message}`);
        
        // Add empty responses for failed query
        const emptyResponses = new Map<AIPlatform, any>();
        for (const platform of platforms) {
          emptyResponses.set(platform, {
            platform,
            response: '',
            business_mentioned: false,
            business_ranking: null,
            competitors: [],
            sentiment: null,
            response_time_ms: 0,
            cost: 0,
            error: error.message
          });
        }
        
        results.push({
          query: query.query,
          responses: emptyResponses
        });
      }
    }

    return results;
  }

  /**
   * Calculate platform scores from query results
   */
  private calculatePlatformScores(
    queryResults: QueryResults[],
    _business_name: string,
    platforms: AIPlatform[]
  ): Record<AIPlatform, PlatformScoreBreakdown> {
    const platformScores: Record<AIPlatform, PlatformScoreBreakdown> = {} as any;

    for (const platform of platforms) {
      // Collect all responses for this platform
      const platformResponses = queryResults
        .map(qr => qr.responses.get(platform))
        .filter(r => r !== undefined);

      // Calculate aggregated metrics
      const mention_count = platformResponses.filter(r => r.business_mentioned).length;
      const rankings = platformResponses
        .filter(r => r.business_ranking !== null)
        .map(r => r.business_ranking!);
      const sentiments = platformResponses
        .filter(r => r.sentiment !== null)
        .map(r => r.sentiment!);

      const avg_ranking = rankings.length > 0
        ? rankings.reduce((sum, r) => sum + r, 0) / rankings.length
        : null;

      const avg_sentiment = sentiments.length > 0
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
        : null;

      // Calculate score using ScoreParams
      const scoreParams: ScoreParams = {
        businessMentioned: mention_count > 0,
        ranking: avg_ranking,
        sentiment: avg_sentiment !== null ? 
          (avg_sentiment > 0.3 ? 'positive' : avg_sentiment < -0.3 ? 'negative' : 'neutral') : 
          null,
        competitorCount: 0 // Will be calculated separately
      };

      const scoreBreakdown = calculatePlatformScore(scoreParams);
      
      // Override platform
      scoreBreakdown.platform = platform;

      platformScores[platform] = scoreBreakdown;
    }

    return platformScores;
  }

  /**
   * Detect competitors from query results
   */
  private detectCompetitors(
    queryResults: QueryResults[],
    _business_name: string
  ): Competitor[] {
    const competitorMap = new Map<string, {
      count: number;
      platforms: Set<AIPlatform>;
      website: string | null;
    }>();

    // Collect all competitors mentioned across all queries
    for (const result of queryResults) {
      for (const [platform, response] of result.responses.entries()) {
        if (response.competitors && response.competitors.length > 0) {
          for (const competitor of response.competitors) {
            // Skip if it's the business itself (removed business_name check since unused)

            const existing = competitorMap.get(competitor);
            if (existing) {
              existing.count++;
              existing.platforms.add(platform);
            } else {
              competitorMap.set(competitor, {
                count: 1,
                platforms: new Set([platform]),
                website: null // Could extract from responses
              });
            }
          }
        }
      }
    }

    // Convert to Competitor objects
    const competitors: Competitor[] = [];
    const now = new Date().toISOString();

    for (const [name, data] of competitorMap.entries()) {
      // Only include competitors mentioned at least twice
      if (data.count >= 2) {
        competitors.push({
          id: uuidv4(),
          organization_id: '', // Will be set when storing
          competitor_name: name,
          competitor_website: data.website,
          first_detected_at: now,
          detected_in_platforms: Array.from(data.platforms),
          detection_count: data.count,
          is_user_disabled: false,
          disabled_at: null,
          last_seen_report_id: null,
          last_seen_at: now,
          created_at: now,
          updated_at: now
        });
      }
    }

    // Sort by detection count
    competitors.sort((a, b) => b.detection_count - a.detection_count);

    return competitors;
  }

  /**
   * Analyze content gaps
   */
  private analyzeContentGaps(
    queryResults: QueryResults[],
    _business_name: string,
    competitors: Competitor[]
  ): ContentGap[] {
    const gaps: ContentGap[] = [];
    const now = new Date().toISOString();

    // Analyze what competitors have that business doesn't
    const businessMentions = queryResults.filter(qr =>
      Array.from(qr.responses.values()).some(r => r.business_mentioned)
    ).length;

    const topCompetitors = competitors.slice(0, 3);

    // Gap 1: Low visibility
    if (businessMentions < queryResults.length * 0.3) {
      gaps.push({
        id: uuidv4(),
        report_id: '', // Will be set when storing
        organization_id: '', // Will be set when storing
        gap_type: 'structural',
        gap_title: 'Low AI Platform Visibility',
        gap_description: `Business appears in only ${businessMentions} out of ${queryResults.length} queries. Competitors like ${topCompetitors.map(c => c.competitor_name).join(', ')} are mentioned more frequently.`,
        severity: businessMentions === 0 ? 'critical' : 'significant',
        competitors_have_this: topCompetitors.map(c => c.competitor_name),
        recommended_action: 'Optimize online presence with structured data, consistent NAP citations, and authoritative backlinks',
        content_type: 'technical_seo',
        created_at: now
      });
    }

    // Gap 2: Poor ranking positions
    const avgRankings = queryResults
      .flatMap(qr => Array.from(qr.responses.values()))
      .filter(r => r.business_ranking !== null)
      .map(r => r.business_ranking!);

    if (avgRankings.length > 0) {
      const avgRank = avgRankings.reduce((sum, r) => sum + r, 0) / avgRankings.length;
      
      if (avgRank > 3) {
        gaps.push({
          id: uuidv4(),
          report_id: '',
          organization_id: '',
          gap_type: 'thematic',
          gap_title: 'Suboptimal Ranking Position',
          gap_description: `Business ranks at position ${avgRank.toFixed(1)} on average when mentioned. Top competitors consistently rank higher.`,
          severity: avgRank > 5 ? 'significant' : 'moderate',
          competitors_have_this: topCompetitors.map(c => c.competitor_name),
          recommended_action: 'Increase review volume, improve rating, and enhance content quality',
          content_type: 'reputation_management',
          created_at: now
        });
      }
    }

    return gaps;
  }

  /**
   * Generate priority actions
   */
  private generatePriorityActions(
    platformScores: Record<AIPlatform, PlatformScoreBreakdown>,
    competitors: Competitor[],
    _content_gaps: ContentGap[],
    _overall_score: number
  ): PriorityAction[] {
    const actions: PriorityAction[] = [];
    const now = new Date().toISOString();

    // Identify weakest platforms
    const opportunities = identifyScoringOpportunities(platformScores);

    for (const opp of opportunities.slice(0, 3)) {
      let actionTitle = '';
      let actionDescription = '';
      let fixInstructions = '';
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      if (opp.issue === 'not_mentioned') {
        priority = 'critical';
        actionTitle = `Critical: Establish ${opp.platform.toUpperCase()} Presence`;
        actionDescription = `${opp.platform.toUpperCase()} shows zero visibility. This is a critical gap affecting overall AI discoverability.`;
        fixInstructions = `1. Claim and optimize your business listing on relevant directories\n2. Build citations on authoritative sites\n3. Create quality content mentioning your services and location\n4. Encourage customer reviews on multiple platforms`;
      } else if (opp.priority === 'high') {
        priority = 'high';
        actionTitle = `Improve ${opp.platform.toUpperCase()} Ranking`;
        actionDescription = `${opp.platform.toUpperCase()} shows opportunities for improvement. ${opp.opportunity}`;
        fixInstructions = `1. Optimize Google Business Profile with complete information\n2. Add high-quality photos and regular posts\n3. Respond to all reviews professionally\n4. Build more positive reviews`;
      } else {
        priority = 'medium';
        actionTitle = `Optimize ${opp.platform.toUpperCase()} Performance`;
        actionDescription = `${opp.platform.toUpperCase()} has room for improvement. ${opp.opportunity}`;
        fixInstructions = `1. Monitor and maintain current performance\n2. Continue regular content updates\n3. Stay engaged with customer feedback\n4. Track competitor strategies`;
      }

      actions.push({
        id: uuidv4(),
        report_id: '',
        organization_id: '',
        action_title: actionTitle,
        action_description: actionDescription,
        priority,
        category: 'platform_optimization',
        fix_instructions: fixInstructions,
        estimated_impact: opp.potentialGain > 30 ? 'high' : opp.potentialGain > 15 ? 'medium' : 'low',
        estimated_effort: priority === 'critical' ? 'extensive' : priority === 'high' ? 'moderate' : 'quick',
        status: 'pending',
        completed_at: null,
        dismissed_at: null,
        created_at: now,
        updated_at: now
      });
    }

    // Add competitor-focused action if competitors are dominating
    if (competitors.length > 5) {
      actions.push({
        id: uuidv4(),
        report_id: '',
        organization_id: '',
        action_title: 'Competitive Intelligence Strategy',
        action_description: `${competitors.length} competitors detected across AI platforms. Need competitive differentiation strategy.`,
        priority: 'high',
        category: 'competitive_analysis',
        fix_instructions: '1. Analyze top 3 competitor strengths\n2. Identify unique value propositions\n3. Emphasize differentiators in content\n4. Monitor competitor review strategies',
        estimated_impact: 'high',
        estimated_effort: 'moderate',
        status: 'pending',
        completed_at: null,
        dismissed_at: null,
        created_at: now,
        updated_at: now
      });
    }

    return actions;
  }

  /**
   * Generate achievements from improvements
   */
  private generateAchievements(
    platformScores: Record<AIPlatform, PlatformScoreBreakdown>,
    overall_score: number
  ): Achievement[] {
    const achievements: Achievement[] = [];
    const now = new Date().toISOString();

    // This would normally compare against previous report
    // For now, we'll generate based on current performance

    // Achievement for good overall score
    if (overall_score >= 70) {
      achievements.push({
        id: uuidv4(),
        report_id: '',
        organization_id: '',
        achievement_text: `Strong AI visibility with ${overall_score}/100 overall score`,
        category: 'overall_performance',
        impact_level: overall_score >= 85 ? 'high' : 'medium',
        previous_value: null,
        current_value: `${overall_score}`,
        improvement_percentage: null,
        created_at: now
      });
    }

    // Achievement for strong platform performance
    for (const [platform, score] of Object.entries(platformScores)) {
      if (score.score >= 75) {
        achievements.push({
          id: uuidv4(),
          report_id: '',
          organization_id: '',
          achievement_text: `Excellent ${platform.toUpperCase()} presence with ${score.score}/100 score`,
          category: 'platform_performance',
          impact_level: 'medium',
          previous_value: null,
          current_value: `${score.score}`,
          improvement_percentage: null,
          created_at: now
        });
      }
    }

    return achievements;
  }

  /**
   * Create platform score records for database
   */
  private createPlatformScoreRecords(
    platformScores: Record<AIPlatform, PlatformScoreBreakdown>,
    report_id: string
  ): PlatformScore[] {
    const records: PlatformScore[] = [];
    const now = new Date().toISOString();

    for (const [platform, score] of Object.entries(platformScores)) {
      // Extract data from the PlatformScoreBreakdown
      const mentionCount = score.details.businessMentioned ? 1 : 0;
      const avgRanking = score.details.ranking;
      const avgSentiment = score.details.sentiment === 'positive' ? 0.8 : 
                          score.details.sentiment === 'neutral' ? 0.5 : 
                          score.details.sentiment === 'negative' ? -0.5 : null;

      records.push({
        id: uuidv4(),
        report_id,
        platform: platform as AIPlatform,
        score: score.score,
        mention_count: mentionCount,
        ranking_position: avgRanking,
        sentiment_score: avgSentiment,
        raw_responses: {},
        created_at: now
      });
    }

    return records;
  }

  /**
   * Get current report month (first day of current month)
   */
  private getCurrentReportMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }
}