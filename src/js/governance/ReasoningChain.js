/**
 * ReasoningChain - Auditable AI Chain of Thought Engine
 * Implements MCS-0009 (Agent Specification) & LAW-0008 (Agents Propose, Humans Govern)
 * 
 * Every critical action or decision proposed by an AI Agent MUST generate
 * an immutable ReasoningChain object linked to Evidence.
 */

import { OperationalObject } from '../core/OperationalObject.js';

export class ReasoningChain extends OperationalObject {
  constructor(data = {}) {
    super({ ...data, type: 'ReasoningChain' });
    this.agentId = data.agentId || 'unknown-agent';
    this.targetDecisionId = data.targetDecisionId || null;
    this.premises = data.premises || [];
    this.steps = data.steps || [];
    this.conclusion = data.conclusion || '';
    this.confidenceScore = data.confidenceScore || 100;
    this.humanApprovalRequired = data.humanApprovalRequired !== undefined ? data.humanApprovalRequired : true;
    this.hash = data.hash || this.computeHash();
  }

  /**
   * Add a logical step to the reasoning chain
   */
  addStep(stepNumber, premise, deduction) {
    this.steps.push({
      step: stepNumber,
      premise,
      deduction,
      timestamp: new Date().toISOString()
    });
    this.hash = this.computeHash();
    this.touch();
  }

  /**
   * Compute a simple hash signature of the reasoning chain for tamper detection
   */
  computeHash() {
    const raw = `${this.id}:${this.agentId}:${this.targetDecisionId}:${JSON.stringify(this.steps)}:${this.conclusion}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `ROC-HASH-${Math.abs(hash).toString(16).toUpperCase()}`;
  }

  /**
   * Verify if this reasoning chain requires human approval per LAW-0008
   */
  requiresApproval() {
    return this.humanApprovalRequired || this.confidenceScore < 85;
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      agentId: this.agentId,
      targetDecisionId: this.targetDecisionId,
      premises: this.premises,
      steps: this.steps,
      conclusion: this.conclusion,
      confidenceScore: this.confidenceScore,
      humanApprovalRequired: this.humanApprovalRequired,
      hash: this.hash
    };
  }

  static fromJSON(json) {
    return new ReasoningChain(json);
  }
}

export default ReasoningChain;
