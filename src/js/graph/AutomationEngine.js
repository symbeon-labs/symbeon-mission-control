/**
 * AutomationEngine - Triggers automations based on graph events
 * 
 * Graph events trigger automated suggestions and actions
 * Reduces repetitive work and increases operational intelligence
 */

import { Relation } from './Relation.js';

export class AutomationEngine {
  constructor(graphManager) {
    this.graphManager = graphManager;
    this.automations = new Map();
    this.eventQueue = [];
    this.suggestions = [];
    this.initializeDefaultAutomations();
  }

  /**
   * Initialize default automations
   */
  initializeDefaultAutomations() {
    // Automation: Decision → Suggest Task
    this.addAutomation({
      id: 'AUTO-001',
      name: 'Decision to Task',
      trigger: {
        relationType: Relation.TYPES.CREATES,
        sourceType: 'Decision'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_task',
          sourceId: relation.sourceId,
          suggestion: `Decision "${relation.sourceId}" should generate implementation tasks`,
          priority: 'high'
        };
      }
    });

    // Automation: Decision → Suggest Milestone
    this.addAutomation({
      id: 'AUTO-002',
      name: 'Decision to Milestone',
      trigger: {
        relationType: Relation.TYPES.CREATES,
        sourceType: 'Decision'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_milestone',
          sourceId: relation.sourceId,
          suggestion: `Decision "${relation.sourceId}" may require a milestone for tracking`,
          priority: 'medium'
        };
      }
    });

    // Automation: Decision → Suggest Timeline Event
    this.addAutomation({
      id: 'AUTO-003',
      name: 'Decision to Timeline',
      trigger: {
        relationType: Relation.TYPES.CREATES,
        sourceType: 'Decision'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_timeline_event',
          sourceId: relation.sourceId,
          suggestion: `Decision "${relation.sourceId}" should be recorded in timeline`,
          priority: 'high'
        };
      }
    });

    // Automation: Decision → Suggest Evidence
    this.addAutomation({
      id: 'AUTO-004',
      name: 'Decision to Evidence',
      trigger: {
        relationType: Relation.TYPES.CREATES,
        sourceType: 'Decision'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_evidence',
          sourceId: relation.sourceId,
          suggestion: `Decision "${relation.sourceId}" requires supporting evidence`,
          priority: 'high'
        };
      }
    });

    // Automation: Meeting → Generate Minutes
    this.addAutomation({
      id: 'AUTO-005',
      name: 'Meeting to Minutes',
      trigger: {
        relationType: Relation.TYPES.GENERATES,
        sourceType: 'Meeting'
      },
      action: (relation, graph) => {
        return {
          type: 'generate_minutes',
          sourceId: relation.sourceId,
          suggestion: `Meeting "${relation.sourceId}" should generate minutes document`,
          priority: 'high'
        };
      }
    });

    // Automation: Meeting → Suggest Decision
    this.addAutomation({
      id: 'AUTO-006',
      name: 'Meeting to Decision',
      trigger: {
        relationType: Relation.TYPES.GENERATES,
        sourceType: 'Meeting'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_decision',
          sourceId: relation.sourceId,
          suggestion: `Meeting "${relation.sourceId}" may have produced decisions`,
          priority: 'medium'
        };
      }
    });

    // Automation: Meeting → Suggest Knowledge
    this.addAutomation({
      id: 'AUTO-007',
      name: 'Meeting to Knowledge',
      trigger: {
        relationType: Relation.TYPES.GENERATES,
        sourceType: 'Meeting'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_knowledge',
          sourceId: relation.sourceId,
          suggestion: `Meeting "${relation.sourceId}" may contain learnings worth capturing`,
          priority: 'medium'
        };
      }
    });

    // Automation: Meeting → Suggest Evidence
    this.addAutomation({
      id: 'AUTO-008',
      name: 'Meeting to Evidence',
      trigger: {
        relationType: Relation.TYPES.GENERATES,
        sourceType: 'Meeting'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_evidence',
          sourceId: relation.sourceId,
          suggestion: `Meeting "${relation.sourceId}" should have evidence (recording, notes)`,
          priority: 'high'
        };
      }
    });

    // Automation: Task Completed → Generate Knowledge Draft
    this.addAutomation({
      id: 'AUTO-009',
      name: 'Task to Knowledge',
      trigger: {
        relationType: Relation.TYPES.COMPLETES,
        sourceType: 'Task'
      },
      action: (relation, graph) => {
        return {
          type: 'generate_knowledge_draft',
          sourceId: relation.sourceId,
          suggestion: `Task "${relation.sourceId}" completed - capture what was learned`,
          priority: 'medium'
        };
      }
    });

    // Automation: Evidence Uploaded → Suggest Related Objects
    this.addAutomation({
      id: 'AUTO-010',
      name: 'Evidence to Related Objects',
      trigger: {
        relationType: Relation.TYPES.ATTACHED_TO,
        sourceType: 'Evidence'
      },
      action: (relation, graph) => {
        // Find similar evidence objects
        const similarEvidence = graph.getRelationsByType(Relation.TYPES.ATTACHED_TO)
          .filter(r => r.sourceType === 'Evidence' && r.sourceId !== relation.sourceId);
        
        return {
          type: 'suggest_related_objects',
          sourceId: relation.sourceId,
          suggestion: `Evidence "${relation.sourceId}" may relate to ${similarEvidence.length} other evidence objects`,
          priority: 'low',
          relatedObjects: similarEvidence.map(r => r.sourceId)
        };
      }
    });

    // Automation: Milestone Completed → Suggest Release
    this.addAutomation({
      id: 'AUTO-011',
      name: 'Milestone to Release',
      trigger: {
        relationType: Relation.TYPES.COMPLETES,
        sourceType: 'Milestone'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_release',
          sourceId: relation.sourceId,
          suggestion: `Milestone "${relation.sourceId}" completed - consider creating a release`,
          priority: 'high'
        };
      }
    });

    // Automation: Document Created → Suggest Review
    this.addAutomation({
      id: 'AUTO-012',
      name: 'Document to Review',
      trigger: {
        relationType: Relation.TYPES.CREATES,
        sourceType: 'Document'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_review',
          sourceId: relation.sourceId,
          suggestion: `Document "${relation.sourceId}" should be reviewed`,
          priority: 'high'
        };
      }
    });

    // Automation: Risk Identified → Suggest Mitigation Task
    this.addAutomation({
      id: 'AUTO-013',
      name: 'Risk to Mitigation',
      trigger: {
        relationType: Relation.TYPES.IDENTIFIES,
        sourceType: 'Risk'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_mitigation_task',
          sourceId: relation.sourceId,
          suggestion: `Risk "${relation.sourceId}" requires mitigation tasks`,
          priority: 'high'
        };
      }
    });

    // Automation: Knowledge Created → Suggest Template
    this.addAutomation({
      id: 'AUTO-014',
      name: 'Knowledge to Template',
      trigger: {
        relationType: Relation.TYPES.CREATES,
        sourceType: 'Knowledge'
      },
      action: (relation, graph) => {
        // Check if this knowledge is reusable
        const hasMultipleUses = graph.getOutgoingRelations(relation.sourceId)
          .filter(r => r.relationType === Relation.TYPES.USES).length > 2;
        
        if (hasMultipleUses) {
          return {
            type: 'suggest_template',
            sourceId: relation.sourceId,
            suggestion: `Knowledge "${relation.sourceId}" is frequently used - consider creating a template`,
            priority: 'medium'
          };
        }
        
        return null;
      }
    });

    // Automation: Release Created → Suggest Deployment Evidence
    this.addAutomation({
      id: 'AUTO-015',
      name: 'Release to Deployment Evidence',
      trigger: {
        relationType: Relation.TYPES.CREATES,
        sourceType: 'Release'
      },
      action: (relation, graph) => {
        return {
          type: 'suggest_deployment_evidence',
          sourceId: relation.sourceId,
          suggestion: `Release "${relation.sourceId}" should have deployment evidence`,
          priority: 'high'
        };
      }
    });
  }

  /**
   * Add a custom automation
   */
  addAutomation(automation) {
    this.automations.set(automation.id, automation);
  }

  /**
   * Remove an automation
   */
  removeAutomation(automationId) {
    this.automations.delete(automationId);
  }

  /**
   * Queue a graph event
   */
  queueEvent(event) {
    this.eventQueue.push({
      ...event,
      queuedAt: new Date().toISOString()
    });
  }

  /**
   * Process queued events
   */
  processEvents() {
    const processedSuggestions = [];
    
    for (const event of this.eventQueue) {
      const suggestions = this.triggerAutomations(event);
      processedSuggestions.push(...suggestions);
    }
    
    this.eventQueue = [];
    this.suggestions.push(...processedSuggestions);
    
    return processedSuggestions;
  }

  /**
   * Trigger automations based on an event
   */
  triggerAutomations(event) {
    const suggestions = [];
    
    for (const [automationId, automation] of this.automations) {
      if (this.matchesTrigger(event, automation.trigger)) {
        const suggestion = automation.action(event, this.graphManager);
        if (suggestion) {
          suggestions.push({
            ...suggestion,
            automationId,
            triggeredBy: event,
            generatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    return suggestions;
  }

  /**
   * Check if event matches trigger
   */
  matchesTrigger(event, trigger) {
    if (trigger.relationType && event.relationType !== trigger.relationType) {
      return false;
    }
    
    if (trigger.sourceType && event.sourceType !== trigger.sourceType) {
      return false;
    }
    
    if (trigger.targetType && event.targetType !== trigger.targetType) {
      return false;
    }
    
    return true;
  }

  /**
   * Get pending suggestions
   */
  getPendingSuggestions() {
    return this.suggestions.filter(s => !suggestion.actioned);
  }

  /**
   * Get suggestions by priority
   */
  getSuggestionsByPriority(priority) {
    return this.suggestions.filter(s => s.priority === priority && !s.actioned);
  }

  /**
   * Get suggestions for a specific object
   */
  getSuggestionsForObject(objectId) {
    return this.suggestions.filter(s => s.sourceId === objectId && !s.actioned);
  }

  /**
   * Mark suggestion as actioned
   */
  markSuggestionActioned(suggestionId) {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.actioned = true;
      suggestion.actionedAt = new Date().toISOString();
    }
  }

  /**
   * Dismiss a suggestion
   */
  dismissSuggestion(suggestionId) {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.dismissed = true;
      suggestion.dismissedAt = new Date().toISOString();
    }
  }

  /**
   * Get suggestion summary
   */
  getSuggestionSummary() {
    const summary = {
      total: this.suggestions.length,
      pending: 0,
      actioned: 0,
      dismissed: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {}
    };
    
    for (const suggestion of this.suggestions) {
      if (suggestion.actioned) {
        summary.actioned++;
      } else if (suggestion.dismissed) {
        summary.dismissed++;
      } else {
        summary.pending++;
      }
      
      if (summary.byPriority[suggestion.priority] !== undefined) {
        summary.byPriority[suggestion.priority]++;
      }
      
      summary.byType[suggestion.type] = 
        (summary.byType[suggestion.type] || 0) + 1;
    }
    
    return summary;
  }

  /**
   * Clear processed suggestions
   */
  clearProcessedSuggestions() {
    this.suggestions = this.suggestions.filter(s => !s.actioned && !s.dismissed);
  }

  /**
   * Clear all suggestions
   */
  clearAllSuggestions() {
    this.suggestions = [];
  }
}

export default AutomationEngine;
