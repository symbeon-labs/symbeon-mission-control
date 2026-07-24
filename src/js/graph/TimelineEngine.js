/**
 * TimelineEngine - Generates timeline events from graph projections
 * 
 * Timeline is no longer manually written.
 * Timeline becomes a graph projection.
 * Every relation generates timeline events automatically.
 */

import { Relation } from './Relation.js';

export class TimelineEngine {
  constructor(graphManager) {
    this.graphManager = graphManager;
    this.events = new Map();
    this.eventIndex = new Map();
    this.nextEventId = 1;
  }

  /**
   * Generate timeline event from a relation
   */
  generateEventFromRelation(relation, actor = null, impact = 'medium', category = 'operational') {
    const eventId = this.generateEventId();
    
    const event = {
      id: eventId,
      timestamp: relation.created,
      actor: actor || relation.createdBy,
      relatedObjects: [
        {
          id: relation.sourceId,
          type: relation.sourceType,
          role: 'source'
        },
        {
          id: relation.targetId,
          type: relation.targetType,
          role: 'target'
        }
      ],
      evidence: this.extractEvidence(relation),
      impact,
      category,
      relationId: relation.id,
      relationType: relation.relationType,
      title: this.generateEventTitle(relation),
      description: this.generateEventDescription(relation),
      metadata: relation.metadata
    };
    
    this.events.set(eventId, event);
    this.indexEvent(event);
    
    return event;
  }

  /**
   * Generate event title based on relation type
   */
  generateEventTitle(relation) {
    const titles = {
      [Relation.TYPES.CREATES]: `${relation.sourceType} Created`,
      [Relation.TYPES.GENERATES]: `${relation.sourceType} Generated`,
      [Relation.TYPES.APPROVES]: `${relation.sourceType} Approved`,
      [Relation.TYPES.DEPENDS_ON]: `${relation.sourceType} Depends on ${relation.targetType}`,
      [Relation.TYPES.BLOCKS]: `${relation.sourceType} Blocks ${relation.targetType}`,
      [Relation.TYPES.RELATES_TO]: `${relation.sourceType} Related to ${relation.targetType}`,
      [Relation.TYPES.IMPLEMENTS]: `${relation.sourceType} Implements ${relation.targetType}`,
      [Relation.TYPES.USES]: `${relation.sourceType} Uses ${relation.targetType}`,
      [Relation.TYPES.SUPERSEDES]: `${relation.sourceType} Supersedes ${relation.targetType}`,
      [Relation.TYPES.DERIVES_FROM]: `${relation.sourceType} Derives from ${relation.targetType}`,
      [Relation.TYPES.LEARNS_FROM]: `${relation.sourceType} Learns from ${relation.targetType}`,
      [Relation.TYPES.VALIDATES]: `${relation.sourceType} Validates ${relation.targetType}`,
      [Relation.TYPES.DELIVERS]: `${relation.sourceType} Delivers ${relation.targetType}`,
      [Relation.TYPES.BELONGS_TO]: `${relation.sourceType} Belongs to ${relation.targetType}`,
      [Relation.TYPES.CONTAINS]: `${relation.sourceType} Contains ${relation.targetType}`,
      [Relation.TYPES.REFERENCES]: `${relation.sourceType} References ${relation.targetType}`,
      [Relation.TYPES.ATTACHED_TO]: `${relation.sourceType} Attached to ${relation.targetType}`,
      [Relation.TYPES.PROVES]: `${relation.sourceType} Proves ${relation.targetType}`,
      [Relation.TYPES.REQUIRES]: `${relation.sourceType} Requires ${relation.targetType}`,
      [Relation.TYPES.ENABLES]: `${relation.sourceType} Enables ${relation.targetType}`,
      [Relation.TYPES.INFLUENCES]: `${relation.sourceType} Influences ${relation.targetType}`
    };
    
    return titles[relation.relationType] || `${relation.sourceType} Relation Created`;
  }

