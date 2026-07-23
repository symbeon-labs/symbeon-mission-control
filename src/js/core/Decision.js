/**
 * Decision - Operational Object for decisions
 * Extends OperationalObject
 */

import { OperationalObject } from './OperationalObject.js';

export class Decision extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.context = data.context || '';
    this.alternatives = data.alternatives || [];
    this.rationale = data.rationale || '';
    this.impact = data.impact || 'medium';
    this.approver = data.approver || null;
    this.approval_date = data.approval_date || null;
    this.implementation_status = data.implementation_status || 'not_started';
    this.related_tasks = data.related_tasks || [];
    this.related_documents = data.related_documents || [];
  }

  /**
   * Add alternative
   */
  addAlternative(alternative) {
    this.alternatives.push({
      description: alternative,
      rejected: false,
      rejection_reason: null,
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Reject alternative
   */
  rejectAlternative(index, reason) {
    if (this.alternatives[index]) {
      this.alternatives[index].rejected = true;
      this.alternatives[index].rejection_reason = reason;
      this.touch();
    }
  }

  /**
   * Approve decision
   */
  approve(approver) {
    this.approver = approver;
    this.approval_date = new Date().toISOString();
    this.status = 'approved';
    this.addHistory('approved', approver, {});
  }

  /**
   * Start implementation
   */
  startImplementation() {
    this.implementation_status = 'in_progress';
    this.addHistory('implementation_started', this.owner, {});
  }

  /**
   * Complete implementation
   */
  completeImplementation() {
    this.implementation_status = 'completed';
    this.addHistory('implementation_completed', this.owner, {});
  }

  toJSON() {
    return {
      ...super.toJSON(),
      context: this.context,
      alternatives: this.alternatives,
      rationale: this.rationale,
      impact: this.impact,
      approver: this.approver,
      approval_date: this.approval_date,
      implementation_status: this.implementation_status,
      related_tasks: this.related_tasks,
      related_documents: this.related_documents
    };
  }

  static fromJSON(json) {
    return new Decision(json);
  }
}

export default Decision;
