/**
 * Violation - Governance policy violation
 * Extends OperationalObject
 * 
 * Every violation becomes an OperationalObject
 * Violations are historically preserved
 * Nothing is deleted
 */

import { OperationalObject } from '../core/OperationalObject.js';

export class Violation extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.policy = data.policy || null;
    this.policyId = data.policyId || null;
    this.severity = data.severity || 'medium';
    this.objectId = data.objectId || null;
    this.objectType = data.objectType || null;
    this.resolved = data.resolved !== undefined ? data.resolved : false;
    this.resolvedBy = data.resolvedBy || null;
    this.resolvedAt = data.resolvedAt || null;
    this.resolution = data.resolution || null;
    this.impact = data.impact || 'medium';
    this.context = data.context || {};
    this.evidence = data.evidence || [];
  }

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
   * Impact levels
   */
  static IMPACT = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    NONE: 'none'
  };

  /**
   * Resolve the violation
   */
  resolve(resolver, resolution) {
    this.resolved = true;
    this.resolvedBy = resolver;
    this.resolvedAt = new Date().toISOString();
    this.resolution = resolution;
    this.addHistory('resolved', resolver, { resolution });
  }

  /**
   * Reopen the violation
   */
  reopen(actor) {
    this.resolved = false;
    this.resolvedBy = null;
    this.resolvedAt = null;
    this.resolution = null;
    this.addHistory('reopened', actor, {});
  }

  /**
   * Add evidence to the violation
   */
  addEvidence(evidenceId) {
    if (!this.evidence.includes(evidenceId)) {
      this.evidence.push(evidenceId);
      this.touch();
    }
  }

  /**
   * Update context
   */
  updateContext(key, value) {
    this.context[key] = value;
    this.touch();
  }

  /**
   * Get age of violation in days
   */
  getAgeInDays() {
    const created = new Date(this.created);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if violation is stale (older than 30 days and unresolved)
   */
  isStale() {
    return !this.resolved && this.getAgeInDays() > 30;
  }

  /**
   * Check if violation is critical and unresolved
   */
  isCritical() {
    return !this.resolved && this.severity === 'critical';
  }

  /**
   * Get resolution time in days
   */
  getResolutionTimeInDays() {
    if (!this.resolved || !this.resolvedAt) return null;
    
    const created = new Date(this.created);
    const resolved = new Date(this.resolvedAt);
    const diffTime = Math.abs(resolved - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toJSON() {
    return {
      ...super.toJSON(),
      policy: this.policy,
      policyId: this.policyId,
      severity: this.severity,
      objectId: this.objectId,
      objectType: this.objectType,
      resolved: this.resolved,
      resolvedBy: this.resolvedBy,
      resolvedAt: this.resolvedAt,
      resolution: this.resolution,
      impact: this.impact,
      context: this.context,
      evidence: this.evidence,
      ageInDays: this.getAgeInDays(),
      isStale: this.isStale(),
      isCritical: this.isCritical(),
      resolutionTimeInDays: this.getResolutionTimeInDays()
    };
  }

  static fromJSON(json) {
    return new Violation(json);
  }
}

export default Violation;