  /**
   * Generate event description based on relation
   */
  generateEventDescription(relation) {
    const descriptions = {
      [Relation.TYPES.CREATES]: `Created ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.GENERATES]: `Generated ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.APPROVES]: `Approved ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.DEPENDS_ON]: `Depends on ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.BLOCKS]: `Blocks ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.RELATES_TO]: `Related to ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.IMPLEMENTS]: `Implements ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.USES]: `Uses ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.SUPERSEDES]: `Supersedes ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.DERIVES_FROM]: `Derived from ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.LEARNS_FROM]: `Learns from ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.VALIDATES]: `Validates ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.DELIVERS]: `Delivers ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.BELONGS_TO]: `Belongs to ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.CONTAINS]: `Contains ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.REFERENCES]: `References ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.ATTACHED_TO]: `Attached to ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.PROVES]: `Proves ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.REQUIRES]: `Requires ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.ENABLES]: `Enables ${relation.targetType} ${relation.targetId}`,
      [Relation.TYPES.INFLUENCES]: `Influences ${relation.targetType} ${relation.targetId}`
    };
    
    return descriptions[relation.relationType] || `Relation created between ${relation.sourceType} and ${relation.targetType}`;
  }

  /**
   * Extract evidence from relation
   */
  extractEvidence(relation) {
    const evidence = [];
    
    if (relation.relationType === Relation.TYPES.PROVES || 
        relation.relationType === Relation.TYPES.ATTACHED_TO) {
      evidence.push({
        id: relation.targetId,
        type: relation.targetType
      });
    }
    
    return evidence;
  }

  /**
   * Index event for fast lookup
   */
  indexEvent(event) {
    // Index by timestamp
    const timestamp = event.timestamp;
    if (!this.eventIndex.has(timestamp)) {
      this.eventIndex.set(timestamp, new Set());
    }
    this.eventIndex.get(timestamp).add(event.id);
    
    // Index by related objects
    for (const obj of event.relatedObjects) {
      const key = `object:${obj.id}`;
      if (!this.eventIndex.has(key)) {
        this.eventIndex.set(key, new Set());
      }
      this.eventIndex.get(key).add(event.id);
    }
    
    // Index by category
    const categoryKey = `category:${event.category}`;
    if (!this.eventIndex.has(categoryKey)) {
      this.eventIndex.set(categoryKey, new Set());
    }
    this.eventIndex.get(categoryKey).add(event.id);
    
    // Index by relation type
    const relationKey = `relation:${event.relationType}`;
    if (!this.eventIndex.has(relationKey)) {
      this.eventIndex.set(relationKey, new Set());
    }
    this.eventIndex.get(relationKey).add(event.id);
  }

  /**
   * Get event by ID
   */
  getEvent(eventId) {
    return this.events.get(eventId);
  }

  /**
   * Get events for a specific object
   */
  getEventsForObject(objectId) {
    const eventIds = this.eventIndex.get(`object:${objectId}`) || new Set();
    return Array.from(eventIds)
      .map(id => this.events.get(id))
      .filter(e => e)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category) {
    const eventIds = this.eventIndex.get(`category:${category}`) || new Set();
    return Array.from(eventIds)
      .map(id => this.events.get(id))
      .filter(e => e)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get events by relation type
   */
  getEventsByRelationType(relationType) {
    const eventIds = this.eventIndex.get(`relation:${relationType}`) || new Set();
    return Array.from(eventIds)
      .map(id => this.events.get(id))
      .filter(e => e)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get events in time range
   */
  getEventsInTimeRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.events.values())
      .filter(event => {
        const timestamp = new Date(event.timestamp);
        return timestamp >= start && timestamp <= end;
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 10) {
    return Array.from(this.events.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get timeline for a specific object chain
   */
  getObjectTimeline(objectId, maxDepth = 5) {
    const events = [];
    const visited = new Set();
    const queue = [{ id: objectId, depth: 0 }];
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      
      if (depth >= maxDepth || visited.has(id)) continue;
      visited.add(id);
      
      // Get events for this object
      const objectEvents = this.getEventsForObject(id);
      events.push(...objectEvents);
      
      // Traverse graph to find related objects
      const outgoing = this.graphManager.getOutgoingRelations(id);
      for (const relation of outgoing) {
        queue.push({ id: relation.targetId, depth: depth + 1 });
      }
      
      const incoming = this.graphManager.getIncomingRelations(id);
      for (const relation of incoming) {
        queue.push({ id: relation.sourceId, depth: depth + 1 });
      }
    }
    
    // Remove duplicates and sort
    const uniqueEvents = Array.from(
      new Map(events.map(e => [e.id, e])).values()
    );
    
    return uniqueEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Generate timeline statistics
   */
  generateStatistics() {
    const stats = {
      totalEvents: this.events.size,
      byCategory: {},
      byRelationType: {},
      byObjectType: {},
      byImpact: {},
      eventsPerDay: {},
      mostActiveObjects: []
    };
    
    for (const event of this.events.values()) {
      // Count by category
      stats.byCategory[event.category] = 
        (stats.byCategory[event.category] || 0) + 1;
      
      // Count by relation type
      stats.byRelationType[event.relationType] = 
        (stats.byRelationType[event.relationType] || 0) + 1;
      
      // Count by object type
      for (const obj of event.relatedObjects) {
        stats.byObjectType[obj.type] = 
          (stats.byObjectType[obj.type] || 0) + 1;
      }
      
      // Count by impact
      stats.byImpact[event.impact] = 
        (stats.byImpact[event.impact] || 0) + 1;
      
      // Count events per day
      const date = event.timestamp.split('T')[0];
      stats.eventsPerDay[date] = 
        (stats.eventsPerDay[date] || 0) + 1;
    }
    
    // Find most active objects
    const objectActivity = new Map();
    for (const event of this.events.values()) {
      for (const obj of event.relatedObjects) {
        objectActivity.set(obj.id, (objectActivity.get(obj.id) || 0) + 1);
      }
    }
    
    stats.mostActiveObjects = Array.from(objectActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));
    
    return stats;
  }

  /**
   * Rebuild timeline from graph
   */
  rebuildTimeline() {
    this.events.clear();
    this.eventIndex.clear();
    
    for (const relation of this.graphManager.relations.values()) {
      if (relation.active) {
        this.generateEventFromRelation(relation);
      }
    }
    
    return this.events.size;
  }

  /**
   * Generate event ID
   */
  generateEventId() {
    return `TLE-${String(this.nextEventId++).padStart(6, '0')}`;
  }

  /**
   * Export timeline to JSON
   */
  exportToJSON() {
    return {
      events: Array.from(this.events.values()),
      statistics: this.generateStatistics()
    };
  }

  /**
   * Import timeline from JSON
   */
  importFromJSON(json) {
    this.events.clear();
    this.eventIndex.clear();
    
    for (const eventData of json.events) {
      this.events.set(eventData.id, eventData);
      this.indexEvent(eventData);
    }
    
    // Update next ID
    const maxId = Math.max(...json.events.map(e => parseInt(e.id.split('-')[1])));
    this.nextEventId = maxId + 1;
  }
}

export default TimelineEngine;
