/**
 * RecommendationEngine - Generates governance recommendations
 * 
 * Policies generate recommendations with priority levels
 * Every recommendation includes reason, related objects, expected benefit, estimated impact
 */

export class RecommendationEngine {
  constructor(graphManager, policyEngine, governanceScore) {
    this.graphManager = graphManager;
    this.policyEngine = policyEngine;
    this.governanceScore = governanceScore;
    this.recommendations = new Map();
    this.nextRecommendationId = 1;
  }

  /**
   * Generate recommendations from policy violations
   */
  generateFromViolations() {
    const violations = this.policyEngine.getUnresolvedViolations();
    
    for (const violation of violations) {
      const recommendation = this.createRecommendationFromViolation(violation);
      if (recommendation) {
        this.recommendations.set(recommendation.id, recommendation);
      }
    }
    
    return this.recommendations.size;
  }

  /**
   * Generate recommendations from governance metrics
   */
  generateFromMetrics(allObjects) {
    const governanceScore = this.governanceScore.calculateOverallScore(allObjects);
    
    for (const recommendation of governanceScore.recommendations) {
      const rec = this.createRecommendationFromMetric(recommendation);
      if (rec) {
        this.recommendations.set(rec.id, rec);
      }
    }
    
    return this.recommendations.size;
  }

  /**
   * Generate recommendations from graph analysis
   */
  generateFromGraphAnalysis(allObjects) {
    // Orphan objects
    const orphans = this.graphManager.detectOrphanObjects(allObjects.map(o => o.id));
    for (const orphanId of orphans) {
      this.createRecommendation({
        type: 'connect_object',
        priority: 'medium',
        title: 'Connect Orphan Object',
        description: `Object ${orphanId} has no relations. Consider connecting it to the graph.`,
        reason: 'Orphan objects reduce graph integrity',
        relatedObjects: [orphanId],
        expectedBenefit: 'Improved graph connectivity and traceability',
        estimatedImpact: 'medium'
      });
    }
    
    // Circular dependencies
    const cycles = this.graphManager.detectCircularDependencies();
    for (const cycle of cycles) {
      this.createRecommendation({
        type: 'resolve_circular_dependency',
        priority: 'critical',
        title: 'Resolve Circular Dependency',
        description: `Circular dependency detected: ${cycle.join(' → ')}`,
        reason: 'Circular dependencies cause operational issues',
        relatedObjects: cycle,
        expectedBenefit: 'Improved dependency health and operational consistency',
        estimatedImpact: 'high'
      });
    }
    
    return this.recommendations.size;
  }

  /**
   * Create recommendation from violation
   */
  createRecommendationFromViolation(violation) {
    const priority = this.mapSeverityToPriority(violation.severity);
    
    return this.createRecommendation({
      type: 'resolve_violation',
      priority,
      title: `Resolve Violation: ${violation.policy}`,
      description: violation.description,
      reason: 'Policy violation detected',
      relatedObjects: [violation.objectId],
      expectedBenefit: 'Improved policy compliance',
      estimatedImpact: violation.impact,
      violationId: violation.id,
      policyId: violation.policyId
    });
  }

  /**
   * Create recommendation from metric
   */
  createRecommendationFromMetric(metric) {
    return this.createRecommendation({
      type: 'improve_metric',
      priority: metric.priority,
      title: `Improve ${metric.area}`,
      description: metric.message,
      reason: `${metric.area} score is ${metric.currentScore}`,
      relatedObjects: [],
      expectedBenefit: `Improved ${metric.area.toLowerCase()}`,
      estimatedImpact: 'medium',
      metricArea: metric.area,
      currentScore: metric.currentScore
    });
  }

  /**
   * Create a recommendation
   */
  createRecommendation(data) {
    const id = this.generateRecommendationId();
    
    const recommendation = {
      id,
      type: data.type,
      priority: data.priority,
      title: data.title,
      description: data.description,
      reason: data.reason,
      relatedObjects: data.relatedObjects || [],
      expectedBenefit: data.expectedBenefit,
      estimatedImpact: data.estimatedImpact,
      status: 'pending',
      createdAt: new Date().toISOString(),
      acknowledged: false,
      dismissed: false,
      implemented: false,
      implementedAt: null,
      metadata: {
        violationId: data.violationId,
        policyId: data.policyId,
        metricArea: data.metricArea,
        currentScore: data.currentScore
      }
    };
    
    this.recommendations.set(id, recommendation);
    
    return recommendation;
  }

  /**
   * Map severity to priority
   */
  mapSeverityToPriority(severity) {
    const mapping = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return mapping[severity] || 'medium';
  }

