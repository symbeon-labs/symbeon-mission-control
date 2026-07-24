/**
 * MaturityModel - Organizational maturity assessment
 * 
 * Implements 5-level maturity model
 * Level 1: Ad Hoc
 * Level 2: Managed
 * Level 3: Defined
 * Level 4: Measured
 * Level 5: Optimized
 * 
 * Projects evolve automatically based on governance indicators
 */

export class MaturityModel {
  constructor(governanceScore) {
    this.governanceScore = governanceScore;
  }

  /**
   * Maturity levels
   */
  static LEVELS = {
    LEVEL_1: {
      id: 1,
      name: 'Ad Hoc',
      description: 'Chaotic, reactive processes',
      scoreRange: [0, 40],
      characteristics: [
        'No documented processes',
        'Ad-hoc decision making',
        'Minimal traceability',
        'No evidence requirements',
        'No knowledge capture'
      ]
    },
    LEVEL_2: {
      id: 2,
      name: 'Managed',
      description: 'Basic project management processes',
      scoreRange: [41, 60],
      characteristics: [
        'Basic processes documented',
        'Some decision tracking',
        'Limited traceability',
        'Basic evidence requirements',
        'Occasional knowledge capture'
      ]
    },
    LEVEL_3: {
      id: 3,
      name: 'Defined',
      description: 'Standardized processes',
      scoreRange: [61, 75],
      characteristics: [
        'Standardized processes',
        'Systematic decision tracking',
        'Good traceability',
        'Evidence requirements enforced',
        'Regular knowledge capture'
      ]
    },
    LEVEL_4: {
      id: 4,
      name: 'Measured',
      description: 'Quantitatively managed processes',
      scoreRange: [76, 90],
      characteristics: [
        'Quantitatively managed',
        'Comprehensive decision tracking',
        'Complete traceability',
        'Evidence coverage measured',
        'Knowledge reuse tracked'
      ]
    },
    LEVEL_5: {
      id: 5,
      name: 'Optimized',
      description: 'Continuously improving processes',
      scoreRange: [91, 100],
      characteristics: [
        'Continuously improving',
        'Predictive decision making',
        'Perfect traceability',
        'Evidence-driven operations',
        'Knowledge as strategic asset'
      ]
    }
  };

  /**
   * Assess maturity level from governance score
   */
  assessMaturity(governanceScore) {
    const score = governanceScore.overall;
    
    for (const [levelName, level] of Object.entries(MaturityModel.LEVELS)) {
      const [min, max] = level.scoreRange;
      if (score >= min && score <= max) {
        return {
          level: level.id,
          name: level.name,
          description: level.description,
          score,
          characteristics: level.characteristics,
          nextLevel: this.getNextLevel(level.id),
          recommendations: this.getLevelRecommendations(level.id, governanceScore.metrics)
        };
      }
    }
    
    return MaturityModel.LEVELS.LEVEL_1;
  }

  /**
   * Get next maturity level
   */
  getNextLevel(currentLevel) {
    if (currentLevel < 5) {
      return MaturityModel.LEVELS[`LEVEL_${currentLevel + 1}`];
    }
    return null;
  }

  /**
   * Get recommendations to reach next level
   */
  getLevelRecommendations(currentLevel, metrics) {
    const recommendations = [];
    
    switch (currentLevel) {
      case 1: // Ad Hoc → Managed
        recommendations.push({
          area: 'Process Documentation',
          action: 'Document basic processes',
          priority: 'high',
          targetMetric: 'documentationCompleteness',
          targetValue: 50
        });
        recommendations.push({
          area: 'Decision Tracking',
          action: 'Implement basic decision logging',
          priority: 'high',
          targetMetric: 'decisionTraceability',
          targetValue: 40
        });
        recommendations.push({
          area: 'Evidence Requirements',
          action: 'Define evidence requirements for critical decisions',
          priority: 'medium',
          targetMetric: 'evidenceCoverage',
          targetValue: 30
        });
        break;
        
      case 2: // Managed → Defined
        recommendations.push({
          area: 'Process Standardization',
          action: 'Standardize processes across projects',
          priority: 'high',
          targetMetric: 'operationalConsistency',
          targetValue: 60
        });
        recommendations.push({
          area: 'Decision Tracking',
          action: 'Implement systematic decision tracking',
          priority: 'high',
          targetMetric: 'decisionTraceability',
          targetValue: 70
        });
        recommendations.push({
          area: 'Knowledge Capture',
          action: 'Implement regular knowledge capture',
          priority: 'medium',
          targetMetric: 'knowledgeCapture',
          targetValue: 50
        });
        break;
        
      case 3: // Defined → Measured
        recommendations.push({
          area: 'Quantitative Management',
          action: 'Implement quantitative metrics for all processes',
          priority: 'high',
          targetMetric: 'graphIntegrity',
          targetValue: 80
        });
        recommendations.push({
          area: 'Traceability',
          action: 'Achieve complete traceability',
          priority: 'high',
          targetMetric: 'decisionTraceability',
          targetValue: 90
        });
        recommendations.push({
          area: 'Evidence Coverage',
          action: 'Measure and improve evidence coverage',
          priority: 'medium',
          targetMetric: 'evidenceCoverage',
          targetValue: 80
        });
        break;
        
      case 4: // Measured → Optimized
        recommendations.push({
          area: 'Continuous Improvement',
          action: 'Implement continuous improvement processes',
          priority: 'high',
          targetMetric: 'policyCompliance',
          targetValue: 95
        });
        recommendations.push({
          area: 'Predictive Decision Making',
          action: 'Implement predictive analytics for decisions',
          priority: 'high',
          targetMetric: 'knowledgeCapture',
          targetValue: 90
        });
        recommendations.push({
          area: 'Knowledge Strategy',
          action: 'Treat knowledge as strategic asset',
          priority: 'medium',
          targetMetric: 'knowledgeCapture',
          targetValue: 95
        });
        break;
        
      case 5: // Optimized - maintain
        recommendations.push({
          area: 'Innovation',
          action: 'Continue innovation and optimization',
          priority: 'low',
          targetMetric: 'overall',
          targetValue: 100
        });
        break;
    }
    
    return recommendations;
  }

