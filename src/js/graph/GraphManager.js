/**
 * GraphManager - Core operational graph engine
 * 
 * Responsible for managing the operational knowledge graph
 * All relationships are stored and traversed through this engine
 */

import { Relation } from './Relation.js';

export class GraphManager {
  constructor() {
    this.relations = new Map(); // id -> Relation
    this.sourceIndex = new Map(); // sourceId -> Set of relationIds
    this.targetIndex = new Map(); // targetId -> Set of relationIds
    this.typeIndex = new Map(); // relationType -> Set of relationIds
    this.cache = new Map(); // traversal cache
    this.nextRelationId = 1;
  }

  /**
   * Create a new relation
   */
  createRelation(sourceId, targetId, sourceType, targetType, relationType, createdBy = null, metadata = {}) {
    const id = this.generateRelationId();
    const relation = new Relation({
      id,
      sourceId,
      targetId,
      sourceType,
      targetType,
      relationType,
      createdBy,
      metadata
    });

    const validation = relation.validate();
    if (!validation.valid) {
      throw new Error(`Invalid relation: ${validation.errors.join(', ')}`);
    }

    this.relations.set(id, relation);
    this.indexRelation(relation);
    this.clearCache();

    return relation;
  }

  /**
   * Remove a relation
   */
  removeRelation(relationId) {
    const relation = this.relations.get(relationId);
    if (!relation) {
      throw new Error(`Relation not found: ${relationId}`);
    }

    relation.deactivate();
    this.clearCache();

    return relation;
  }

  /**
   * Update relation metadata
   */
  updateRelation(relationId, metadata) {
    const relation = this.relations.get(relationId);
    if (!relation) {
      throw new Error(`Relation not found: ${relationId}`);
    }

    Object.assign(relation.metadata, metadata);
    this.clearCache();

    return relation;
  }

  /**
   * Get relation by ID
   */
  getRelation(relationId) {
    return this.relations.get(relationId);
  }

  /**
   * Get all relations for a source object
   */
  getOutgoingRelations(sourceId) {
    const relationIds = this.sourceIndex.get(sourceId) || new Set();
    return Array.from(relationIds)
      .map(id => this.relations.get(id))
      .filter(r => r && r.active);
  }

  /**
   * Get all relations for a target object
   */
  getIncomingRelations(targetId) {
    const relationIds = this.targetIndex.get(targetId) || new Set();
    return Array.from(relationIds)
      .map(id => this.relations.get(id))
      .filter(r => r && r.active);
  }

  /**
   * Get all relations of a specific type
   */
  getRelationsByType(relationType) {
    const relationIds = this.typeIndex.get(relationType) || new Set();
    return Array.from(relationIds)
      .map(id => this.relations.get(id))
      .filter(r => r && r.active);
  }

