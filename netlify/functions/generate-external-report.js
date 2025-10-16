// netlify/functions/generate-external-report.js
// Server-side function for async AI visibility report generation
// This keeps API keys secure and handles long-running operations

const { createClient } = require('@supabase/supabase-js');

// NOTE: This is a simplified implementation showing the structure.
// In production, you would import the actual AIVisibilityService.
// For now, this provides the framework for async report generation.

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const {
      report_id,
      target_website,
      business_name,
      business_type,
      business_location,
      competitor_websites
    } = body;

    console.log('🚀 Starting external report generation:', {
      report_id,
      target_website,
      business_type,
      business_location
    });

    // Initialize Supabase with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Step 1: Update status to 'generating'
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'generating',
        generation_started_at: new Date().toISOString()
      })
      .eq('id', report_id);

    console.log('✅ Status updated to generating');

    // Step 2: Generate AI visibility report
    // NOTE: In production, import and use actual AIVisibilityService
    const startTime = Date.now();

    try {
      // Import the AI Visibility Service
      // This would be: const { AIVisibilityService } = require('../../src/lib/aiVisibilityService');
      // For TypeScript, you may need to compile to JS first or use a bundler

      // PRODUCTION CODE (uncomment when ready):
      /*
      const { AIVisibilityService } = require('../../dist/lib/aiVisibilityService');
      const service = new AIVisibilityService();
      
      const report = await service.generateMonthlyReport({
        organization_id: report_id, // Temporary org ID
        business_name: business_name || target_website,
        business_type,
        location: business_location,
        query_count: 10,
        platforms: ['chatgpt', 'claude', 'gemini', 'perplexity']
      });
      */

      // PLACEHOLDER FOR TESTING (remove in production):
      // This simulates report generation
      console.log('⚠️  Using placeholder report generation');
      console.log('   In production, replace with actual AIVisibilityService');
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing

      const report = {
        id: report_id,
        organization_id: report_id,
        report_month: new Date().toISOString().slice(0, 7),
        status: 'completed',
        overall_score: 75 + Math.floor(Math.random() * 20),
        platform_scores: [
          { platform: 'chatgpt', score: 80 + Math.floor(Math.random() * 15) },
          { platform: 'claude', score: 70 + Math.floor(Math.random() * 20) },
          { platform: 'gemini', score: 75 + Math.floor(Math.random() * 20) },
          { platform: 'perplexity', score: 85 + Math.floor(Math.random() * 10) }
        ],
        content_gaps: [
          {
            id: `gap-${Date.now()}-1`,
            gap_type: 'structural',
            gap_title: 'Limited Online Presence',
            gap_description: 'Business has minimal content across major platforms',
            severity: 'critical'
          }
        ],
        priority_actions: [
          {
            id: `action-${Date.now()}-1`,
            action_title: 'Improve Google Business Profile',
            action_description: 'Complete all profile sections and add photos',
            priority: 'high'
          }
        ]
      };

      const duration = Date.now() - startTime;

      console.log('✅ Report generated successfully');
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Overall Score: ${report.overall_score}/100`);

      // Step 3: Extract and structure data
      const contentGapAnalysis = {
        structural_gaps: report.content_gaps.filter(g => g.gap_type === 'structural'),
        thematic_gaps: report.content_gaps.filter(g => g.gap_type === 'thematic'),
        critical_topic_gaps: report.content_gaps.filter(g => g.gap_type === 'critical_topic'),
        significant_topic_gaps: report.content_gaps.filter(g => g.gap_type === 'significant_topic'),
        total_gaps: report.content_gaps.length,
        severity_breakdown: {
          critical: report.content_gaps.filter(g => g.severity === 'critical').length,
          significant: report.content_gaps.filter(g => g.severity === 'significant').length,
          moderate: report.content_gaps.filter(g => g.severity === 'moderate').length
        }
      };

      const aiPlatformScores = {};
      report.platform_scores.forEach(score => {
        aiPlatformScores[score.platform] = score.score;
      });

      // Calculate API cost (approximately $0.36 per report with 4 platforms × 10 queries)
      const apiCost = 0.36;
      const queryCount = 10;

      console.log('💰 API Cost:', apiCost);

      // Step 4: Update report with results
      const { error: updateError } = await supabase
        .from('ai_visibility_external_reports')
        .update({
          status: 'completed',
          report_data: report,
          content_gap_analysis: contentGapAnalysis,
          ai_platform_scores: aiPlatformScores,
          recommendations: report.priority_actions,
          generation_completed_at: new Date().toISOString(),
          processing_duration_ms: duration,
          api_cost_usd: apiCost,
          query_count: queryCount
        })
        .eq('id', report_id);

      if (updateError) {
        throw new Error('Failed to update report: ' + updateError.message);
      }

      console.log('✅ Report saved to database');

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          report_id,
          message: 'Report generated successfully',
          overall_score: report.overall_score,
          processing_time_ms: duration
        })
      };

    } catch (generationError) {
      console.error('❌ Error during report generation:', generationError);

      // Update status to error
      await supabase
        .from('ai_visibility_external_reports')
        .update({
          status: 'error',
          error_message: generationError.message,
          generation_completed_at: new Date().toISOString()
        })
        .eq('id', report_id);

      throw generationError;
    }

  } catch (error) {
    console.error('❌ Function error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};