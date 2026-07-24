/**
 * PolicyEngine - Executes governance policies
 * 
 * Policies execute automatically whenever the graph changes
 * Every policy is validated continuously
 * Every violation generates operational consequences
 */

import { Policy } from './Policy.js';
import { Violation } from './Violation.js';

export class PolicyEngine {
  constructor(graphManager) {
    this.graphManager = graphManager;
    this.policies = new Map();
    this.violations = new Map();
    this.nextPolicyId = 1;
    this.nextViolationId = 1;
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default governance policies
   */
  initializeDefaultPolicies() {
    // Policy: Completed Task must have Evidence
    this.addPolicy(new Policy({
      id: this.generatePolicyId(),
      title: 'Completed Task Evidence',
      description: 'Completed tasks must have at least one evidence object',
      category: Policy.CATEGORIES.EVIDENCE,
      severity: Policy.SEVERITY.HIGH,
      enabled: true,
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'completed'
        },
        {
          field: 'evidence',
          operator: 'is_empty',
          value: true
        }
      ],
      actions: [
        {
          type: 'create_violation',
          parameters: {
            severity: 'high',
            message: 'Task completed without evidence'
          }
        },
        {
          type: 'notify_responsible',
          parameters: {}
        },
        {
          type: 'generate_recommendation',
          parameters: {
            recommendation: 'Attach evidence to completed task'
          }
        }
      ]
    }));