  /**
   * Find all dependencies of an object (transitive)
   */
  findDependencies(objectId, maxDepth = 10) {
    const dependencies = new Set();
    const visited = new Set();
    const queue = [{ id: objectId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      
      if (depth >= maxDepth || visited.has(id)) continue;
      visited.add(id);

      const outgoing = this.getOutgoingRelations(id);
      for (const relation of outgoing) {
        if (relation.isDependency()) {
          dependencies.add(relation.targetId);
          queue.push({ id: relation.targetId, depth: depth + 1 });
        }
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Find all descendants of an object
   */
  findDescendants(objectId, maxDepth = 10) {
    const descendants = new Set();
    const visited = new Set();
    const queue = [{ id: objectId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      
      if (depth >= maxDepth || visited.has(id)) continue;
      visited.add(id);

      const outgoing = this.getOutgoingRelations(id);
      for (const relation of outgoing) {
        descendants.add(relation.targetId);
        queue.push({ id: relation.targetId, depth: depth + 1 });
      }
    }

    return Array.from(descendants);
  }

  /**
   * Find all ancestors of an object
   */
  findAncestors(objectId, maxDepth = 10) {
    const ancestors = new Set();
    const visited = new Set();
    const queue = [{ id: objectId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      
      if (depth >= maxDepth || visited.has(id)) continue;
      visited.add(id);

      const incoming = this.getIncomingRelations(id);
      for (const relation of incoming) {
        ancestors.add(relation.sourceId);
        queue.push({ id: relation.sourceId, depth: depth + 1 });
      }
    }

    return Array.from(ancestors);
  }

  /**
   * Find shortest path between two objects
   */
  findShortestPath(sourceId, targetId) {
    if (sourceId === targetId) return [];

    const queue = [{ id: sourceId, path: [] }];
    const visited = new Set();

    while (queue.length > 0) {
      const { id, path } = queue.shift();
      
      if (visited.has(id)) continue;
      visited.add(id);

      if (id === targetId) {
        return path;
      }

      const outgoing = this.getOutgoingRelations(id);
      for (const relation of outgoing) {
        queue.push({
          id: relation.targetId,
          path: [...path, relation]
        });
      }
    }

    return null; // No path found
  }

  /**
   * Impact analysis: What breaks if this object changes?
   */
  analyzeImpact(objectId) {
    const impact = {
      direct: [],
      transitive: [],
      critical: [],
      total: 0
    };

    // Direct impact (objects that depend on this)
    const incoming = this.getIncomingRelations(objectId);
    for (const relation of incoming) {
      if (relation.isDependency()) {
        impact.direct.push({
          objectId: relation.sourceId,
          relationType: relation.relationType,
          sourceType: relation.sourceType
        });
      }
    }

    // Transitive impact (cascade)
    const ancestors = this.findAncestors(objectId);
    for (const ancestorId of ancestors) {
      if (!impact.direct.some(d => d.objectId === ancestorId)) {
        impact.transitive.push(ancestorId);
      }
    }

    // Critical impact (blocking relations)
    for (const relation of incoming) {
      if (relation.relationType === Relation.TYPES.BLOCKS) {
        impact.critical.push({
          objectId: relation.sourceId,
          sourceType: relation.sourceType
        });
      }
    }

    impact.total = impact.direct.length + impact.transitive.length + impact.critical.length;

    return impact;
  }

  /**
   * Detect orphan objects (no incoming or outgoing relations)
   */
  detectOrphanObjects(allObjectIds) {
    const orphans = [];
    
    for (const objectId of allObjectIds) {
      const incoming = this.getIncomingRelations(objectId);
      const outgoing = this.getOutgoingRelations(objectId);
      
      if (incoming.length === 0 && outgoing.length === 0) {
        orphans.push(objectId);
      }
    }

    return orphans;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const detectCycle = (objectId, path = []) => {
      if (recursionStack.has(objectId)) {
        const cycleStart = path.indexOf(objectId);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(objectId)) return;

      visited.add(objectId);
      recursionStack.add(objectId);

      const outgoing = this.getOutgoingRelations(objectId);
      for (const relation of outgoing) {
        if (relation.isDependency()) {
          detectCycle(relation.targetId, [...path, objectId]);
        }
      }

      recursionStack.delete(objectId);
    };

    // Check all objects that have outgoing dependency relations
    for (const [objectId] of this.sourceIndex) {
      if (!visited.has(objectId)) {
        detectCycle(objectId);
      }
    }

    return cycles;
  }

  /**
   * Generate graph statistics
   */
  generateStatistics() {
    const stats = {
      totalRelations: 0,
      activeRelations: 0,
      relationTypes: {},
      objectTypes: {},
      averageDegree: 0,
      density: 0,
      connectedComponents: 0
    };

    for (const relation of this.relations.values()) {
      stats.totalRelations++;
      if (relation.active) {
        stats.activeRelations++;
      }
      
      // Count by relation type
      stats.relationTypes[relation.relationType] = 
        (stats.relationTypes[relation.relationType] || 0) + 1;
      
      // Count by object types
      stats.objectTypes[relation.sourceType] = 
        (stats.objectTypes[relation.sourceType] || 0) + 1;
      stats.objectTypes[relation.targetType] = 
        (stats.objectTypes[relation.targetType] || 0) + 1;
    }

    // Calculate average degree
    const uniqueObjects = new Set();
    for (const relation of this.relations.values()) {
      if (relation.active) {
        uniqueObjects.add(relation.sourceId);
        uniqueObjects.add(relation.targetId);
      }
    }
    
    if (uniqueObjects.size > 0) {
      stats.averageDegree = (stats.activeRelations * 2) / uniqueObjects.size;
    }

    return stats;
  }

  /**
   * Get dependency tree for an object
   */
  getDependencyTree(objectId, maxDepth = 5) {
    const tree = {
      id: objectId,
      dependencies: []
    };

    const buildTree = (currentId, depth) => {
      if (depth >= maxDepth) return;

      const outgoing = this.getOutgoingRelations(currentId);
      for (const relation of outgoing) {
        if (relation.isDependency()) {
          const node = {
            id: relation.targetId,
            relationType: relation.relationType,
            targetType: relation.targetType,
            dependencies: []
          };
          tree.dependencies.push(node);
          buildTree(relation.targetId, depth + 1);
        }
      }
    };

    buildTree(objectId, 0);
    return tree;
  }

  /**
   * Get impact tree for an object (what depends on this)
   */
  getImpactTree(objectId, maxDepth = 5) {
    const tree = {
      id: objectId,
      impacted: []
    };

    const buildTree = (currentId, depth) => {
      if (depth >= maxDepth) return;

      const incoming = this.getIncomingRelations(currentId);
      for (const relation of incoming) {
        const node = {
          id: relation.sourceId,
          relationType: relation.relationType,
          sourceType: relation.sourceType,
          impacted: []
        };
        tree.impacted.push(node);
        buildTree(relation.sourceId, depth + 1);
      }
    };

    buildTree(objectId, 0);
    return tree;
  }

  /**
   * Get evidence tree for an object
   */
  getEvidenceTree(objectId) {
    const evidence = [];
    const visited = new Set();
    const queue = [objectId];

    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      const outgoing = this.getOutgoingRelations(id);
      for (const relation of outgoing) {
        if (relation.isEvidence()) {
          evidence.push({
            evidenceId: relation.targetId,
            relationType: relation.relationType
          });
        }
        queue.push(relation.targetId);
      }
    }

    return evidence;
  }

  /**
   * Get knowledge tree for an object
   */
  getKnowledgeTree(objectId) {
    const knowledge = [];
    const visited = new Set();
    const queue = [objectId];

    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      const outgoing = this.getOutgoingRelations(id);
      for (const relation of outgoing) {
        if (relation.relationType === Relation.TYPES.LEARNS_FROM) {
          knowledge.push({
            knowledgeId: relation.targetId,
            metadata: relation.metadata
          });
        }
        queue.push(relation.targetId);
      }
    }

    return knowledge;
  }

  /**
   * Get history tree for an object
   */
  getHistoryTree(objectId) {
    const history = [];
    const incoming = this.getIncomingRelations(objectId);
    
    for (const relation of incoming) {
      if (relation.relationType === Relation.TYPES.DERIVES_FROM) {
        history.push({
          previousId: relation.sourceId,
          relationType: relation.relationType,
          created: relation.created
        });
      }
    }

    return history.sort((a, b) => new Date(a.created) - new Date(b.created));
  }

  /**
   * Index a relation for fast lookup
   */
  indexRelation(relation) {
    // Source index
    if (!this.sourceIndex.has(relation.sourceId)) {
      this.sourceIndex.set(relation.sourceId, new Set());
    }
    this.sourceIndex.get(relation.sourceId).add(relation.id);

    // Target index
    if (!this.targetIndex.has(relation.targetId)) {
      this.targetIndex.set(relation.targetId, new Set());
    }
    this.targetIndex.get(relation.targetId).add(relation.id);

    // Type index
    if (!this.typeIndex.has(relation.relationType)) {
      this.typeIndex.set(relation.relationType, new Set());
    }
    this.typeIndex.get(relation.relationType).add(relation.id);
  }

  /**
   * Generate relation ID
   */
  generateRelationId() {
    return `REL-${String(this.nextRelationId++).padStart(6, '0')}`;
  }

  /**
   * Clear traversal cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Export graph to JSON
   */
  exportToJSON() {
    return {
      relations: Array.from(this.relations.values()).map(r => r.toJSON()),
      statistics: this.generateStatistics()
    };
  }

  /**
   * Import graph from JSON
   */
  importFromJSON(json) {
    this.relations.clear();
    this.sourceIndex.clear();
    this.targetIndex.clear();
    this.typeIndex.clear();
    this.clearCache();

    for (const relationData of json.relations) {
      const relation = Relation.fromJSON(relationData);
      this.relations.set(relation.id, relation);
      this.indexRelation(relation);
    }

    // Update next ID
    const maxId = Math.max(...json.relations.map(r => parseInt(r.id.split('-')[1])));
    this.nextRelationId = maxId + 1;
  }
}

export default GraphManager;
