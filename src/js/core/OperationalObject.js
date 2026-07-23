/**
 * OperationalObject - Base class for all entities in Mission Control
 * 
 * Every object in the system inherits this foundation:
 * - id
 * - title
 * - description
 * - owner
 * - project
 * - status
 * - version
 * - created
 * - updated
 * - relations
 * - dependencies
 * - evidence
 * - history
 * - metadata
 */

export class OperationalObject {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.owner = data.owner || null;
    this.project = data.project || null;
    this.status = data.status || 'draft';
    this.version = data.version || '1.0';
    this.created = data.created || new Date().toISOString();
    this.updated = data.updated || new Date().toISOString();
    this.relations = data.relations || [];
    this.dependencies = data.dependencies || [];
    this.evidence = data.evidence || [];
    this.history = data.history || [];
    this.metadata = data.metadata || {};
  }

  /**
   * Add a relation to this object
   * @param {string} targetId - ID of the target object
   * @param {string} relationType - Type of relation (e.g., 'creates', 'belongs_to', 'references')
   * @param {string} description - Description of the relation
   */
  addRelation(targetId, relationType, description = '') {
    this.relations.push({
      target_id: targetId,
      type: relationType,
      description,
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Remove a relation from this object
   * @param {string} targetId - ID of the target object
   * @param {string} relationType - Type of relation
   */
  removeRelation(targetId, relationType) {
    this.relations = this.relations.filter(
      r => !(r.target_id === targetId && r.type === relationType)
    );
    this.touch();
  }

  /**
   * Add a dependency to this object
   * @param {string} dependencyId - ID of the dependent object
   */
  addDependency(dependencyId) {
    if (!this.dependencies.includes(dependencyId)) {
      this.dependencies.push(dependencyId);
      this.touch();
    }
  }

  /**
   * Remove a dependency from this object
   * @param {string} dependencyId - ID of the dependent object
   */
  removeDependency(dependencyId) {
    this.dependencies = this.dependencies.filter(id => id !== dependencyId);
    this.touch();
  }

  /**
   * Add evidence to this object
   * @param {string} evidenceId - ID of the evidence object
   */
  addEvidence(evidenceId) {
    if (!this.evidence.includes(evidenceId)) {
      this.evidence.push(evidenceId);
      this.touch();
    }
  }

  /**
   * Remove evidence from this object
   * @param {string} evidenceId - ID of the evidence object
   */
  removeEvidence(evidenceId) {
    this.evidence = this.evidence.filter(id => id !== evidenceId);
    this.touch();
  }

  /**
   * Add a history entry
   * @param {string} action - Action performed
   * @param {string} actor - Who performed the action
   * @param {object} changes - Changes made
   */
  addHistory(action, actor, changes = {}) {
    this.history.push({
      action,
      actor,
      changes,
      timestamp: new Date().toISOString(),
      version: this.version
    });
    this.touch();
  }

  /**
   * Update the object's timestamp
   */
  touch() {
    this.updated = new Date().toISOString();
  }

  /**
   * Increment version
   */
  incrementVersion() {
    const parts = this.version.split('.');
    parts[parts.length - 1] = parseInt(parts[parts.length - 1]) + 1;
    this.version = parts.join('.');
    this.touch();
  }

  /**
   * Get incoming relations (objects that reference this object)
   * This would be computed from the graph database
   */
  getIncomingRelations() {
    // To be implemented when graph system is ready
    return [];
  }

  /**
   * Get outgoing relations (objects this object references)
   */
  getOutgoingRelations() {
    return this.relations;
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph() {
    // To be implemented when graph system is ready
    return {
      direct: this.dependencies,
      transitive: []
    };
  }

  /**
   * Get historical graph
   */
  getHistoricalGraph() {
    return this.history;
  }

  /**
   * Validate the object
   * @returns {object} Validation result with valid flag and errors
   */
  validate() {
    const errors = [];

    if (!this.id) errors.push('ID is required');
    if (!this.title) errors.push('Title is required');
    if (!this.owner) errors.push('Owner is required');
    if (!this.project) errors.push('Project is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      owner: this.owner,
      project: this.project,
      status: this.status,
      version: this.version,
      created: this.created,
      updated: this.updated,
      relations: this.relations,
      dependencies: this.dependencies,
      evidence: this.evidence,
      history: this.history,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new OperationalObject(json);
  }
}

export default OperationalObject;
