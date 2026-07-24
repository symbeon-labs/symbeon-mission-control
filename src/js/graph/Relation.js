/**
 * Relation - Represents a typed edge in the operational graph
 * 
 * Every relationship between OperationalObjects is a Relation
 * Relations are the source of truth for organizational intelligence
 */

export class Relation {
  constructor(data = {}) {
    this.id = data.id || null;
    this.sourceId = data.sourceId || null;
    this.targetId = data.targetId || null;
    this.sourceType = data.sourceType || null;
    this.targetType = data.targetType || null;
    this.relationType = data.relationType || null;
    this.created = data.created || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    this.metadata = data.metadata || {};
    this.active = data.active !== undefined ? data.active : true;
  }

  /**
   * Relation types supported in the operational graph
   */
  static TYPES = {
    CREATES: 'CREATES',
    GENERATES: 'GENERATES',
    APPROVES: 'APPROVES',
    DEPENDS_ON: 'DEPENDS_ON',
    BLOCKS: 'BLOCKS',
    RELATES_TO: 'RELATES_TO',
    IMPLEMENTS: 'IMPLEMENTS',
    USES: 'USES',
    SUPERSEDES: 'SUPERSEDES',
    DERIVES_FROM: 'DERIVES_FROM',
    LEARNS_FROM: 'LEARNS_FROM',
    VALIDATES: 'VALIDATES',
    DELIVERS: 'DELIVERS',
    BELONGS_TO: 'BELONGS_TO',
    CONTAINS: 'CONTAINS',
    REFERENCES: 'REFERENCES',
    ATTACHED_TO: 'ATTACHED_TO',
    PROVES: 'PROVES',
    REQUIRES: 'REQUIRES',
    ENABLES: 'ENABLES',
    INFLUENCES: 'INFLUENCES'
  };

  /**
   * Validate the relation
   */
  validate() {
    const errors = [];
    
    if (!this.id) errors.push('ID is required');
    if (!this.sourceId) errors.push('Source ID is required');
    if (!this.targetId) errors.push('Target ID is required');
    if (!this.sourceType) errors.push('Source type is required');
    if (!this.targetType) errors.push('Target type is required');
    if (!this.relationType) errors.push('Relation type is required');
    if (!Object.values(Relation.TYPES).includes(this.relationType)) {
      errors.push(`Invalid relation type: ${this.relationType}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if this relation is a dependency relation
   */
  isDependency() {
    return [
      Relation.TYPES.DEPENDS_ON,
      Relation.TYPES.REQUIRES,
      Relation.TYPES.BLOCKS
    ].includes(this.relationType);
  }

  /**
   * Check if this relation is a governance relation
   */
  isGovernance() {
    return [
      Relation.TYPES.APPROVES,
      Relation.TYPES.VALIDATES,
      Relation.TYPES.AUTHORIZES
    ].includes(this.relationType);
  }

  /**
   * Check if this relation is an evidence relation
   */
  isEvidence() {
    return [
      Relation.TYPES.PROVES,
      Relation.TYPES.VALIDATES,
      Relation.TYPES.ATTACHED_TO
    ].includes(this.relationType);
  }

  /**
   * Deactivate this relation
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Activate this relation
   */
  activate() {
    this.active = true;
  }

  /**
   * Update metadata
   */
  updateMetadata(key, value) {
    this.metadata[key] = value;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      sourceType: this.sourceType,
      targetType: this.targetType,
      relationType: this.relationType,
      created: this.created,
      createdBy: this.createdBy,
      metadata: this.metadata,
      active: this.active
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json) {
    return new Relation(json);
  }
}

export default Relation;
