/**
 * Evidence - Operational Object for evidence
 * Extends OperationalObject
 */

import { OperationalObject } from './OperationalObject.js';

export class Evidence extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.type = data.type || 'document';
    this.source = data.source || '';
    this.source_url = data.source_url || null;
    this.file_path = data.file_path || null;
    this.file_size = data.file_size || null;
    this.mime_type = data.mime_type || null;
    this.hash = data.hash || null;
    this.verified = data.verified || false;
    this.verified_by = data.verified_by || null;
    this.verified_at = data.verified_at || null;
    this.related_objects = data.related_objects || [];
    this.tags = data.tags || [];
  }

  /**
   * Evidence types
   */
  static TYPES = {
    DOCUMENT: 'document',
    MEETING: 'meeting',
    CONTRACT: 'contract',
    IMAGE: 'image',
    COMMIT: 'commit',
    PULL_REQUEST: 'pull_request',
    DEPLOYMENT: 'deployment',
    VIDEO: 'video',
    PRESENTATION: 'presentation',
    PDF: 'pdf',
    RELEASE: 'release'
  };

  /**
   * Verify evidence
   */
  verify(verifier) {
    this.verified = true;
    this.verified_by = verifier;
    this.verified_at = new Date().toISOString();
    this.addHistory('verified', verifier, {});
  }

  /**
   * Add related object
   */
  addRelatedObject(objectId, objectType) {
    this.related_objects.push({
      id: objectId,
      type: objectType,
      linked_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Add tag
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.touch();
    }
  }

  /**
   * Remove tag
   */
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    this.touch();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      type: this.type,
      source: this.source,
      source_url: this.source_url,
      file_path: this.file_path,
      file_size: this.file_size,
      mime_type: this.mime_type,
      hash: this.hash,
      verified: this.verified,
      verified_by: this.verified_by,
      verified_at: this.verified_at,
      related_objects: this.related_objects,
      tags: this.tags
    };
  }

  static fromJSON(json) {
    return new Evidence(json);
  }
}

export default Evidence;
