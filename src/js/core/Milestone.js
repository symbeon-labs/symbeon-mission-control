/**
 * Milestone - Operational Object for milestones
 * Extends OperationalObject
 */

import { OperationalObject } from './OperationalObject.js';

export class Milestone extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.objective = data.objective || '';
    this.acceptance_criteria = data.acceptance_criteria || [];
    this.target_date = data.target_date || null;
    this.actual_date = data.actual_date || null;
    this.progress = data.progress || 0;
    this.related_release = data.related_release || null;
    this.deliverables = data.deliverables || [];
    this.stakeholders = data.stakeholders || [];
  }

  /**
   * Add acceptance criterion
   */
  addAcceptanceCriterion(criterion) {
    this.acceptance_criteria.push({
      criterion,
      met: false,
      met_at: null,
      evidence: null,
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Mark acceptance criterion as met
   */
  meetAcceptanceCriterion(index, evidenceId) {
    if (this.acceptance_criteria[index]) {
      this.acceptance_criteria[index].met = true;
      this.acceptance_criteria[index].met_at = new Date().toISOString();
      this.acceptance_criteria[index].evidence = evidenceId;
      this.touch();
    }
  }

  /**
   * Update progress
   */
  updateProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress));
    if (this.progress === 100 && this.status !== 'completed') {
      this.complete();
    }
    this.touch();
  }

  /**
   * Complete milestone
   */
  complete() {
    this.status = 'completed';
    this.actual_date = new Date().toISOString();
    this.progress = 100;
    this.addHistory('completed', this.owner, {});
  }

  /**
   * Add deliverable
   */
  addDeliverable(deliverable) {
    this.deliverables.push({
      description: deliverable,
      delivered: false,
      delivered_at: null,
      evidence: null,
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Mark deliverable as delivered
   */
  deliverDeliverable(index, evidenceId) {
    if (this.deliverables[index]) {
      this.deliverables[index].delivered = true;
      this.deliverables[index].delivered_at = new Date().toISOString();
      this.deliverables[index].evidence = evidenceId;
      this.touch();
    }
  }

  /**
   * Link to release
   */
  linkToRelease(releaseId) {
    this.related_release = releaseId;
    this.touch();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      objective: this.objective,
      acceptance_criteria: this.acceptance_criteria,
      target_date: this.target_date,
      actual_date: this.actual_date,
      progress: this.progress,
      related_release: this.related_release,
      deliverables: this.deliverables,
      stakeholders: this.stakeholders
    };
  }

  static fromJSON(json) {
    return new Milestone(json);
  }
}

export default Milestone;
