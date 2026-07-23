/**
 * Symbeon Mission Control - Core Application
 * Operational Development System
 */

import { getNextId, generateId } from './utils/id-generator.js';

class MissionControl {
  constructor() {
    this.currentProject = 'guarddrive';
    this.currentModule = 'dashboard';
    this.data = {};
    
    this.init();
  }

  async init() {
    await this.loadProjectData();
    this.setupEventListeners();
    this.renderModule('dashboard');
  }

  async loadProjectData() {
    try {
      const projectData = await this.loadJson(`storage/projects/${this.currentProject}/project.json`);
      const tasks = await this.loadJson(`storage/projects/${this.currentProject}/tasks.json`);
      const milestones = await this.loadJson(`storage/projects/${this.currentProject}/milestones.json`);
      const documents = await this.loadJson(`storage/projects/${this.currentProject}/documents.json`);
      const decisions = await this.loadJson(`storage/projects/${this.currentProject}/decisions.json`);
      const evidence = await this.loadJson(`storage/projects/${this.currentProject}/evidence.json`);
      const releases = await this.loadJson(`storage/projects/${this.currentProject}/releases.json`);
      const stakeholders = await this.loadJson(`storage/projects/${this.currentProject}/stakeholders.json`);
      const risk = await this.loadJson(`storage/projects/${this.currentProject}/risk.json`);
      const meetings = await this.loadJson(`storage/projects/${this.currentProject}/meetings.json`);
      const approvals = await this.loadJson(`storage/projects/${this.currentProject}/approvals.json`);
      const timeline = await this.loadJson(`storage/projects/${this.currentProject}/timeline.json`);

      this.data = {
        project: projectData,
        tasks: tasks.tasks || [],
        tasksNextId: tasks.next_id || 1,
        milestones: milestones.milestones || [],
        milestonesNextId: milestones.next_id || 1,
        documents: documents.documents || [],
        documentsNextId: documents.next_id || 1,
        decisions: decisions.decisions || [],
        decisionsNextId: decisions.next_id || 1,
        evidence: evidence.evidence || [],
        evidenceNextId: evidence.next_id || 1,
        releases: releases.releases || [],
        releasesNextId: releases.next_id || 1,
        stakeholders: stakeholders.stakeholders || [],
        stakeholdersNextId: stakeholders.next_id || 1,
        risks: risk.risks || [],
        risksNextId: risk.next_id || 1,
        meetings: meetings.meetings || [],
        meetingsNextId: meetings.next_id || 1,
        approvals: approvals.approvals || [],
        approvalsNextId: approvals.next_id || 1,
        timeline: timeline.events || [],
        timelineNextId: timeline.next_id || 1
      };
    } catch (error) {
      console.error('Error loading project data:', error);
      this.data = this.getEmptyData();
    }
  }

