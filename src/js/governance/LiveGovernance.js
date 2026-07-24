/**
 * LiveGovernance - Continuous governance evaluation
 * 
 * Governance becomes continuous
 * Every graph modification updates:
 * - Policy status
 * - Health score
 * - Recommendations
 * - Violations
 * - Operational maturity
 */

import { PolicyEngine } from './PolicyEngine.js';
import { GovernanceScore } from './GovernanceScore.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { MaturityModel } from './MaturityModel.js';
import { AuditEngine } from './AuditEngine.js';

export class LiveGovernance {
  constructor(graphManager) {
    this.graphManager = graphManager;
    this.policyEngine = new PolicyEngine(graphManager);
    this.governanceScore = new GovernanceScore(graphManager, this.policyEngine);
    this.recommendationEngine = new RecommendationEngine(
      graphManager,
      this.policyEngine,
      this.governanceScore
    );
    this.maturityModel = new MaturityModel(this.governanceScore);
    this.auditEngine = new AuditEngine(graphManager, this.policyEngine);
    
    this.currentScore = null;
    this.currentMaturity = null;
    this.listeners = new Set();
  }

  /**
   * Initialize live governance
   */
  initialize(allObjects) {
    // Evaluate all objects
    this.policyEngine.evaluateAllObjects(allObjects);
    
    // Calculate initial governance score
    this.currentScore = this.governanceScore.calculateOverallScore(allObjects);
    
    // Assess initial maturity
    this.currentMaturity = this.maturityModel.assessMaturity(this.currentScore);
    
    // Generate recommendations
    this.recommendationEngine.generateFromViolations();
    this.recommendationEngine.generateFromMetrics(allObjects);
    this.recommendationEngine.generateFromGraphAnalysis(allObjects);
    
    // Log initialization
    this.auditEngine.logGovernanceScoreChange(
      0,
      this.currentScore.overall,
      this.currentScore.metrics,
      'system'
    );
    
    this.notifyListeners('initialized', {
      score: this.currentScore,
      maturity: this.currentMaturity
    });
  }

  /**
   * Handle graph modification
   */
  onGraphModified(relationId, modificationType, actor) {
    // Log the modification
    this.auditEngine.logGraphModification(relationId, modificationType, null, null, actor);
    
    // Re-evaluate affected objects
    this.reevaluateAffectedObjects(relationId, actor);
    
    // Recalculate governance score
    this.updateGovernanceScore(actor);
    
    // Update maturity
    this.updateMaturity(actor);
    
    // Regenerate recommendations
    this.updateRecommendations(actor);
    
    this.notifyListeners('graph_modified', { relationId, modificationType, actor });
  }

  /**
   * Handle object modification
   */
  onObjectModified(objectId, objectType, actor) {
    // Re-evaluate the object
    const object = { id: objectId, type: objectType };
    const results = this.policyEngine.evaluateObject(object);
    
    // Log policy executions
    for (const result of results) {
      this.auditEngine.logPolicyExecution(
        result.policy.id,
        objectId,
        objectType,
        result.evaluation,
        actor
      );
    }
    
    // Update governance score
    this.updateGovernanceScore(actor);
    
    this.notifyListeners('object_modified', { objectId, objectType, actor });
  }

  /**
   * Re-evaluate affected objects
   */
  reevaluateAffectedObjects(relationId, actor) {
    const relation = this.graphManager.getRelation(relationId);
    if (!relation) return;
    
    // Re-evaluate source object
    const sourceResults = this.policyEngine.evaluateObject({
      id: relation.sourceId,
      type: relation.sourceType
    });
    
    // Re-evaluate target object
    const targetResults = this.policyEngine.evaluateObject({
      id: relation.targetId,
      type: relation.targetType
    });
    
    // Log new violations
    for (const result of [...sourceResults, ...targetResults]) {
      if (result.violation) {
        this.auditEngine.logViolationCreation(
          result.violation.id,
          result.policy.id,
          result.violation.objectId,
          result.violation.objectType,
          actor
        );
      }
    }
  }

  /**
   * Update governance score
   */
  updateGovernanceScore(actor) {
    const previousScore = this.currentScore ? this.currentScore.overall : 0;
    
    // Get all objects from graph
    const allObjects = this.getAllObjectsFromGraph();
    this.currentScore = this.governanceScore.calculateOverallScore(allObjects);
    
    // Log if score changed significantly
    if (Math.abs(this.currentScore.overall - previousScore) > 5) {
      this.auditEngine.logGovernanceScoreChange(
        previousScore,
        this.currentScore.overall,
        this.currentScore.metrics,
        actor
      );
    }
    
    this.notifyListeners('score_updated', { score: this.currentScore, previousScore });
  }

