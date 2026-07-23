/**
 * Knowledge - Operational Object for captured knowledge
 * Extends OperationalObject
 */

import { OperationalObject } from './OperationalObject.js';

export class Knowledge extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.source_type = data.source_type || 'task';
    this.source_id = data.source_id || null;
    this.category = data.category || 'lesson_learned';
    this.content = data.content || '';
    this.applicability = data.applicability || 'general';
    this.tags = data.tags || [];
    this.related_tasks = data.related_tasks || [];
    this.related_projects = data.related_projects || [];
    this.template_generated = data.template_generated || false;
    this.template_id = data.template_id || null;
    this.usage_count = data.usage_count || 0;
  }

  /**
   * Knowledge categories
   */
  static CATEGORIES = {
    LESSON_LEARNED: 'lesson_learned',
    BEST_PRACTICE: 'best_practice',
    PATTERN: 'pattern',
    ANTI_PATTERN: 'anti_pattern',
    DECISION_RECORD: 'decision_record',
    TECHNICAL_DEBT: 'technical_debt',
    PROCESS_IMPROVEMENT: 'process_improvement',
    ARCHITECTURAL_INSIGHT: 'architectural_insight'
  };

  /**
   * Applicability levels
   */
  static APPLICABILITY = {
    SPECIFIC: 'specific',
    PROJECT: 'project',
    GENERAL: 'general',
    UNIVERSAL: 'universal'
  };

  /**
   * Record usage
   */
  recordUsage() {
    this.usage_count++;
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
   * Generate template from this knowledge
   */
  generateTemplate(templateId) {
    this.template_generated = true;
    this.template_id = templateId;
    this.addHistory('template_generated', this.owner, { template_id: templateId });
  }

  /**
   * Link to task
   */
  linkToTask(taskId) {
    if (!this.related_tasks.includes(taskId)) {
      this.related_tasks.push(taskId);
      this.touch();
    }
  }

  /**
   * Link to project
   */
  linkToProject(projectId) {
    if (!this.related_projects.includes(projectId)) {
      this.related_projects.push(projectId);
      this.touch();
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      source_type: this.source_type,
      source_id: this.source_id,
      category: this.category,
      content: this.content,
      applicability: this.applicability,
      tags: this.tags,
      related_tasks: this.related_tasks,
      related_projects: this.related_projects,
      template_generated: this.template_generated,
      template_id: this.template_id,
      usage_count: this.usage_count
    };
  }

  static fromJSON(json) {
    return new Knowledge(json);
  }
}

export default Knowledge;
