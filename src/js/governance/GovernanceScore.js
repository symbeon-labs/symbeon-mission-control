/**
 * GovernanceScore - Calculates governance metrics dynamically
 * 
 * Governance is calculated dynamically from graph state
 * Metrics: Policy Compliance, Evidence Coverage, Decision Traceability, Knowledge Capture, Documentation Completeness, Approval Completeness, Dependency Health, Graph Integrity, Operational Consistency
 */

export class GovernanceScore {
  constructor(graphManager, policyEngine) {
    this.graphManager = graphManager;
    this.policyEngine = policyEngine;
  }

  /**
   * Calculate overall governance score
   */
  calculateOverallScore(allObjects) {
    const metrics = {
      policyCompliance: this.calculatePolicyCompliance(),
      evidenceCoverage: this.calculateEvidenceCoverage(allObjects),
      decisionTraceability: this.calculateDecisionTraceability(allObjects),
      knowledgeCapture: this.calculateKnowledgeCapture(allObjects),
      documentationCompleteness: this.calculateDocumentationCompleteness(allObjects),
      approvalCompleteness: this.calculateApprovalCompleteness(allObjects),
      dependencyHealth: this.calculateDependencyHealth(allObjects),
      graphIntegrity: this.calculateGraphIntegrity(allObjects),
      operationalConsistency: this.calculateOperationalConsistency(allObjects)
    };

    const overall = Object.values(metrics).reduce((sum, score) => sum + score, 0) / Object.keys(metrics).length;

    return {
      overall: Math.round(overall),
      metrics,
      grade: this.getGrade(overall),
      trend: this.calculateTrend(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
  }

  /**
   * Calculate policy compliance
   */
  calculatePolicyCompliance() {
    const report = this.policyEngine.getComplianceReport();
    return report.averageComplianceRate;
  }

  /**
   * Calculate evidence coverage
   */
  calculateEvidenceCoverage(allObjects) {
    if (allObjects.length === 0) return 100;

    let evidenceCount = 0;
    
    for (const object of allObjects) {
      const outgoing = this.graphManager.getOutgoingRelations(object.id);
      const hasEvidence = outgoing.some(r => 
        r.relationType === 'PROVES' || 
        r.relationType === 'ATTACHED_TO'
      );
      
      if (hasEvidence) {
        evidenceCount++;
      }
    }
    
    return (evidenceCount / allObjects.length) * 100;
  }

  /**
   * Calculate decision traceability
   */
  calculateDecisionTraceability(allObjects) {
    const decisions = allObjects.filter(o => o.type === 'Decision');
    
    if (decisions.length === 0) return 100;

    let traceableCount = 0;
    
    for (const decision of decisions) {
      const outgoing = this.graphManager.getOutgoingRelations(decision.id);
      const incoming = this.graphManager.getIncomingRelations(decision.id);
      
      // Decision is traceable if it has incoming (origin) and outgoing (impact) relations
      if (incoming.length > 0 && outgoing.length > 0) {
        traceableCount++;
      }
    }
    
    return (traceableCount / decisions.length) * 100;
  }

  /**
   * Calculate knowledge capture
   */
  calculateKnowledgeCapture(allObjects) {
    const tasks = allObjects.filter(o => o.type === 'Task');
    
    if (tasks.length === 0) return 100;

    let knowledgeCount = 0;
    
    for (const task of tasks) {
      if (task.status === 'completed') {
        const outgoing = this.graphManager.getOutgoingRelations(task.id);
        const hasKnowledge = outgoing.some(r => r.relationType === 'LEARNS_FROM');
        
        if (hasKnowledge) {
          knowledgeCount++;
        }
      }
    }
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    if (completedTasks === 0) return 100;
    
    return (knowledgeCount / completedTasks) * 100;
  }

  /**
   * Calculate documentation completeness
   */
  calculateDocumentationCompleteness(allObjects) {
    const documents = allObjects.filter(o => o.type === 'Document');
    
    if (documents.length === 0) return 50; // No documents to evaluate

    let completeCount = 0;
    
    for (const document of documents) {
      const incoming = this.graphManager.getIncomingRelations(document.id);
      const hasReviewer = incoming.some(r => r.relationType === 'VALIDATES');
      const hasApproval = incoming.some(r => r.relationType === 'APPROVES');
      
      if (hasReviewer && hasApproval) {
        completeCount++;
      }
    }
    
    return (completeCount / documents.length) * 100;
  }

  /**
   * Calculate approval completeness
   */
  calculateApprovalCompleteness(allObjects) {
    const decisions = allObjects.filter(o => o.type === 'Decision');
    const releases = allObjects.filter(o => o.type === 'Release');
    
    if (decisions.length === 0 && releases.length === 0) return 100;

    let approvedCount = 0;
    const totalObjects = decisions.length + releases.length;
    
    for (const decision of decisions) {
      if (decision.status === 'approved' && decision.approver) {
        approvedCount++;
      }
    }
    
    for (const release of releases) {
      const incoming = this.graphManager.getIncomingRelations(release.id);
      const hasApproval = incoming.some(r => r.relationType === 'APPROVES');
      
      if (hasApproval) {
        approvedCount++;
      }
    }
    
    return (approvedCount / totalObjects) * 100;
  }

  /**
   * Calculate dependency health
   */
  calculateDependencyHealth(allObjects) {
    const cycles = this.graphManager.detectCircularDependencies();
    
    if (cycles.length > 0) {
      return Math.max(0, 100 - (cycles.length * 20));
    }
    
    const orphans = this.graphManager.detectOrphanObjects(allObjects.map(o => o.id));
    
    if (orphans.length > 0) {
      return Math.max(0, 100 - (orphans.length * 5));
    }
    
    return 100;
  }

  /**
   * Calculate graph integrity
   */
  calculateGraphIntegrity(allObjects) {
    const stats = this.graphManager.generateStatistics();
    const uniqueObjects = new Set();
    
    for (const relation of this.graphManager.relations.values()) {
      if (relation.active) {
        uniqueObjects.add(relation.sourceId);
        uniqueObjects.add(relation.targetId);
      }
    }
    
    const totalObjects = allObjects.length;
    if (totalObjects === 0) return 100;
    
    const connectedObjects = uniqueObjects.size;
    return (connectedObjects / totalObjects) * 100;
  }

  /**
   * Calculate operational consistency
   */
  calculateOperationalConsistency(allObjects) {
    let consistencyScore = 100;
    
    // Check for tasks without milestones
    const tasks = allObjects.filter(o => o.type === 'Task');
    for (const task of tasks) {
      const outgoing = this.graphManager.getOutgoingRelations(task.id);
      const hasMilestone = outgoing.some(r => r.relationType === 'BELONGS_TO' && r.targetType === 'Milestone');
      
      if (!hasMilestone) {
        consistencyScore -= 5;
      }
    }
    
    // Check for milestones without releases
    const milestones = allObjects.filter(o => o.type === 'Milestone');
    for (const milestone of milestones) {
      if (milestone.status === 'completed') {
        const incoming = this.graphManager.getIncomingRelations(milestone.id);
        const hasRelease = incoming.some(r => r.relationType === 'CONTAINS' && r.sourceType === 'Release');
        
        if (!hasRelease) {
          consistencyScore -= 3;
        }
      }
    }
    
    return Math.max(0, consistencyScore);
  }

  /**
   * Get grade from score
   */
  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Calculate trend (would need historical data)
   */
  calculateTrend(metrics) {
    // For now, return stable
    // In future, compare with previous scores
    return 'stable';
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.policyCompliance < 80) {
      recommendations.push({
        area: 'Policy Compliance',
        priority: 'high',
        message: 'Improve policy compliance by addressing violations',
        currentScore: metrics.policyCompliance
      });
    }
    
    if (metrics.evidenceCoverage < 70) {
      recommendations.push({
        area: 'Evidence Coverage',
        priority: 'high',
        message: 'Increase evidence coverage for decisions and tasks',
        currentScore: metrics.evidenceCoverage
      });
    }
    
    if (metrics.decisionTraceability < 70) {
      recommendations.push({
        area: 'Decision Traceability',
        priority: 'medium',
        message: 'Improve decision traceability by adding relations',
        currentScore: metrics.decisionTraceability
      });
    }
    
    if (metrics.knowledgeCapture < 60) {
      recommendations.push({
        area: 'Knowledge Capture',
        priority: 'medium',
        message: 'Capture learnings from completed tasks',
        currentScore: metrics.knowledgeCapture
      });
    }
    
    if (metrics.documentationCompleteness < 70) {
      recommendations.push({
        area: 'Documentation Completeness',
        priority: 'medium',
        message: 'Add reviewers and approvals to documents',
        currentScore: metrics.documentationCompleteness
      });
    }
    
    if (metrics.approvalCompleteness < 70) {
      recommendations.push({
        area: 'Approval Completeness',
        priority: 'high',
        message: 'Ensure all decisions and releases have approvals',
        currentScore: metrics.approvalCompleteness
      });
    }
    
    if (metrics.dependencyHealth < 80) {
      recommendations.push({
        area: 'Dependency Health',
        priority: 'critical',
        message: 'Address circular dependencies and orphan objects',
        currentScore: metrics.dependencyHealth
      });
    }
    
    if (metrics.graphIntegrity < 70) {
      recommendations.push({
        area: 'Graph Integrity',
        priority: 'medium',
        message: 'Improve graph connectivity by adding relations',
        currentScore: metrics.graphIntegrity
      });
    }
    
    if (metrics.operationalConsistency < 70) {
      recommendations.push({
        area: 'Operational Consistency',
        priority: 'medium',
        message: 'Ensure tasks belong to milestones and completed milestones have releases',
        currentScore: metrics.operationalConsistency
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Answer organizational questions
   */
  answerQuestions(allObjects) {
    return {
      projectsViolatingGovernance: this.getProjectsViolatingGovernance(allObjects),
      decisionsWithoutEvidence: this.getDecisionsWithoutEvidence(allObjects),
      milestonesLackingApprovals: this.getMilestonesLackingApprovals(allObjects),
      outdatedDocuments: this.getOutdatedDocuments(allObjects),
      risksWithoutMitigation: this.getRisksWithoutMitigation(allObjects),
      knowledgeNeverReused: this.getKnowledgeNeverReused(allObjects)
    };
  }

  /**
   * Get projects violating governance
   */
  getProjectsViolatingGovernance(allObjects) {
    const projects = new Set();
    const violations = this.policyEngine.getUnresolvedViolations();
    
    for (const violation of violations) {
      if (violation.project) {
        projects.add(violation.project);
      }
    }
    
    return Array.from(projects);
  }

  /**
   * Get decisions without evidence
   */
  getDecisionsWithoutEvidence(allObjects) {
    const decisions = allObjects.filter(o => o.type === 'Decision');
    const withoutEvidence = [];
    
    for (const decision of decisions) {
      const outgoing = this.graphManager.getOutgoingRelations(decision.id);
      const hasEvidence = outgoing.some(r => 
        r.relationType === 'PROVES' || 
        r.relationType === 'ATTACHED_TO'
      );
      
      if (!hasEvidence) {
        withoutEvidence.push(decision.id);
      }
    }
    
    return withoutEvidence;
  }

  /**
   * Get milestones lacking approvals
   */
  getMilestonesLackingApprovals(allObjects) {
    const milestones = allObjects.filter(o => o.type === 'Milestone');
    const lackingApprovals = [];
    
    for (const milestone of milestones) {
      const incoming = this.graphManager.getIncomingRelations(milestone.id);
      const hasApproval = incoming.some(r => r.relationType === 'APPROVES');
      
      if (!hasApproval) {
        lackingApprovals.push(milestone.id);
      }
    }
    
    return lackingApprovals;
  }

  /**
   * Get outdated documents
   */
  getOutdatedDocuments(allObjects) {
    const documents = allObjects.filter(o => o.type === 'Document');
    const outdated = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const document of documents) {
      const updated = new Date(document.updated);
      if (updated < thirtyDaysAgo) {
        outdated.push(document.id);
      }
    }
    
    return outdated;
  }

  /**
   * Get risks without mitigation
   */
  getRisksWithoutMitigation(allObjects) {
    const risks = allObjects.filter(o => o.type === 'Risk');
    const withoutMitigation = [];
    
    for (const risk of risks) {
      const outgoing = this.graphManager.getOutgoingRelations(risk.id);
      const hasMitigation = outgoing.some(r => r.relationType === 'IMPLEMENTS');
      
      if (!hasMitigation) {
        withoutMitigation.push(risk.id);
      }
    }
    
    return withoutMitigation;
  }

  /**
   * Get knowledge never reused
   */
  getKnowledgeNeverReused(allObjects) {
    const knowledge = allObjects.filter(o => o.type === 'Knowledge');
    const neverReused = [];
    
    for (const k of knowledge) {
      const incoming = this.graphManager.getIncomingRelations(k.id);
      const uses = incoming.filter(r => r.relationType === 'USES');
      
      if (uses.length <= 1) {
        neverReused.push(k.id);
      }
    }
    
    return neverReused;
  }
}

export default GovernanceScore;