  /**
   * Update maturity
   */
  updateMaturity(actor) {
    const previousMaturity = this.currentMaturity;
    this.currentMaturity = this.maturityModel.assessMaturity(this.currentScore);
    
    // Log if maturity level changed
    if (previousMaturity && previousMaturity.level !== this.currentMaturity.level) {
      this.auditEngine.logMaturityLevelChange(
        previousMaturity.level,
        this.currentMaturity.level,
        this.currentScore.overall,
        actor
      );
    }
    
    this.notifyListeners('maturity_updated', { maturity: this.currentMaturity, previousMaturity });
  }

  /**
   * Update recommendations
   */
  updateRecommendations(actor) {
    this.recommendationEngine.clearAllRecommendations();
    
    const allObjects = this.getAllObjectsFromGraph();
    this.recommendationEngine.generateFromViolations();
    this.recommendationEngine.generateFromMetrics(allObjects);
    this.recommendationEngine.generateFromGraphAnalysis(allObjects);
    
    this.notifyListeners('recommendations_updated', {
      count: this.recommendationEngine.getAllRecommendations().length
    });
  }

  /**
   * Get all objects from graph
   */
  getAllObjectsFromGraph() {
    const objectIds = new Set();
    
    for (const relation of this.graphManager.relations.values()) {
      if (relation.active) {
        objectIds.add(relation.sourceId);
        objectIds.add(relation.targetId);
      }
    }
    
    // Convert to object array (would need to fetch actual objects from storage)
    // For now, return placeholder objects
    return Array.from(objectIds).map(id => ({
      id,
      type: 'Unknown', // Would need to fetch from storage
      project: 'unknown'
    }));
  }

  /**
   * Get current governance state
   */
  getCurrentState() {
    return {
      score: this.currentScore,
      maturity: this.currentMaturity,
      violations: this.policyEngine.getViolationSummary(),
      recommendations: this.recommendationEngine.getRecommendationSummary(),
      compliance: this.policyEngine.getComplianceReport(),
      audit: this.auditEngine.getAuditStatistics()
    };
  }

  /**
   * Get governance dashboard data
   */
  getDashboardData() {
    const state = this.getCurrentState();
    const allObjects = this.getAllObjectsFromGraph();
    
    return {
      overall: {
        score: state.score.overall,
        grade: state.score.grade,
        maturity: state.maturity.name,
        maturityLevel: state.maturity.level
      },
      metrics: state.score.metrics,
      violations: {
        total: state.violations.total,
        unresolved: state.violations.unresolved,
        critical: state.violations.critical,
        high: state.violations.high,
        stale: state.violations.stale
      },
      recommendations: {
        total: state.recommendations.total,
        pending: state.recommendations.pending,
        critical: state.recommendations.byPriority.critical,
        high: state.recommendations.byPriority.high
      },
      compliance: {
        averageRate: state.compliance.averageComplianceRate,
        enabledPolicies: state.compliance.enabledPolicies,
        totalPolicies: state.compliance.totalPolicies
      },
      organizationalQuestions: this.governanceScore.answerQuestions(allObjects),
      recentActivity: state.audit.recentActivity.slice(0, 10)
    };
  }

  /**
   * Add listener for governance events
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    }
  }

  /**
   * Export governance state to JSON
   */
  exportToJSON() {
    return {
      policyEngine: this.policyEngine.exportToJSON(),
      recommendationEngine: this.recommendationEngine.exportToJSON(),
      auditEngine: this.auditEngine.exportToJSON(),
      currentState: this.getCurrentState()
    };
  }

  /**
   * Import governance state from JSON
   */
  importFromJSON(json) {
    this.policyEngine.importFromJSON(json.policyEngine);
    this.recommendationEngine.importFromJSON(json.recommendationEngine);
    this.auditEngine.importFromJSON(json.auditEngine);
    
    // Recalculate current state
    const allObjects = this.getAllObjectsFromGraph();
    this.currentScore = this.governanceScore.calculateOverallScore(allObjects);
    this.currentMaturity = this.maturityModel.assessMaturity(this.currentScore);
  }
}

export default LiveGovernance;
