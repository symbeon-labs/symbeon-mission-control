/**
 * Task - Operational Object for tasks
 * Extends OperationalObject
 */

import { OperationalObject } from './OperationalObject.js';

export class Task extends OperationalObject {
  constructor(data = {}) {
    super(data);
    this.responsible = data.responsible || null;
    this.category = data.category || 'development';
    this.checklist = data.checklist || [];
    this.priority = data.priority || 'medium';
    this.estimated_hours = data.estimated_hours || null;
    this.actual_hours = data.actual_hours || null;
    this.start_date = data.start_date || null;
    this.due_date = data.due_date || null;
    this.completion_date = data.completion_date || null;
    this.assigned_milestone = data.assigned_milestone || null;
    this.blocked_by = data.blocked_by || [];
    this.blocks = data.blocks || [];
    this.knowledge_captured = data.knowledge_captured || null;
  }

  /**
   * Add checklist item
   */
  addChecklistItem(item) {
    this.checklist.push({
      item,
      completed: false,
      created_at: new Date().toISOString()
    });
    this.touch();
  }

  /**
   * Complete checklist item
   */
  completeChecklistItem(index) {
    if (this.checklist[index]) {
      this.checklist[index].completed = true;
      this.checklist[index].completed_at = new Date().toISOString();
      this.touch();
    }
  }

  /**
   * Mark task as completed
   */
  complete() {
    this.status = 'completed';
    this.completion_date = new Date().toISOString();
    this.addHistory('completed', this.owner, { previous_status: 'in_progress' });
  }

  /**
   * Block this task
   */
  block(blockingTaskId) {
    if (!this.blocked_by.includes(blockingTaskId)) {
      this.blocked_by.push(blockingTaskId);
      this.touch();
    }
  }

  /**
   * Unblock this task
   */
  unblock(blockingTaskId) {
    this.blocked_by = this.blocked_by.filter(id => id !== blockingTaskId);
    this.touch();
  }

  /**
   * Capture knowledge from this task
   */
  captureKnowledge(knowledge) {
    this.knowledge_captured = knowledge;
    this.addHistory('knowledge_captured', this.owner, { knowledge });
  }

  toJSON() {
    return {
      ...super.toJSON(),
      responsible: this.responsible,
      category: this.category,
      checklist: this.checklist,
      priority: this.priority,
      estimated_hours: this.estimated_hours,
      actual_hours: this.actual_hours,
      start_date: this.start_date,
      due_date: this.due_date,
      completion_date: this.completion_date,
      assigned_milestone: this.assigned_milestone,
      blocked_by: this.blocked_by,
      blocks: this.blocks,
      knowledge_captured: this.knowledge_captured
    };
  }

  static fromJSON(json) {
    return new Task(json);
  }
}

export default Task;
