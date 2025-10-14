// src/lib/aiVisibilityScoring.ts
// Scoring algorithms for AI Visibility analysis

import type { AIPlatform } from '../types/aiVisibility';

/**
 * Score calculation parameters
 */
export interface ScoreParams {
  businessMentioned: boolean;
  ranking: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  competitorCount: number;
  strengthsCount?: number;
  weaknessesCount?: number;
}

/**
 * Platform score breakdown
 */
export interface PlatformScoreBreakdown {
  platform: AIPlatform;
  score: number; // 0-100
  components: {
    mention: number; // 0-40 points
    ranking: number; // 0-40 points
    sentiment: number; // 0-20 points
  };
  details: {
    businessMentioned: boolean;
    ranking: number | null;
    sentiment: string | null;
    competitorCount: number;
  };
}

/**
 * Overall visibility score
 */
export interface OverallScore {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  platformScores: Record<AIPlatform, number>;
  averageRanking: number | null;
  mentionRate: number; // Percentage
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

/**
 * Calculate visibility score for a single platform
 * 
 * Scoring Formula (0-100):
 * - Mention: 40 points (all or nothing)
 * - Ranking: 40 points (scaled based on position)
 *   - #1: 40 points
 *   - #2: 35 points
 *   - #3: 30 points
 *   - #4: 25 points
 *   - #5: 20 points
 *   - #6+: 15 points
 *   - Not ranked but mentioned: 10 points
 * - Sentiment: 20 points
 *   - Positive: 20 points
 *   - Neutral: 10 points
 *   - Negative: 0 points
 */
export function calculatePlatformScore(params: ScoreParams): PlatformScoreBreakdown {
  const platform = 'chatgpt' as AIPlatform; // Will be set by caller
  
  let mentionScore = 0;
  let rankingScore = 0;
  let sentimentScore = 0;

  // Mention Score (0-40 points)
  if (params.businessMentioned) {
    mentionScore = 40;
  }

  // Ranking Score (0-40 points)
  if (params.businessMentioned) {
    if (params.ranking === null) {
      // Mentioned but not explicitly ranked
      rankingScore = 10;
    } else {
      // Ranked position - higher is better
      switch (params.ranking) {
        case 1:
          rankingScore = 40;
          break;
        case 2:
          rankingScore = 35;
          break;
        case 3:
          rankingScore = 30;
          break;
        case 4:
          rankingScore = 25;
          break;
        case 5:
          rankingScore = 20;
          break;
        default:
          // Ranked #6 or lower
          rankingScore = 15;
      }
    }
  }

  // Sentiment Score (0-20 points)
  if (params.businessMentioned) {
    switch (params.sentiment) {
      case 'positive':
        sentimentScore = 20;
        break;
      case 'neutral':
        sentimentScore = 10;
        break;
      case 'negative':
        sentimentScore = 0;
        break;
      default:
        // No clear sentiment detected
        sentimentScore = 10;
    }
  }

  const totalScore = mentionScore + rankingScore + sentimentScore;

  return {
    platform,
    score: totalScore,
    components: {
      mention: mentionScore,
      ranking: rankingScore,
      sentiment: sentimentScore
    },
    details: {
      businessMentioned: params.businessMentioned,
      ranking: params.ranking,
      sentiment: params.sentiment,
      competitorCount: params.competitorCount
    }
  };
}

/**
 * Calculate overall visibility score from platform scores
 */
export function calculateOverallScore(
  platformScores: Record<AIPlatform, PlatformScoreBreakdown>
): OverallScore {
  const platforms: AIPlatform[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  
  let totalScore = 0;
  let platformCount = 0;
  let mentionCount = 0;
  let rankingSum = 0;
  let rankingCount = 0;
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

  const scores: Record<AIPlatform, number> = {} as Record<AIPlatform, number>;

  for (const platform of platforms) {
    const platformScore = platformScores[platform];
    
    if (platformScore) {
      scores[platform] = platformScore.score;
      totalScore += platformScore.score;
      platformCount++;

      // Track mentions
      if (platformScore.details.businessMentioned) {
        mentionCount++;

        // Track rankings
        if (platformScore.details.ranking) {
          rankingSum += platformScore.details.ranking;
          rankingCount++;
        }

        // Track sentiment
        if (platformScore.details.sentiment) {
          sentimentCounts[platformScore.details.sentiment as keyof typeof sentimentCounts]++;
        }
      }
    } else {
      scores[platform] = 0;
    }
  }

  // Calculate averages
  const averageScore = platformCount > 0 ? totalScore / platformCount : 0;
  const averageRanking = rankingCount > 0 ? rankingSum / rankingCount : null;
  const mentionRate = platformCount > 0 ? (mentionCount / platformCount) * 100 : 0;

  // Determine overall sentiment
  let overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
  if (sentimentCounts.positive > sentimentCounts.neutral && sentimentCounts.positive > sentimentCounts.negative) {
    overallSentiment = 'positive';
  } else if (sentimentCounts.negative > sentimentCounts.neutral && sentimentCounts.negative > sentimentCounts.positive) {
    overallSentiment = 'negative';
  } else if (sentimentCounts.positive > 0 && sentimentCounts.negative > 0) {
    overallSentiment = 'mixed';
  }

  // Calculate grade
  const grade = calculateGrade(averageScore);

  return {
    score: Math.round(averageScore),
    grade,
    platformScores: scores,
    averageRanking,
    mentionRate,
    sentiment: overallSentiment
  };
}

/**
 * Convert score to letter grade
 */
export function calculateGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Compare two scores and calculate change
 */
export function calculateScoreChange(
  currentScore: number,
  previousScore: number | null
): {
  change: number;
  percentChange: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
} {
  if (previousScore === null) {
    return {
      change: currentScore,
      percentChange: null,
      trend: 'new'
    };
  }

  const change = currentScore - previousScore;
  const percentChange = previousScore > 0 
    ? (change / previousScore) * 100 
    : null;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (change > 2) {
    trend = 'up';
  } else if (change < -2) {
    trend = 'down';
  }

  return {
    change,
    percentChange,
    trend
  };
}

/**
 * Calculate competitive position
 */
export function calculateCompetitivePosition(
  businessRanking: number | null,
  competitorCount: number
): {
  position: 'leader' | 'contender' | 'follower' | 'absent';
  percentile: number | null;
  description: string;
} {
  if (businessRanking === null) {
    return {
      position: 'absent',
      percentile: null,
      description: 'Not ranked in AI responses'
    };
  }

  const totalPositions = competitorCount + 1;
  const percentile = ((totalPositions - businessRanking) / totalPositions) * 100;

  if (businessRanking === 1) {
    return {
      position: 'leader',
      percentile: 100,
      description: 'Top recommended business'
    };
  }

  if (businessRanking <= 3) {
    return {
      position: 'contender',
      percentile: Math.round(percentile),
      description: `Ranked #${businessRanking} among top recommendations`
    };
  }

  return {
    position: 'follower',
    percentile: Math.round(percentile),
    description: `Ranked #${businessRanking} among ${totalPositions} businesses`
  };
}

/**
 * Identify scoring opportunities
 */
export function identifyScoringOpportunities(
  platformScores: Record<AIPlatform, PlatformScoreBreakdown>
): Array<{
  priority: 'critical' | 'high' | 'medium' | 'low';
  platform: AIPlatform;
  issue: string;
  opportunity: string;
  potentialGain: number;
}> {
  const opportunities: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    platform: AIPlatform;
    issue: string;
    opportunity: string;
    potentialGain: number;
  }> = [];

  const platforms: AIPlatform[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];

  for (const platform of platforms) {
    const score = platformScores[platform];
    
    if (!score) continue;

    // Critical: Not mentioned at all
    if (!score.details.businessMentioned) {
      opportunities.push({
        priority: 'critical',
        platform,
        issue: `Not appearing in ${platform} responses`,
        opportunity: 'Increase online presence and content to appear in AI recommendations',
        potentialGain: 60 // Could gain 60+ points by appearing
      });
      continue;
    }

    // High: Mentioned but not ranked
    if (score.details.ranking === null) {
      opportunities.push({
        priority: 'high',
        platform,
        issue: `Mentioned on ${platform} but not ranked`,
        opportunity: 'Improve content and reviews to achieve ranked position',
        potentialGain: 30 // Could gain 30 points by getting ranked
      });
    }

    // Medium: Ranked but low position
    if (score.details.ranking && score.details.ranking > 3) {
      opportunities.push({
        priority: 'medium',
        platform,
        issue: `Ranked #${score.details.ranking} on ${platform}`,
        opportunity: 'Optimize content and reviews to move into top 3',
        potentialGain: 15 // Could gain 15 points by moving up
      });
    }

    // Low: Negative or neutral sentiment
    if (score.details.sentiment === 'negative') {
      opportunities.push({
        priority: 'high',
        platform,
        issue: `Negative sentiment on ${platform}`,
        opportunity: 'Address negative feedback and improve reputation',
        potentialGain: 20 // Could gain 20 points with positive sentiment
      });
    } else if (score.details.sentiment === 'neutral') {
      opportunities.push({
        priority: 'low',
        platform,
        issue: `Neutral sentiment on ${platform}`,
        opportunity: 'Build stronger positive reputation',
        potentialGain: 10 // Could gain 10 points with positive sentiment
      });
    }
  }

  // Sort by priority and potential gain
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  opportunities.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.potentialGain - a.potentialGain;
  });

  return opportunities;
}

