/**
 * HealthCalculator - Calculates organizational health from graph density
 * 
 * Health is calculated from graph density and various metrics
 * Examples: disconnected nodes, missing evidence, missing approvals, etc.
 */

import { Relation } from './Relation.js';

export class HealthCalculator {
  constructor(graphManager) {
    this.graphManager = graphManager;
  }

  /**
   * Calculate overall project health
   */
  calculateOverallHealth(allObjects) {
    const metrics = {
      governance: this.calculateGovernanceHealth(allObjects),
      commercial: this.calculateCommercialHealth(allObjects),
      product: this.calculateProductHealth(allObjects),
      knowledge: this.calculateKnowledgeHealth(allObjects),
      evidence: this.calculateEvidenceHealth(allObjects),
      documentation: this.calculateDocumentationHealth(allObjects),
      execution: this.calculateExecutionHealth(allObjects),
      validation: this.calculateValidationHealth(allObjects),
      risk: this.calculateRiskHealth(allObjects)
    };

    const overall = Object.values(metrics).reduce((sum, score) => sum + score, 0) / Object.keys(metrics).length;

    return {
      overall: Math.round(overall),
      metrics,
      grade: this.getGrade(overall),
      recommendations: this.generateRecommendations(metrics)
    };
  }

  /**
   * Calculate governance health
   */
  calculateGovernanceHealth(allObjects) {
    let score = 100;
    const decisions = allObjects.filter(o => o.type === 'Decision');
    
    for (const decision of decisions) {
      const incoming = this.graphManager.getIncomingRelations(decision.id);
      const hasApproval = incoming.some(r => r.relationType === Relation.TYPES.APPROVES);
      
      if (!hasApproval) {
        score -= 20;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate commercial health
   */
  calculateCommercialHealth(allObjects) {
    let score = 100;
    const contracts = allObjects.filter(o => o.type === 'Contract');
    
    if (contracts.length === 0) {
      return 100; // No contracts to evaluate
    }
    
    for (const contract of contracts) {
      const incoming = this.graphManager.getIncomingRelations(contract.id);
      const hasApproval = incoming.some(r => r.relationType === Relation.TYPES.APPROVES);
      
      if (!hasApproval) {
        score -= 25;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate product health
   */
  calculateProductHealth(allObjects) {
    let score = 100;
    const releases = allObjects.filter(o => o.type === 'Release');
    
    if (releases.length === 0) {
      return 100; // No releases to evaluate
    }
    
    for (const release of releases) {
      const outgoing = this.graphManager.getOutgoingRelations(release.id);
      const hasMilestone = outgoing.some(r => 
        r.relationType === Relation.TYPES.CONTAINS && r.targetType === 'Milestone'
      );
      
      if (!hasMilestone) {
        score -= 30;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate knowledge health
   */
  calculateKnowledgeHealth(allObjects) {
    let score = 100;
    const tasks = allObjects.filter(o => o.type === 'Task');
    const knowledge = allObjects.filter(o => o.type === 'Knowledge');
    
    if (tasks.length === 0) {
      return 100;
    }
    
    // Check if completed tasks have associated knowledge
    for (const task of tasks) {
      if (task.status === 'completed') {
        const outgoing = this.graphManager.getOutgoingRelations(task.id);
        const hasKnowledge = outgoing.some(r => r.relationType === Relation.TYPES.LEARNS_FROM);
        
        if (!hasKnowledge) {
          score -= 10;
        }
      }
    }
    
    // Bonus for knowledge reuse
    const knowledgeReuse = this.calculateKnowledgeReuse(knowledge);
    score += knowledgeReuse * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate knowledge reuse
   */
  calculateKnowledgeReuse(knowledgeObjects) {
    let reuseCount = 0;
    
    for (const knowledge of knowledgeObjects) {
      const incoming = this.graphManager.getIncomingRelations(knowledge.id);
      const uses = incoming.filter(r => r.relationType === Relation.TYPES.USES);
      
      if (uses.length > 1) {
        reuseCount++;
      }
    }
    
    return reuseCount;
  }

  /**
   * Calculate evidence health
   */
  calculateEvidenceHealth(allObjects) {
    let score = 100;
    const tasks = allObjects.filter(o => o.type === 'Task');
    const decisions = allObjects.filter(o => o.type === 'Decision');
    
    // Check tasks for evidence
    for (const task of tasks) {
      if (task.status === 'completed') {
        const outgoing = this.graphManager.getOutgoingRelations(task.id);
        const hasEvidence = outgoing.some(r => 
          r.relationType === Relation.TYPES.PROVES || 
          r.relationType === Relation.TYPES.ATTACHED_TO
        );
        
        if (!hasEvidence) {
          score -= 15;
        }
      }
    }
    
    // Check decisions for evidence
    for (const decision of decisions) {
      const outgoing = this.graphManager.getOutgoingRelations(decision.id);
      const hasEvidence = outgoing.some(r => 
        r.relationType === Relation.TYPES.PROVES || 
        r.relationType === Relation.TYPES.ATTACHED_TO
      );
      
      if (!hasEvidence) {
        score -= 20;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate documentation health
   */
  calculateDocumentationHealth(allObjects) {
    let score = 100;
    const documents = allObjects.filter(o => o.type === 'Document');
    
    if (documents.length === 0) {
      return 50; // No documentation
    }
    
    for (const document of documents) {
      const incoming = this.graphManager.getIncomingRelations(document.id);
      const hasReviewer = incoming.some(r => r.relationType === Relation.TYPES.VALIDATES);
      
      if (!hasReviewer) {
        score -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate execution health
   */
  calculateExecutionHealth(allObjects) {
    let score = 100;
    const tasks = allObjects.filter(o => o.type === 'Task');
    
    if (tasks.length === 0) {
      return 100;
    }
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    
    // Penalty for blocked tasks
    score -= blockedTasks * 15;
    
    // Bonus for completed tasks
    score += (completedTasks / tasks.length) * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate validation health
   */
  calculateValidationHealth(allObjects) {
    let score = 100;
    const milestones = allObjects.filter(o => o.type === 'Milestone');
    
    if (milestones.length === 0) {
      return 100;
    }
    
    for (const milestone of milestones) {
      const incoming = this.graphManager.getIncomingRelations(milestone.id);
      const hasValidation = incoming.some(r => r.relationType === Relation.TYPES.VALIDATES);
      
      if (!hasValidation) {
        score -= 15;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate risk health
   */
  calculateRiskHealth(allObjects) {
    let score = 100;
    const risks = allObjects.filter(o => o.type === 'Risk');
    
    if (risks.length === 0) {
      return 100;
    }
    
    const highRisks = risks.filter(r => r.impact === 'high').length;
    const criticalRisks = risks.filter(r => r.impact === 'critical').length;
    
    // Penalty for high and critical risks
    score -= highRisks * 10;
    score -= criticalRisks * 25;
    
    // Check if risks have mitigation
    for (const risk of risks) {
      const outgoing = this.graphManager.getOutgoingRelations(risk.id);
      const hasMitigation = outgoing.some(r => r.relationType === Relation.TYPES.IMPLEMENTS);
      
      if (!hasMitigation) {
        score -= 5;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.governance < 70) {
      recommendations.push({
        area: 'Governance',
        priority: 'high',
        message: 'Improve approval processes for decisions'
      });
    }
    
    if (metrics.knowledge < 70) {
      recommendations.push({
        area: 'Knowledge',
        priority: 'medium',
        message: 'Capture learnings from completed tasks'
      });
    }
    
    if (metrics.evidence < 70) {
      recommendations.push({
        area: 'Evidence',
        priority: 'high',
        message: 'Ensure all decisions and tasks have supporting evidence'
      });
    }
    
    if (metrics.documentation < 70) {
      recommendations.push({
        area: 'Documentation',
        priority: 'medium',
        message: 'Add reviewers to documents'
      });
    }
    
    if (metrics.execution < 70) {
      recommendations.push({
        area: 'Execution',
        priority: 'high',
        message: 'Address blocked tasks and improve completion rate'
      });
    }
    
    if (metrics.risk < 70) {
      recommendations.push({
        area: 'Risk',
        priority: 'high',
        message: 'Implement mitigation strategies for high-priority risks'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate graph density
   */
  calculateGraphDensity() {
    const stats = this.graphManager.generateStatistics();
    const uniqueObjects = new Set();
    
    for (const relation of this.graphManager.relations.values()) {
      if (relation.active) {
        uniqueObjects.add(relation.sourceId);
        uniqueObjects.add(relation.targetId);
      }
    }
    
    const n = uniqueObjects.size;
    if (n < 2) return 0;
    
    const maxPossibleEdges = n * (n - 1);
    const actualEdges = stats.activeRelations;
    
    return actualEdges / maxPossibleEdges;
  }

  /**
   * Calculate connectivity score
   */
  calculateConnectivityScore(allObjectIds) {
    const orphans = this.graphManager.detectOrphanObjects(allObjectIds);
    const total = allObjectIds.length;
    
    if (total === 0) return 100;
    
    const connected = total - orphans.length;
    return (connected / total) * 100;
  }

  /**
   * Calculate traceability score
   */
  calculateTraceabilityScore(allObjects) {
    let traceableCount = 0;
    
    for (const object of allObjects) {
      const incoming = this.graphManager.getIncomingRelations(object.id);
      const outgoing = this.graphManager.getOutgoingRelations(object.id);
      
      if (incoming.length > 0 || outgoing.length > 0) {
        traceableCount++;
      }
    }
    
    if (allObjects.length === 0) return 100;
    
    return (traceableCount / allObjects.length) * 100;
  }

  /**
   * Calculate evidence coverage
   */
  calculateEvidenceCoverage(allObjects) {
    let evidenceCount = 0;
    
    for (const object of allObjects) {
      const outgoing = this.graphManager.getOutgoingRelations(object.id);
      const hasEvidence = outgoing.some(r => 
        r.relationType === Relation.TYPES.PROVES || 
        r.relationType === Relation.TYPES.ATTACHED_TO
      );
      
      if (hasEvidence) {
        evidenceCount++;
      }
    }
    
    if (allObjects.length === 0) return 100;
    
    return (evidenceCount / allObjects.length) * 100;
  }

  /**
   * Calculate documentation coverage
   */
  calculateDocumentationCoverage(allObjects) {
    let documentedCount = 0;
    
    for (const object of allObjects) {
      const outgoing = this.graphManager.getOutgoingRelations(object.id);
      const hasDocument = outgoing.some(r => r.targetType === 'Document');
      
      if (hasDocument) {
        documentedCount++;
      }
    }
    
    if (allObjects.length === 0) return 100;
    
    return (documentedCount / allObjects.length) * 100;
  }

  /**
   * Generate comprehensive health report
   */
  generateHealthReport(allObjects) {
    const overallHealth = this.calculateOverallHealth(allObjects);
    const graphDensity = this.calculateGraphDensity();
    const connectivityScore = this.calculateConnectivityScore(allObjects.map(o => o.id));
    const traceabilityScore = this.calculateTraceabilityScore(allObjects);
    const evidenceCoverage = this.calculateEvidenceCoverage(allObjects);
    const documentationCoverage = this.calculateDocumentationCoverage(allObjects);
    
    return {
      overall: overallHealth,
      graphMetrics: {
        density: Math.round(graphDensity * 100),
        connectivity: Math.round(connectivityScore),
        traceability: Math.round(traceabilityScore),
        evidenceCoverage: Math.round(evidenceCoverage),
        documentationCoverage: Math.round(documentationCoverage)
      },
      generatedAt: new Date().toISOString()
    };
  }
}

export default HealthCalculator;
