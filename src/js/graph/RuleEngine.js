/**
 * RuleEngine - Validates operational graph integrity
 * 
 * Enforces governance rules and detects violations
 * Every violation generates alerts
 */

import { Relation } from './Relation.js';

export class RuleEngine {
  constructor(graphManager) {
    this.graphManager = graphManager;
    this.rules = new Map();
    this.violations = [];
    this.initializeDefaultRules();
  }

  /**
   * Initialize default governance rules
   */
  initializeDefaultRules() {
    // Rule: Completed Task must have Evidence
    this.addRule({
      id: 'RULE-001',
      name: 'Completed Task Evidence',
      description: 'Completed tasks must have at least one evidence object',
      severity: 'high',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Task') return { valid: true };
        
        const outgoing = graph.getOutgoingRelations(objectId);
        const hasEvidence = outgoing.some(r => 
          r.relationType === Relation.TYPES.PROVES || 
          r.relationType === Relation.TYPES.ATTACHED_TO
        );
        
        // Check if task is completed (would need to check object status)
        // For now, we'll check if it has evidence relations
        return {
          valid: hasEvidence,
          message: hasEvidence ? '' : 'Task has no evidence attached'
        };
      }
    });

    // Rule: Approved Decision must have Approval
    this.addRule({
      id: 'RULE-002',
      name: 'Decision Approval',
      description: 'Approved decisions must have an approval relation',
      severity: 'high',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Decision') return { valid: true };
        
        const incoming = graph.getIncomingRelations(objectId);
        const hasApproval = incoming.some(r => 
          r.relationType === Relation.TYPES.APPROVES
        );
        
        return {
          valid: hasApproval,
          message: hasApproval ? '' : 'Decision has no approval'
        };
      }
    });

    // Rule: Release must contain Milestone
    this.addRule({
      id: 'RULE-003',
      name: 'Release Milestone',
      description: 'Releases must contain at least one milestone',
      severity: 'high',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Release') return { valid: true };
        
        const outgoing = graph.getOutgoingRelations(objectId);
        const hasMilestone = outgoing.some(r => 
          r.relationType === Relation.TYPES.CONTAINS &&
          r.targetType === 'Milestone'
        );
        
        return {
          valid: hasMilestone,
          message: hasMilestone ? '' : 'Release contains no milestones'
        };
      }
    });

    // Rule: Knowledge must reference Origin
    this.addRule({
      id: 'RULE-004',
      name: 'Knowledge Origin',
      description: 'Knowledge objects must reference their origin (task, decision, etc.)',
      severity: 'medium',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Knowledge') return { valid: true };
        
        const incoming = graph.getIncomingRelations(objectId);
        const hasOrigin = incoming.some(r => 
          r.relationType === Relation.TYPES.LEARNS_FROM ||
          r.relationType === Relation.TYPES.DERIVES_FROM
        );
        
        return {
          valid: hasOrigin,
          message: hasOrigin ? '' : 'Knowledge has no origin reference'
        };
      }
    });

    // Rule: No circular dependencies
    this.addRule({
      id: 'RULE-005',
      name: 'Circular Dependencies',
      description: 'Objects must not have circular dependency chains',
      severity: 'critical',
      check: (objectId, objectType, graph) => {
        const cycles = graph.detectCircularDependencies();
        const isInCycle = cycles.some(cycle => cycle.includes(objectId));
        
        return {
          valid: !isInCycle,
          message: isInCycle ? 'Object is part of a circular dependency' : ''
        };
      }
    });

    // Rule: Document must have reviewer
    this.addRule({
      id: 'RULE-006',
      name: 'Document Review',
      description: 'Documents must have at least one reviewer before approval',
      severity: 'medium',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Document') return { valid: true };
        
        const incoming = graph.getIncomingRelations(objectId);
        const hasReviewer = incoming.some(r => 
          r.relationType === Relation.TYPES.VALIDATES
        );
        
        return {
          valid: hasReviewer,
          message: hasReviewer ? '' : 'Document has no reviewer'
        };
      }
    });

    // Rule: Milestone must have acceptance criteria
    this.addRule({
      id: 'RULE-007',
      name: 'Milestone Acceptance Criteria',
      description: 'Milestones must have defined acceptance criteria',
      severity: 'medium',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Milestone') return { valid: true };
        
        // This would check the milestone object itself
        // For now, we'll check if it has validation relations
        const incoming = graph.getIncomingRelations(objectId);
        const hasValidation = incoming.some(r => 
          r.relationType === Relation.TYPES.VALIDATES
        );
        
        return {
          valid: hasValidation,
          message: hasValidation ? '' : 'Milestone has no validation criteria'
        };
      }
    });

    // Rule: Evidence must be verified
    this.addRule({
      id: 'RULE-008',
      name: 'Evidence Verification',
      description: 'Evidence objects must be verified',
      severity: 'high',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Evidence') return { valid: true };
        
        // This would check the evidence object's verified status
        // For now, we'll check if it has a validation relation
        const incoming = graph.getIncomingRelations(objectId);
        const hasValidation = incoming.some(r => 
          r.relationType === Relation.TYPES.VALIDATES
        );
        
        return {
          valid: hasValidation,
          message: hasValidation ? '' : 'Evidence is not verified'
        };
      }
    });

    // Rule: Task must belong to Milestone or Project
    this.addRule({
      id: 'RULE-009',
      name: 'Task Assignment',
      description: 'Tasks must belong to a milestone or project',
      severity: 'medium',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Task') return { valid: true };
        
        const outgoing = graph.getOutgoingRelations(objectId);
        const hasAssignment = outgoing.some(r => 
          r.relationType === Relation.TYPES.BELONGS_TO
        );
        
        return {
          valid: hasAssignment,
          message: hasAssignment ? '' : 'Task is not assigned to milestone or project'
        };
      }
    });

    // Rule: Decision must generate action
    this.addRule({
      id: 'RULE-010',
      name: 'Decision Action',
      description: 'Decisions must generate at least one action (task, milestone, etc.)',
      severity: 'medium',
      check: (objectId, objectType, graph) => {
        if (objectType !== 'Decision') return { valid: true };
        
        const outgoing = graph.getOutgoingRelations(objectId);
        const hasAction = outgoing.some(r => 
          r.relationType === Relation.TYPES.CREATES ||
          r.relationType === Relation.TYPES.GENERATES
        );
        
        return {
          valid: hasAction,
          message: hasAction ? '' : 'Decision generates no actions'
        };
      }
    });
  }

  /**
   * Add a custom rule
   */
  addRule(rule) {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId) {
    this.rules.delete(ruleId);
  }

  /**
   * Validate a single object against all applicable rules
   */
  validateObject(objectId, objectType) {
    const results = [];
    
    for (const [ruleId, rule] of this.rules) {
      const result = rule.check(objectId, objectType, this.graphManager);
      
      if (!result.valid) {
        results.push({
          ruleId,
          ruleName: rule.name,
          severity: rule.severity,
          message: result.message,
          objectId,
          objectType
        });
      }
    }
    
    return results;
  }

  /**
   * Validate all objects in the graph
   */
  validateAllObjects(objects) {
    this.violations = [];
    
    for (const object of objects) {
      const violations = this.validateObject(object.id, object.type);
      this.violations.push(...violations);
    }
    
    return this.violations;
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity) {
    return this.violations.filter(v => v.severity === severity);
  }

  /**
   * Get violations by object
   */
  getViolationsByObject(objectId) {
    return this.violations.filter(v => v.objectId === objectId);
  }

  /**
   * Get critical violations
   */
  getCriticalViolations() {
    return this.getViolationsBySeverity('critical');
  }

  /**
   * Get high severity violations
   */
  getHighSeverityViolations() {
    return this.getViolationsBySeverity('high');
  }

  /**
   * Get violation summary
   */
  getViolationSummary() {
    const summary = {
      total: this.violations.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      byObjectType: {},
      byRule: {}
    };
    
    for (const violation of this.violations) {
      // Count by severity
      summary[violation.severity]++;
      
      // Count by object type
      summary.byObjectType[violation.objectType] = 
        (summary.byObjectType[violation.objectType] || 0) + 1;
      
      // Count by rule
      summary.byRule[violation.ruleId] = 
        (summary.byRule[violation.ruleId] || 0) + 1;
    }
    
    return summary;
  }

  /**
   * Check if object has any violations
   */
  hasViolations(objectId) {
    return this.violations.some(v => v.objectId === objectId);
  }

  /**
   * Get health score based on violations
   */
  calculateHealthScore(totalObjects) {
    if (totalObjects === 0) return 100;
    
    const violations = this.violations.length;
    const criticalWeight = 10;
    const highWeight = 5;
    const mediumWeight = 2;
    const lowWeight = 1;
    
    const weightedViolations = 
      this.getCriticalViolations().length * criticalWeight +
      this.getHighSeverityViolations().length * highWeight +
      this.getViolationsBySeverity('medium').length * mediumWeight +
      this.getViolationsBySeverity('low').length * lowWeight;
    
    const maxPossibleScore = totalObjects * 10;
    const score = Math.max(0, 100 - (weightedViolations / maxPossibleScore * 100));
    
    return Math.round(score);
  }

  /**
   * Generate violation report
   */
  generateViolationReport() {
    const summary = this.getViolationSummary();
    
    return {
      summary,
      violations: this.violations,
      healthScore: this.calculateHealthScore(summary.total),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clear violations
   */
  clearViolations() {
    this.violations = [];
  }
}

export default RuleEngine;