    // Policy: Approved Decision must have Approval
    this.addPolicy(new Policy({
      id: this.generatePolicyId(),
      title: 'Decision Approval',
      description: 'Approved decisions must have an approval relation',
      category: Policy.CATEGORIES.GOVERNANCE,
      severity: Policy.SEVERITY.HIGH,
      enabled: true,
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'approved'
        },
        {
          field: 'approver',
          operator: 'is_empty',
          value: true
        }
      ],
      actions: [
        {
          type: 'create_violation',
          parameters: {
            severity: 'high',
            message: 'Decision approved without approver'
          }
        },
        {
          type: 'require_approval',
          parameters: {}
        }
      ]
    }));

    // Policy: Release must contain Milestone
    this.addPolicy(new Policy({
      id: this.generatePolicyId(),
      title: 'Release Milestone',
      description: 'Releases must contain at least one milestone',
      category: Policy.CATEGORIES.DEPLOYMENT,
      severity: Policy.SEVERITY.HIGH,
      enabled: true,
      conditions: [
        {
          field: 'type',
          operator: 'equals',
          value: 'Release'
        },
        {
          field: 'related_release',
          operator: 'is_empty',
          value: true
        }
      ],
      actions: [
        {
          type: 'create_violation',
          parameters: {
            severity: 'high',
            message: 'Release contains no milestones'
          }
        },
        {
          type: 'block_operation',
          parameters: {}
        }
      ]
    }));

    // Policy: Knowledge must reference Origin
    this.addPolicy(new Policy({
      id: this.generatePolicyId(),
      title: 'Knowledge Origin',
      description: 'Knowledge objects must reference their origin',
      category: Policy.CATEGORIES.KNOWLEDGE,
      severity: Policy.SEVERITY.MEDIUM,
      enabled: true,
      conditions: [
        {
          field: 'type',
          operator: 'equals',
          value: 'Knowledge'
        },
        {
          field: 'source_id',
          operator: 'is_empty',
          value: true
        }
      ],
      actions: [
        {
          type: 'create_violation',
          parameters: {
            severity: 'medium',
            message: 'Knowledge has no origin reference'
          }
        },
        {
          type: 'generate_recommendation',
          parameters: {
            recommendation: 'Link knowledge to originating task or decision'
          }
        }
      ]
    }));

    // Policy: Document must have reviewer
    this.addPolicy(new Policy({
      id: this.generatePolicyId(),
      title: 'Document Review',
      description: 'Documents must have at least one reviewer',
      category: Policy.CATEGORIES.DOCUMENTATION,
      severity: Policy.SEVERITY.MEDIUM,
      enabled: true,
      conditions: [
        {
          field: 'type',
          operator: 'equals',
          value: 'Document'
        },
        {
          field: 'reviewed_by',
          operator: 'is_empty',
          value: true
        }
      ],
      actions: [
        {
          type: 'create_violation',
          parameters: {
            severity: 'medium',
            message: 'Document has no reviewer'
          }
        },
        {
          type: 'generate_recommendation',
          parameters: {
            recommendation: 'Assign reviewer to document'
          }
        }
      ]
    }));

    // Policy: Risk must have mitigation
    this.addPolicy(new Policy({
      id: this.generatePolicyId(),
      title: 'Risk Mitigation',
      description: 'High and critical risks must have mitigation tasks',
      category: Policy.CATEGORIES.RISK,
      severity: Policy.SEVERITY.HIGH,
      enabled: true,
      conditions: [
        {
          field: 'type',
          operator: 'equals',
          value: 'Risk'
        },
        {
          field: 'impact',
          operator: 'contains',
          value: 'high'
        },
        {
          field: 'has_relation',
          operator: 'equals',
          value: 'IMPLEMENTS'
        }
      ],
      actions: [
        {
          type: 'create_violation',
          parameters: {
            severity: 'high',
            message: 'High/Critical risk has no mitigation'
          }
        },
        {
          type: 'generate_recommendation',
          parameters: {
            recommendation: 'Create mitigation tasks for this risk'
          }
        }
      ]
    }));

    // Policy: Circular Dependencies
    this.addPolicy(new Policy({
      id: this.generatePolicyId(),
      title: 'Circular Dependencies',
      description: 'Objects must not have circular dependency chains',
      category: Policy.CATEGORIES.GOVERNANCE,
      severity: Policy.SEVERITY.CRITICAL,
      enabled: true,
      conditions: [
        {
          field: 'circular_dependency',
          operator: 'equals',
          value: true
        }
      ],
      actions: [
        {
          type: 'create_violation',
          parameters: {
            severity: 'critical',
            message: 'Circular dependency detected'
          }
        },
        {
          type: 'block_operation',
          parameters: {}
        },
        {
          type: 'notify_responsible',
          parameters: {}
        }
      ]
    }));
  }

  /**
   * Add a policy
   */
  addPolicy(policy) {
    this.policies.set(policy.id, policy);
  }

  /**
   * Remove a policy
   */
  removePolicy(policyId) {
    this.policies.delete(policyId);
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId) {
    return this.policies.get(policyId);
  }

  /**
   * Get all enabled policies
   */
  getEnabledPolicies() {
    return Array.from(this.policies.values()).filter(p => p.enabled);
  }

  /**
   * Get policies by category
   */
  getPoliciesByCategory(category) {
    return Array.from(this.policies.values()).filter(p => p.category === category);
  }

  /**
   * Evaluate all policies for an object
   */
  evaluateObject(object) {
    const results = [];
    const enabledPolicies = this.getEnabledPolicies();

    for (const policy of enabledPolicies) {
      policy.recordExecution();
      
      const evaluation = policy.evaluateConditions(object, this.graphManager);
      
      if (!evaluation.passed) {
        const violation = this.createViolation(policy, object, evaluation);
        results.push({
          policy,
          evaluation,
          violation,
          actions: policy.executeActions(object, this.graphManager, { evaluation })
        });
      }
    }

    return results;
  }

  /**
   * Evaluate all policies for all objects
   */
  evaluateAllObjects(objects) {
    const allResults = [];
    
    for (const object of objects) {
      const results = this.evaluateObject(object);
      allResults.push(...results);
    }
    
    return allResults;
  }

  /**
   * Create a violation
   */
  createViolation(policy, object, evaluation) {
    const violationId = this.generateViolationId();
    
    const violation = new Violation({
      id: violationId,
      title: `Policy Violation: ${policy.title}`,
      description: evaluation.reason,
      policy: policy.title,
      policyId: policy.id,
      severity: policy.severity,
      objectId: object.id,
      objectType: object.type,
      project: object.project,
      owner: object.owner,
      context: {
        failedCondition: evaluation.failedCondition,
        allResults: evaluation.allResults
      }
    });
    
    this.violations.set(violationId, violation);
    policy.recordViolation();
    
    return violation;
  }

  /**
   * Get violation by ID
   */
  getViolation(violationId) {
    return this.violations.get(violationId);
  }

  /**
   * Get all violations
   */
  getAllViolations() {
    return Array.from(this.violations.values());
  }

  /**
   * Get unresolved violations
   */
  getUnresolvedViolations() {
    return Array.from(this.violations.values()).filter(v => !v.resolved);
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity) {
    return Array.from(this.violations.values()).filter(v => v.severity === severity);
  }

  /**
   * Get violations for a specific object
   */
  getViolationsForObject(objectId) {
    return Array.from(this.violations.values()).filter(v => v.objectId === objectId);
  }

  /**
   * Get violations for a specific policy
   */
  getViolationsForPolicy(policyId) {
    return Array.from(this.violations.values()).filter(v => v.policyId === policyId);
  }

  /**
   * Get critical violations
   */
  getCriticalViolations() {
    return this.getViolationsBySeverity('critical');
  }

  /**
   * Get stale violations (older than 30 days and unresolved)
   */
  getStaleViolations() {
    return Array.from(this.violations.values()).filter(v => v.isStale());
  }

  /**
   * Resolve a violation
   */
  resolveViolation(violationId, resolver, resolution) {
    const violation = this.violations.get(violationId);
    if (violation) {
      violation.resolve(resolver, resolution);
    }
    return violation;
  }

  /**
   * Reopen a violation
   */
  reopenViolation(violationId, actor) {
    const violation = this.violations.get(violationId);
    if (violation) {
      violation.reopen(actor);
    }
    return violation;
  }

  /**
   * Get violation summary
   */
  getViolationSummary() {
    const violations = this.getAllViolations();
    const summary = {
      total: violations.length,
      unresolved: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      stale: 0,
      byPolicy: {},
      byObjectType: {},
      averageResolutionTime: 0
    };
    
    const resolvedViolations = violations.filter(v => v.resolved);
    const resolutionTimes = resolvedViolations
      .map(v => v.getResolutionTimeInDays())
      .filter(t => t !== null);
    
    if (resolutionTimes.length > 0) {
      summary.averageResolutionTime = 
        resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;
    }
    
    for (const violation of violations) {
      if (!violation.resolved) summary.unresolved++;
      else summary.resolved++;
      
      summary[violation.severity]++;
      
      if (violation.isStale()) summary.stale++;
      
      summary.byPolicy[violation.policyId] = 
        (summary.byPolicy[violation.policyId] || 0) + 1;
      
      summary.byObjectType[violation.objectType] = 
        (summary.byObjectType[violation.objectType] || 0) + 1;
    }
    
    return summary;
  }

  /**
   * Get policy compliance report
   */
  getComplianceReport() {
    const policies = Array.from(this.policies.values());
    const report = {
      totalPolicies: policies.length,
      enabledPolicies: policies.filter(p => p.enabled).length,
      averageComplianceRate: 0,
      byCategory: {},
      topViolatingPolicies: []
    };
    
    let totalCompliance = 0;
    
    for (const policy of policies) {
      const compliance = policy.getComplianceRate();
      totalCompliance += compliance;
      
      report.byCategory[policy.category] = report.byCategory[policy.category] || {
        count: 0,
        totalCompliance: 0
      };
      report.byCategory[policy.category].count++;
      report.byCategory[policy.category].totalCompliance += compliance;
    }
    
    if (policies.length > 0) {
      report.averageComplianceRate = Math.round(totalCompliance / policies.length);
    }
    
    // Calculate average compliance by category
    for (const category in report.byCategory) {
      const data = report.byCategory[category];
      data.averageCompliance = Math.round(data.totalCompliance / data.count);
    }
    
    // Get top violating policies
    report.topViolatingPolicies = policies
      .sort((a, b) => b.violationCount - a.violationCount)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        title: p.title,
        category: p.category,
        severity: p.severity,
        violationCount: p.violationCount,
        executionCount: p.executionCount,
        complianceRate: p.getComplianceRate()
      }));
    
    return report;
  }

  /**
   * Generate policy ID
   */
  generatePolicyId() {
    return `POL-${String(this.nextPolicyId++).padStart(6, '0')}`;
  }

  /**
   * Generate violation ID
   */
  generateViolationId() {
    return `VIOL-${String(this.nextViolationId++).padStart(6, '0')}`;
  }

  /**
   * Export to JSON
   */
  exportToJSON() {
    return {
      policies: Array.from(this.policies.values()).map(p => p.toJSON()),
      violations: Array.from(this.violations.values()).map(v => v.toJSON()),
      summary: {
        violationSummary: this.getViolationSummary(),
        complianceReport: this.getComplianceReport()
      }
    };
  }

  /**
   * Import from JSON
   */
  importFromJSON(json) {
    this.policies.clear();
    this.violations.clear();
    
    for (const policyData of json.policies) {
      const policy = Policy.fromJSON(policyData);
      this.policies.set(policy.id, policy);
    }
    
    for (const violationData of json.violations) {
      const violation = Violation.fromJSON(violationData);
      this.violations.set(violation.id, violation);
    }
    
    // Update next IDs
    const maxPolicyId = Math.max(...json.policies.map(p => parseInt(p.id.split('-')[1])));
    const maxViolationId = Math.max(...json.violations.map(v => parseInt(v.id.split('-')[1])));
    this.nextPolicyId = maxPolicyId + 1;
    this.nextViolationId = maxViolationId + 1;
  }
}

export default PolicyEngine;
