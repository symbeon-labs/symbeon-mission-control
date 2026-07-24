/**
 * Policy - Executable governance policy
 * Extends OperationalObject
 * 
 * Policies are executable governance rules
 * Every policy is validated continuously
 * Every violation generates operational consequences
 */

import { OperationalObject } from '../core/OperationalObject.js';

export class Policy extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.category = data.category || 'governance';
    this.severity = data.severity || 'medium';
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    this.conditions = data.conditions || [];
    this.actions = data.actions || [];
    this.exceptions = data.exceptions || [];
    this.executionCount = data.executionCount || 0;
    this.violationCount = data.violationCount || 0;
    this.lastExecuted = data.lastExecuted || null;
    this.lastViolation = data.lastViolation || null;
  }

  /**
   * Policy categories
   */
  static CATEGORIES = {
    GOVERNANCE: 'governance',
    COMPLIANCE: 'compliance',
    SECURITY: 'security',
    COMMERCIAL: 'commercial',
    FINANCIAL: 'financial',
    DEVELOPMENT: 'development',
    QUALITY: 'quality',
    EVIDENCE: 'evidence',
    KNOWLEDGE: 'knowledge',
    DOCUMENTATION: 'documentation',
    RISK: 'risk',
    APPROVAL: 'approval',
    DEPLOYMENT: 'deployment',
    LEGAL: 'legal'
  };

  /**
   * Severity levels
   */
  static SEVERITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  };

  /**
   * Add a condition to the policy
   */
  addCondition(condition) {
    this.conditions.push({
      ...condition,
      id: this.generateConditionId(),
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Remove a condition from the policy
   */
  removeCondition(conditionId) {
    this.conditions = this.conditions.filter(c => c.id !== conditionId);
    this.touch();
  }

  /**
   * Add an action to the policy
   */
  addAction(action) {
    this.actions.push({
      ...action,
      id: this.generateActionId(),
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Remove an action from the policy
   */
  removeAction(actionId) {
    this.actions = this.actions.filter(a => a.id !== actionId);
    this.touch();
  }

  /**
   * Add an exception to the policy
   */
  addException(exception) {
    this.exceptions.push({
      ...exception,
      id: this.generateExceptionId(),
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Remove an exception from the policy
   */
  removeException(exceptionId) {
    this.exceptions = this.exceptions.filter(e => e.id !== exceptionId);
    this.touch();
  }

  /**
   * Enable the policy
   */
  enable() {
    this.enabled = true;
    this.addHistory('enabled', this.owner, {});
  }

  /**
   * Disable the policy
   */
  disable() {
    this.enabled = false;
    this.addHistory('disabled', this.owner, {});
  }

  /**
   * Record policy execution
   */
  recordExecution() {
    this.executionCount++;
    this.lastExecuted = new Date().toISOString();
    this.touch();
  }

  /**
   * Record policy violation
   */
  recordViolation() {
    this.violationCount++;
    this.lastViolation = new Date().toISOString();
    this.touch();
  }

  /**
   * Check if object matches any exception
   */
  matchesException(objectId, objectType) {
    for (const exception of this.exceptions) {
      if (exception.objectId === objectId) return true;
      if (exception.objectType === objectType) return true;
      if (exception.projectId && exception.projectId === this.project) return true;
    }
    return false;
  }

  /**
   * Evaluate conditions against an object
   */
  evaluateConditions(object, graphManager) {
    if (!this.enabled) return { passed: true, reason: 'Policy is disabled' };

    if (this.matchesException(object.id, object.type)) {
      return { passed: true, reason: 'Object matches exception' };
    }

    const results = [];
    
    for (const condition of this.conditions) {
      const result = this.evaluateCondition(condition, object, graphManager);
      results.push(result);
      
      // If any condition fails, policy fails
      if (!result.passed) {
        return {
          passed: false,
          failedCondition: condition,
          reason: result.reason,
          allResults: results
        };
      }
    }

    return {
      passed: true,
      reason: 'All conditions passed',
      allResults: results
    };
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(condition, object, graphManager) {
    const { field, operator, value } = condition;
    const objectValue = this.getObjectValue(object, field);

    switch (operator) {
      case 'equals':
        return {
          passed: objectValue === value,
          reason: objectValue === value ? '' : `${field} is ${objectValue}, expected ${value}`
        };
      case 'not_equals':
        return {
          passed: objectValue !== value,
          reason: objectValue !== value ? '' : `${field} equals ${value}`
        };
      case 'contains':
        return {
          passed: Array.isArray(objectValue) ? objectValue.includes(value) : String(objectValue).includes(value),
          reason: Array.isArray(objectValue) ? objectValue.includes(value) ? '' : `${field} does not contain ${value}` : String(objectValue).includes(value) ? '' : `${field} does not contain ${value}`
        };
      case 'not_contains':
        return {
          passed: Array.isArray(objectValue) ? !objectValue.includes(value) : !String(objectValue).includes(value),
          reason: Array.isArray(objectValue) ? !objectValue.includes(value) ? '' : `${field} contains ${value}` : !String(objectValue).includes(value) ? '' : `${field} contains ${value}`
        };
      case 'greater_than':
        return {
          passed: objectValue > value,
          reason: objectValue > value ? '' : `${field} is ${objectValue}, expected > ${value}`
        };
      case 'less_than':
        return {
          passed: objectValue < value,
          reason: objectValue < value ? '' : `${field} is ${objectValue}, expected < ${value}`
        };
      case 'greater_or_equal':
        return {
          passed: objectValue >= value,
          reason: objectValue >= value ? '' : `${field} is ${objectValue}, expected >= ${value}`
        };
      case 'less_or_equal':
        return {
          passed: objectValue <= value,
          reason: objectValue <= value ? '' : `${field} is ${objectValue}, expected <= ${value}`
        };
      case 'is_empty':
        return {
          passed: !objectValue || (Array.isArray(objectValue) && objectValue.length === 0),
          reason: !objectValue ? '' : `${field} is not empty`
        };
      case 'is_not_empty':
        return {
          passed: objectValue && (!Array.isArray(objectValue) || objectValue.length > 0),
          reason: objectValue && (!Array.isArray(objectValue) || objectValue.length > 0) ? '' : `${field} is empty`
        };
      case 'has_relation':
        const relations = graphManager.getOutgoingRelations(object.id);
        const hasRelation = relations.some(r => r.relationType === value);
        return {
          passed: hasRelation,
          reason: hasRelation ? '' : `No relation of type ${value} found`
        };
      case 'has_incoming_relation':
        const incoming = graphManager.getIncomingRelations(object.id);
        const hasIncoming = incoming.some(r => r.relationType === value);
        return {
          passed: hasIncoming,
          reason: hasIncoming ? '' : `No incoming relation of type ${value} found`
        };
      default:
        return {
          passed: false,
          reason: `Unknown operator: ${operator}`
        };
    }
  }

  /**
   * Get object value by field path
   */
  getObjectValue(object, field) {
    const parts = field.split('.');
    let value = object;
    
    for (const part of parts) {
      if (value && value[part] !== undefined) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Execute policy actions
   */
  executeActions(object, graphManager, context = {}) {
    const executedActions = [];
    
    for (const action of this.actions) {
      const result = this.executeAction(action, object, graphManager, context);
      executedActions.push(result);
    }
    
    return executedActions;
  }

  /**
   * Execute a single action
   */
  executeAction(action, object, graphManager, context) {
    const { type, parameters } = action;
    
    switch (type) {
      case 'create_violation':
        return {
          type,
          success: true,
          result: 'violation_created',
          parameters
        };
      case 'notify_responsible':
        return {
          type,
          success: true,
          result: 'notification_sent',
          target: object.responsible || object.owner,
          parameters
        };
      case 'decrease_health_score':
        return {
          type,
          success: true,
          result: 'health_decreased',
          amount: parameters.amount || 10,
          parameters
        };
      case 'generate_recommendation':
        return {
          type,
          success: true,
          result: 'recommendation_generated',
          recommendation: parameters.recommendation,
          parameters
        };
      case 'block_operation':
        return {
          type,
          success: true,
          result: 'operation_blocked',
          parameters
        };
      case 'require_approval':
        return {
          type,
          success: true,
          result: 'approval_required',
          approver: parameters.approver,
          parameters
        };
      case 'log_event':
        return {
          type,
          success: true,
          result: 'event_logged',
          message: parameters.message,
          parameters
        };
      default:
        return {
          type,
          success: false,
          result: 'unknown_action_type',
          parameters
        };
    }
  }

  /**
   * Generate condition ID
   */
  generateConditionId() {
    return `COND-${String(this.conditions.length + 1).padStart(3, '0')}`;
  }

  /**
   * Generate action ID
   */
  generateActionId() {
    return `ACT-${String(this.actions.length + 1).padStart(3, '0')}`;
  }

  /**
   * Generate exception ID
   */
  generateExceptionId() {
    return `EXC-${String(this.exceptions.length + 1).padStart(3, '0')}`;
  }

  /**
   * Get compliance rate
   */
  getComplianceRate() {
    if (this.executionCount === 0) return 100;
    return Math.round(((this.executionCount - this.violationCount) / this.executionCount) * 100);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      category: this.category,
      severity: this.severity,
      enabled: this.enabled,
      conditions: this.conditions,
      actions: this.actions,
      exceptions: this.exceptions,
      executionCount: this.executionCount,
      violationCount: this.violationCount,
      lastExecuted: this.lastExecuted,
      lastViolation: this.lastViolation,
      complianceRate: this.getComplianceRate()
    };
  }

  static fromJSON(json) {
    return new Policy(json);
  }
}

export default Policy;