  /**
   * Get maturity gap analysis
   */
  getMaturityGap(currentScore, targetLevel = 5) {
    const targetLevelData = MaturityModel.LEVELS[`LEVEL_${targetLevel}`];
    const targetScore = targetLevelData.scoreRange[0];
    const gap = targetScore - currentScore;
    
    return {
      currentScore,
      targetScore,
      gap,
      gapPercentage: Math.round((gap / targetScore) * 100),
      targetLevel: targetLevelData.name,
      estimatedTimeToReach: this.estimateTimeToReach(gap)
    };
  }

  /**
   * Estimate time to reach target level (in months)
   */
  estimateTimeToReach(gap) {
    if (gap <= 0) return 0;
    // Rough estimate: 10 points per month with focused effort
    return Math.ceil(gap / 10);
  }

  /**
   * Get maturity roadmap
   */
  getMaturityRoadmap(currentScore) {
    const currentAssessment = this.assessMaturity(currentScore);
    const roadmap = [];
    
    let currentLevel = currentAssessment.level;
    while (currentLevel < 5) {
      const nextLevel = this.getNextLevel(currentLevel);
      if (nextLevel) {
        roadmap.push({
          from: currentLevel,
          to: nextLevel.id,
          toName: nextLevel.name,
          targetScore: nextLevel.scoreRange[0],
          estimatedDuration: this.estimateTimeToReach(nextLevel.scoreRange[0] - currentScore),
          keyFocusAreas: this.getLevelRecommendations(currentLevel, {}).map(r => r.area)
        });
        currentLevel = nextLevel.id;
      } else {
        break;
      }
    }
    
    return roadmap;
  }

  /**
   * Get maturity comparison with industry benchmarks
   */
  getIndustryComparison(currentScore) {
    const benchmarks = {
      industry: {
        average: 65,
        topQuartile: 85,
        median: 60,
        bottomQuartile: 45
      },
      similarOrganizations: {
        average: 70,
        topQuartile: 88,
        median: 68,
        bottomQuartile: 52
      }
    };
    
    return {
      current: currentScore,
      industry: benchmarks.industry,
      similarOrganizations: benchmarks.similarOrganizations,
      percentile: this.calculatePercentile(currentScore, benchmarks.industry),
      ranking: this.getRanking(currentScore, benchmarks.industry)
    };
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(score, benchmarks) {
    if (score >= benchmarks.topQuartile) return 75;
    if (score >= benchmarks.median) return 50;
    if (score >= benchmarks.bottomQuartile) return 25;
    return 10;
  }

  /**
   * Get ranking description
   */
  getRanking(score, benchmarks) {
    if (score >= benchmarks.topQuartile) return 'Top Quartile';
    if (score >= benchmarks.median) return 'Above Average';
    if (score >= benchmarks.bottomQuartile) return 'Below Average';
    return 'Bottom Quartile';
  }

  /**
   * Generate maturity report
   */
  generateMaturityReport(governanceScore, allObjects) {
    const assessment = this.assessMaturity(governanceScore);
    const gap = this.getMaturityGap(governanceScore.overall);
    const roadmap = this.getMaturityRoadmap(governanceScore.overall);
    const comparison = this.getIndustryComparison(governanceScore.overall);
    
    return {
      current: assessment,
      gap,
      roadmap,
      comparison,
      generatedAt: new Date().toISOString()
    };
  }
}

export default MaturityModel;
