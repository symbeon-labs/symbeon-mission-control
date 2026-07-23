/**
 * Document - Operational Object for documents
 * Extends OperationalObject
 */

import { OperationalObject } from './OperationalObject.js';

export class Document extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.category = data.category || 'general';
    this.content = data.content || '';
    this.file_path = data.file_path || null;
    this.file_size = data.file_size || null;
    this.mime_type = data.mime_type || null;
    this.language = data.language || 'en';
    this.reviewed_by = data.reviewed_by || [];
    this.approved_by = data.approved_by || null;
    this.approved_at = data.approved_at || null;
    this.template = data.template || false;
    this.template_id = data.template_id || null;
  }

  /**
   * Document categories
   */
  static CATEGORIES = {
    ARCHITECTURE: 'architecture',
    REQUIREMENTS: 'requirements',
    DESIGN: 'design',
    API: 'api',
    INFRASTRUCTURE: 'infrastructure',
    LEGAL: 'legal',
    COMMERCIAL: 'commercial',
    RESEARCH: 'research',
    MEETING: 'meeting',
    GENERAL: 'general'
  };

  /**
   * Add reviewer
   */
  addReviewer(reviewer) {
    if (!this.reviewed_by.includes(reviewer)) {
      this.reviewed_by.push(reviewer);
      this.touch();
    }
  }

  /**
   * Approve document
   */
  approve(approver) {
    this.approved_by = approver;
    this.approved_at = new Date().toISOString();
    this.status = 'approved';
    this.addHistory('approved', approver, {});
  }

  /**
   * Mark as template
   */
  markAsTemplate(templateId) {
    this.template = true;
    this.template_id = templateId;
    this.touch();
  }

  /**
   * Update content
   */
  updateContent(newContent, actor) {
    const oldContent = this.content;
    this.content = newContent;
    this.incrementVersion();
    this.addHistory('content_updated', actor, { old_content: oldContent.length, new_content: newContent.length });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      category: this.category,
      content: this.content,
      file_path: this.file_path,
      file_size: this.file_size,
      mime_type: this.mime_type,
      language: this.language,
      reviewed_by: this.reviewed_by,
      approved_by: this.approved_by,
      approved_at: this.approved_at,
      template: this.template,
      template_id: this.template_id
    };
  }

  static fromJSON(json) {
    return new Document(json);
  }
}

export default Document;