/**
 * Calculate score velocity (rate of change)
 */
export function calculateScoreVelocity(
  scores: Array<{ date: Date; score: number }>
): {
  velocity: number; // Points per month
  trend: 'accelerating' | 'steady' | 'decelerating';
  momentum: 'positive' | 'negative' | 'neutral';
} {
  if (scores.length < 2) {
    return {
      velocity: 0,
      trend: 'steady',
      momentum: 'neutral'
    };
  }

  // Calculate velocity between first and last score
  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];
  const monthsDiff = (lastScore.date.getTime() - firstScore.date.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const velocity = monthsDiff > 0 ? (lastScore.score - firstScore.score) / monthsDiff : 0;

  // Determine momentum
  let momentum: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (velocity > 1) {
    momentum = 'positive';
  } else if (velocity < -1) {
    momentum = 'negative';
  }

  // Determine trend (if we have 3+ data points)
  let trend: 'accelerating' | 'steady' | 'decelerating' = 'steady';
  if (scores.length >= 3) {
    const recentVelocity = scores[scores.length - 1].score - scores[scores.length - 2].score;
    const previousVelocity = scores[scores.length - 2].score - scores[scores.length - 3].score;
    
    if (recentVelocity > previousVelocity + 2) {
      trend = 'accelerating';
    } else if (recentVelocity < previousVelocity - 2) {
      trend = 'decelerating';
    }
  }

  return {
    velocity: Math.round(velocity * 10) / 10,
    trend,
    momentum
  };
}