  async loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    return await response.json();
  }

  getEmptyData() {
    return {
      project: null,
      tasks: [],
      tasksNextId: 1,
      milestones: [],
      milestonesNextId: 1,
      documents: [],
      documentsNextId: 1,
      decisions: [],
      decisionsNextId: 1,
      evidence: [],
      evidenceNextId: 1,
      releases: [],
      releasesNextId: 1,
      stakeholders: [],
      stakeholdersNextId: 1,
      risks: [],
      risksNextId: 1,
      meetings: [],
      meetingsNextId: 1,
      approvals: [],
      approvalsNextId: 1,
      timeline: [],
      timelineNextId: 1
    };
  }

  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const module = link.dataset.module;
        this.renderModule(module);
      });
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // Project selector
    document.getElementById('project-select')?.addEventListener('change', (e) => {
      this.currentProject = e.target.value;
      this.loadProjectData().then(() => {
        this.renderModule(this.currentModule);
      });
    });
  }

  renderModule(module) {
    this.currentModule = module;
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.module === module) {
        link.classList.add('active');
      }
    });

    // Update page title and breadcrumb
    const titleMap = {
      dashboard: 'Dashboard',
      timeline: 'Timeline',
      milestones: 'Milestones',
      tasks: 'Tasks',
      stakeholders: 'Stakeholders',
      governance: 'Governance',
      decisions: 'Decision Log',
      approvals: 'Approvals',
      risk: 'Risk',
      knowledge: 'Knowledge Base',
      documents: 'Documents',
      evidence: 'Evidence',
      releases: 'Releases',
      meetings: 'Meetings'
    };

    const title = titleMap[module] || module;
    document.getElementById('page-title').textContent = title;
    document.getElementById('breadcrumb').textContent = `${this.currentProject.charAt(0).toUpperCase() + this.currentProject.slice(1)} / ${title}`;

    // Render module content
    const contentArea = document.getElementById('content-area');
    
    switch (module) {
      case 'dashboard':
        contentArea.innerHTML = this.renderDashboard();
        break;
      case 'timeline':
        contentArea.innerHTML = this.renderTimeline();
        break;
      case 'decisions':
        contentArea.innerHTML = this.renderDecisions();
        break;
      case 'tasks':
        contentArea.innerHTML = this.renderTasks();
        break;
      case 'milestones':
        contentArea.innerHTML = this.renderMilestones();
        break;
      case 'documents':
        contentArea.innerHTML = this.renderDocuments();
        break;
      default:
        contentArea.innerHTML = `<div class="card"><div class="card-header"><h2 class="card-title">${title}</h2><p class="card-subtitle">Module under development</p></div></div>`;
    }
  }

  renderDashboard() {
    const taskStats = this.calculateTaskStats();
    const milestoneStats = this.calculateMilestoneStats();
    const decisionStats = this.calculateDecisionStats();

    return `
      <div class="grid grid-4" style="margin-bottom: var(--spacing-xl);">
        <div class="stat-card">
          <div class="stat-value">${this.data.tasks.length}</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${taskStats.completed}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${taskStats.inProgress}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.data.milestones.length}</div>
          <div class="stat-label">Milestones</div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-bottom: var(--spacing-xl);">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Project Overview</h2>
            <p class="card-subtitle">${this.data.project?.name || 'No project loaded'}</p>
          </div>
          ${this.data.project ? `
            <div style="margin-top: var(--spacing-md);">
              <p><strong>Mission:</strong> ${this.data.project.mission}</p>
              <p style="margin-top: var(--spacing-sm);"><strong>Vision:</strong> ${this.data.project.vision}</p>
              <p style="margin-top: var(--spacing-sm);"><strong>Status:</strong> <span class="badge badge-primary">${this.data.project.status}</span></p>
            </div>
          ` : '<p style="color: var(--color-text-secondary);">No project data available</p>'}
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Activity</h2>
            <p class="card-subtitle">Latest timeline events</p>
          </div>
          <div style="margin-top: var(--spacing-md);">
            ${this.data.timeline.length > 0 
              ? this.data.timeline.slice(-5).reverse().map(event => `
                  <div style="padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--color-border);">
                    <div style="font-size: 13px; font-weight: 500;">${event.title}</div>
                    <div style="font-size: 12px; color: var(--color-text-secondary);">${new Date(event.timestamp).toLocaleDateString()}</div>
                  </div>
                `).join('')
              : '<p style="color: var(--color-text-secondary);">No recent activity</p>'
            }
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Quick Actions</h2>
          <p class="card-subtitle">Common operations</p>
        </div>
        <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-md);">
          <button class="btn btn-primary" onclick="app.createNewTask()">+ New Task</button>
          <button class="btn" onclick="app.createNewDecision()">+ Log Decision</button>
          <button class="btn" onclick="app.createNewMilestone()">+ New Milestone</button>
        </div>
      </div>
    `;
  }

  renderTimeline() {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Timeline</h2>
          <p class="card-subtitle">Complete chronological history</p>
        </div>
        <div style="margin-top: var(--spacing-lg);">
          ${this.data.timeline.length > 0 
            ? this.data.timeline.map(event => `
                <div style="padding: var(--spacing-md); border-left: 3px solid var(--color-primary); margin-left: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                  <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: var(--spacing-xs);">${new Date(event.timestamp).toLocaleString()}</div>
                  <div style="font-size: 14px; font-weight: 600;">${event.title}</div>
                  <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: var(--spacing-xs);">${event.description}</div>
                  ${event.entity_id ? `<div style="font-size: 12px; color: var(--color-text-muted); margin-top: var(--spacing-xs);">ID: ${event.entity_id}</div>` : ''}
                </div>
              `).join('')
            : '<p style="color: var(--color-text-secondary);">No timeline events recorded</p>'
          }
        </div>
      </div>
    `;
  }

  renderDecisions() {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Decision Log</h2>
          <p class="card-subtitle">Record of all important decisions</p>
        </div>
        <div style="margin-top: var(--spacing-lg);">
          ${this.data.decisions.length > 0 
            ? `
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.data.decisions.map(dec => `
                      <tr>
                        <td><span class="badge badge-primary">${dec.id}</span></td>
                        <td>${dec.title}</td>
                        <td>${new Date(dec.date).toLocaleDateString()}</td>
                        <td><span class="badge badge-success">${dec.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
            : '<p style="color: var(--color-text-secondary);">No decisions recorded</p>'
          }
        </div>
      </div>
    `;
  }

  renderTasks() {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Tasks</h2>
          <p class="card-subtitle">All project tasks</p>
        </div>
        <div style="margin-top: var(--spacing-lg);">
          ${this.data.tasks.length > 0 
            ? `
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Responsible</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.data.tasks.map(task => `
                      <tr>
                        <td><span class="badge badge-primary">${task.id}</span></td>
                        <td>${task.title}</td>
                        <td><span class="badge ${this.getStatusBadgeClass(task.status)}">${task.status}</span></td>
                        <td>${task.responsible || 'Unassigned'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
            : '<p style="color: var(--color-text-secondary);">No tasks recorded</p>'
          }
        </div>
      </div>
    `;
  }

  renderMilestones() {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Milestones</h2>
          <p class="card-subtitle">Project milestones and deliverables</p>
        </div>
        <div style="margin-top: var(--spacing-lg);">
          ${this.data.milestones.length > 0 
            ? `
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Objective</th>
                      <th>Target Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.data.milestones.map(ms => `
                      <tr>
                        <td><span class="badge badge-primary">${ms.id}</span></td>
                        <td>${ms.objective}</td>
                        <td>${ms.target_date ? new Date(ms.target_date).toLocaleDateString() : 'Not set'}</td>
                        <td><span class="badge ${this.getStatusBadgeClass(ms.status)}">${ms.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
            : '<p style="color: var(--color-text-secondary);">No milestones recorded</p>'
          }
        </div>
      </div>
    `;
  }

  renderDocuments() {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Documents</h2>
          <p class="card-subtitle">All project documents</p>
        </div>
        <div style="margin-top: var(--spacing-lg);">
          ${this.data.documents.length > 0 
            ? `
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Version</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.data.documents.map(doc => `
                      <tr>
                        <td><span class="badge badge-primary">${doc.id}</span></td>
                        <td>${doc.title}</td>
                        <td>${doc.category}</td>
                        <td>${doc.version}</td>
                        <td><span class="badge ${this.getStatusBadgeClass(doc.status)}">${doc.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `
            : '<p style="color: var(--color-text-secondary);">No documents recorded</p>'
          }
        </div>
      </div>
    `;
  }

  calculateTaskStats() {
    return {
      total: this.data.tasks.length,
      completed: this.data.tasks.filter(t => t.status === 'completed').length,
      inProgress: this.data.tasks.filter(t => t.status === 'in_progress').length,
      pending: this.data.tasks.filter(t => t.status === 'pending').length
    };
  }

  calculateMilestoneStats() {
    return {
      total: this.data.milestones.length,
      completed: this.data.milestones.filter(m => m.status === 'completed').length,
      inProgress: this.data.milestones.filter(m => m.status === 'in_progress').length
    };
  }

  calculateDecisionStats() {
    return {
      total: this.data.decisions.length,
      approved: this.data.decisions.filter(d => d.status === 'approved').length
    };
  }

  getStatusBadgeClass(status) {
    const statusMap = {
      completed: 'badge-success',
      approved: 'badge-success',
      in_progress: 'badge-warning',
      pending: 'badge-primary',
      draft: 'badge-secondary',
      rejected: 'badge-danger'
    };
    return statusMap[status] || 'badge-primary';
  }

  createNewTask() {
    const id = getNextId('TASK', this.data.tasksNextId);
    this.data.tasksNextId++;
    
    const task = {
      id,
      title: 'New Task',
      status: 'pending',
      responsible: '',
      category: 'development',
      dependencies: [],
      checklist: [],
      documents: [],
      milestone: null,
      date: new Date().toISOString(),
      impact: 'medium',
      created_at: new Date().toISOString()
    };
    
    this.data.tasks.push(task);
    this.addTimelineEvent('Task Created', `Task ${id} created`, id);
    this.renderModule('tasks');
  }

  createNewDecision() {
    const id = getNextId('DECISION', this.data.decisionsNextId);
    this.data.decisionsNextId++;
    
    const decision = {
      id,
      title: 'New Decision',
      description: '',
      status: 'draft',
      author: '',
      date: new Date().toISOString(),
      alternatives: [],
      rationale: '',
      impact: 'medium',
      created_at: new Date().toISOString()
    };
    
    this.data.decisions.push(decision);
    this.addTimelineEvent('Decision Logged', `Decision ${id} logged`, id);
    this.renderModule('decisions');
  }

  createNewMilestone() {
    const id = getNextId('MILESTONE', this.data.milestonesNextId);
    this.data.milestonesNextId++;
    
    const milestone = {
      id,
      objective: 'New Milestone',
      acceptance_criteria: [],
      dependencies: [],
      documents: [],
      evidence: [],
      deliverables: [],
      target_date: null,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    this.data.milestones.push(milestone);
    this.addTimelineEvent('Milestone Created', `Milestone ${id} created`, id);
    this.renderModule('milestones');
  }

  addTimelineEvent(title, description, entityId = null) {
    const event = {
      id: getNextId('TIMELINE_EVENT', this.data.timelineNextId),
      title,
      description,
      entity_id: entityId,
      timestamp: new Date().toISOString()
    };
    
    this.data.timelineNextId++;
    this.data.timeline.push(event);
  }
}

// Initialize application
const app = new MissionControl();