  /**
   * Acknowledge a recommendation
   */
  acknowledgeRecommendation(recommendationId, actor) {
    const recommendation = this.recommendations.get(recommendationId);
    if (recommendation) {
      recommendation.acknowledged = true;
      recommendation.acknowledgedAt = new Date().toISOString();
      recommendation.acknowledgedBy = actor;
    }
    return recommendation;
  }

  /**
   * Dismiss a recommendation
   */
  dismissRecommendation(recommendationId, actor, reason) {
    const recommendation = this.recommendations.get(recommendationId);
    if (recommendation) {
      recommendation.dismissed = true;
      recommendation.dismissedAt = new Date().toISOString();
      recommendation.dismissedBy = actor;
      recommendation.dismissalReason = reason;
    }
    return recommendation;
  }

  /**
   * Mark recommendation as implemented
   */
  implementRecommendation(recommendationId, actor) {
    const recommendation = this.recommendations.get(recommendationId);
    if (recommendation) {
      recommendation.implemented = true;
      recommendation.implementedAt = new Date().toISOString();
      recommendation.implementedBy = actor;
      recommendation.status = 'completed';
    }
    return recommendation;
  }

  /**
   * Get recommendation by ID
   */
  getRecommendation(recommendationId) {
    return this.recommendations.get(recommendationId);
  }

  /**
   * Get all recommendations
   */
  getAllRecommendations() {
    return Array.from(this.recommendations.values());
  }

  /**
   * Get pending recommendations
   */
  getPendingRecommendations() {
    return Array.from(this.recommendations.values())
      .filter(r => !r.dismissed && !r.implemented);
  }

  /**
   * Get recommendations by priority
   */
  getRecommendationsByPriority(priority) {
    return Array.from(this.recommendations.values())
      .filter(r => r.priority === priority && !r.dismissed && !r.implemented);
  }

  /**
   * Get critical recommendations
   */
  getCriticalRecommendations() {
    return this.getRecommendationsByPriority('critical');
  }

  /**
   * Get recommendations for a specific object
   */
  getRecommendationsForObject(objectId) {
    return Array.from(this.recommendations.values())
      .filter(r => r.relatedObjects.includes(objectId) && !r.dismissed && !r.implemented);
  }

  /**
   * Get recommendation summary
   */
  getRecommendationSummary() {
    const recommendations = this.getAllRecommendations();
    const summary = {
      total: recommendations.length,
      pending: 0,
      acknowledged: 0,
      dismissed: 0,
      implemented: 0,
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {},
      averageImplementationTime: 0
    };
    
    const implementedRecommendations = recommendations.filter(r => r.implemented);
    const implementationTimes = implementedRecommendations
      .map(r => {
        if (r.implementedAt && r.createdAt) {
          const created = new Date(r.createdAt);
          const implemented = new Date(r.implementedAt);
          return Math.ceil((implemented - created) / (1000 * 60 * 60 * 24));
        }
        return null;
      })
      .filter(t => t !== null);
    
    if (implementationTimes.length > 0) {
      summary.averageImplementationTime = 
        implementationTimes.reduce((sum, time) => sum + time, 0) / implementationTimes.length;
    }
    
    for (const recommendation of recommendations) {
      if (recommendation.implemented) {
        summary.implemented++;
      } else if (recommendation.dismissed) {
        summary.dismissed++;
      } else if (recommendation.acknowledged) {
        summary.acknowledged++;
        summary.pending++;
      } else {
        summary.pending++;
      }
      
      if (summary.byPriority[recommendation.priority] !== undefined) {
        summary.byPriority[recommendation.priority]++;
      }
      
      summary.byType[recommendation.type] = 
        (summary.byType[recommendation.type] || 0) + 1;
    }
    
    return summary;
  }

  /**
   * Generate recommendation ID
   */
  generateRecommendationId() {
    return `REC-${String(this.nextRecommendationId++).padStart(6, '0')}`;
  }

  /**
   * Clear implemented recommendations
   */
  clearImplementedRecommendations() {
    for (const [id, recommendation] of this.recommendations) {
      if (recommendation.implemented) {
        this.recommendations.delete(id);
      }
    }
  }

  /**
   * Clear all recommendations
   */
  clearAllRecommendations() {
    this.recommendations.clear();
  }

  /**
   * Export to JSON
   */
  exportToJSON() {
    return {
      recommendations: Array.from(this.recommendations.values()),
      summary: this.getRecommendationSummary()
    };
  }

  /**
   * Import from JSON
   */
  importFromJSON(json) {
    this.recommendations.clear();
    
    for (const recommendationData of json.recommendations) {
      this.recommendations.set(recommendationData.id, recommendationData);
    }
    
    // Update next ID
    const maxId = Math.max(...json.recommendations.map(r => parseInt(r.id.split('-')[1])));
    this.nextRecommendationId = maxId + 1;
  }
}

export default RecommendationEngine;
