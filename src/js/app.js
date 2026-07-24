/**
 * Symbeon Mission Control - Core Application
 * Operational Development System
 */

import { getNextId, generateId } from './utils/id-generator.js';
import { GraphManager } from './graph/GraphManager.js';
import { LiveGovernance } from './governance/LiveGovernance.js';

class MissionControl {
  constructor() {
    this.currentProject = 'guarddrive';
    this.currentModule = 'dashboard';
    this.data = {};
    
    this.init();
  }

  async init() {
    this.graphManager = new GraphManager();
    this.liveGovernance = new LiveGovernance(this.graphManager);
    
    await this.loadProjectData();
    
    const allObjects = this.getAllObjectsArray();
    this.liveGovernance.initialize(allObjects);
    
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

  getAllObjectsArray() {
    const objects = [];
    if (this.data.tasks) this.data.tasks.forEach(t => objects.push({ ...t, type: 'Task' }));
    if (this.data.milestones) this.data.milestones.forEach(m => objects.push({ ...m, type: 'Milestone' }));
    if (this.data.decisions) this.data.decisions.forEach(d => objects.push({ ...d, type: 'Decision' }));
    if (this.data.documents) this.data.documents.forEach(d => objects.push({ ...d, type: 'Document' }));
    if (this.data.evidence) this.data.evidence.forEach(e => objects.push({ ...e, type: 'Evidence' }));
    if (this.data.releases) this.data.releases.forEach(r => objects.push({ ...r, type: 'Release' }));
    if (this.data.risks) this.data.risks.forEach(r => objects.push({ ...r, type: 'Risk' }));
    return objects;
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
      meetings: 'Meetings',
      mindmap: 'Mind Map & Operational Graph',
      dirtree: 'Codebase Directory Tree',
      insights: 'Insights & Epistemic Studio',
      skills: 'Skills & Agent Workspace'
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
      case 'mindmap':
        contentArea.innerHTML = this.renderMindMap();
        break;
      case 'dirtree':
        contentArea.innerHTML = this.renderDirectoryTree();
        break;
      case 'insights':
        contentArea.innerHTML = this.renderInsights();
        break;
      case 'skills':
        contentArea.innerHTML = this.renderSkills();
        break;
      default:
        contentArea.innerHTML = `<div class="card"><div class="card-header"><h2 class="card-title">${title}</h2><p class="card-subtitle">Module under development</p></div></div>`;
    }
  }

  renderDashboard() {
    const taskStats = this.calculateTaskStats();
    const milestoneStats = this.calculateMilestoneStats();
    const decisionStats = this.calculateDecisionStats();

    let governanceHtml = '';
    if (this.liveGovernance) {
      const govData = this.liveGovernance.getDashboardData();
      const scoreColor = govData.overall.score >= 80 ? 'var(--color-success, #28a745)' : (govData.overall.score >= 60 ? 'var(--color-warning, #ffc107)' : 'var(--color-danger, #dc3545)');
      
      governanceHtml = `
      <div class="card" style="margin-bottom: var(--spacing-xl); border-top: 4px solid ${scoreColor};">
        <div class="card-header">
          <h2 class="card-title">Live Governance Score</h2>
          <p class="card-subtitle">Continuous Compliance & Maturity</p>
        </div>
        <div class="grid grid-4" style="margin-top: var(--spacing-md);">
          <div class="stat-card">
            <div class="stat-value" style="color: ${scoreColor};">${govData.overall.score} <span style="font-size: 0.5em">/ 100</span></div>
            <div class="stat-label">Governance Grade: <strong>${govData.overall.grade}</strong></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${govData.overall.maturityLevel}</div>
            <div class="stat-label">${govData.overall.maturity} Maturity</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: ${govData.violations.critical > 0 ? 'var(--color-danger, #dc3545)' : 'inherit'};">${govData.violations.unresolved}</div>
            <div class="stat-label">Unresolved Violations (${govData.violations.critical} Critical)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${govData.compliance.averageRate}%</div>
            <div class="stat-label">Policy Compliance</div>
          </div>
        </div>
      </div>
      `;
    }

    return `
      ${governanceHtml}
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

  renderMindMap() {
    const objects = this.getAllObjectsArray();
    
    return `
      <div class="card" style="margin-bottom: var(--spacing-xl);">
        <div class="card-header">
          <h2 class="card-title">Mind Map & Operational Graph</h2>
          <p class="card-subtitle">Visual topology of Milestones, Decisions, Tasks, and Evidence</p>
        </div>
        <div style="margin-top: var(--spacing-md); display: flex; gap: var(--spacing-md);">
          <button class="btn btn-primary" onclick="app.createNewDecision()">+ Add Decision Node</button>
          <button class="btn" onclick="app.createNewTask()">+ Add Task Node</button>
        </div>
      </div>

      <div class="grid grid-3" style="gap: var(--spacing-lg);">
        <div class="card">
          <h3 style="font-size: 14px; text-transform: uppercase; color: var(--color-primary); margin-bottom: var(--spacing-md);">🎯 Milestones</h3>
          ${this.data.milestones.length > 0 
            ? this.data.milestones.map(m => `
              <div style="padding: var(--spacing-md); background: rgba(0,0,0,0.1); border-left: 3px solid var(--color-primary); margin-bottom: var(--spacing-sm); border-radius: 4px;">
                <strong>${m.id}</strong>: ${m.objective}
                <div style="font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">Status: ${m.status}</div>
              </div>
            `).join('')
            : '<p style="font-size: 12px; color: var(--color-text-secondary);">No milestones defined</p>'
          }
        </div>

        <div class="card">
          <h3 style="font-size: 14px; text-transform: uppercase; color: var(--color-warning); margin-bottom: var(--spacing-md);">📝 Decisions</h3>
          ${this.data.decisions.length > 0 
            ? this.data.decisions.map(d => `
              <div style="padding: var(--spacing-md); background: rgba(0,0,0,0.1); border-left: 3px solid var(--color-warning); margin-bottom: var(--spacing-sm); border-radius: 4px;">
                <strong>${d.id}</strong>: ${d.title}
                <div style="font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">Generates Tasks → Verified by Evidence</div>
              </div>
            `).join('')
            : '<p style="font-size: 12px; color: var(--color-text-secondary);">No decisions logged</p>'
          }
        </div>

        <div class="card">
          <h3 style="font-size: 14px; text-transform: uppercase; color: var(--color-success); margin-bottom: var(--spacing-md);">🔍 Evidence & Proofs</h3>
          ${this.data.evidence.length > 0 
            ? this.data.evidence.map(e => `
              <div style="padding: var(--spacing-md); background: rgba(0,0,0,0.1); border-left: 3px solid var(--color-success); margin-bottom: var(--spacing-sm); border-radius: 4px;">
                <strong>${e.id}</strong>: ${e.title || e.type}
                <div style="font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">LAW-0003 Verified: ${e.sourceUrl || 'Cryptographic Proof'}</div>
              </div>
            `).join('')
            : '<p style="font-size: 12px; color: var(--color-text-secondary);">No evidence attached</p>'
          }
        </div>
      </div>
    `;
  }

  renderDirectoryTree() {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Codebase Directory Tree</h2>
          <p class="card-subtitle">Source code files mapped to Operational Evidence & Governance</p>
        </div>
        <div style="margin-top: var(--spacing-lg); font-family: monospace; font-size: 13px; line-height: 1.8;">
          <div style="color: var(--color-primary); font-weight: bold;">📁 / (Root Workspace)</div>
          <div style="padding-left: 20px;">├── 📁 src/</div>
          <div style="padding-left: 40px;">├── 📄 app.js <span class="badge badge-success">Mapped to TASK-002</span></div>
          <div style="padding-left: 40px;">├── 📁 core/</div>
          <div style="padding-left: 60px;">├── 📄 OperationalObject.js <span class="badge badge-primary">LAW-0001 Core</span></div>
          <div style="padding-left: 40px;">├── 📁 graph/</div>
          <div style="padding-left: 60px;">├── 📄 GraphManager.js <span class="badge badge-warning">Graph Engine</span></div>
          <div style="padding-left: 60px;">└── 📄 RuleEngine.js <span class="badge badge-success">Policy Evaluator</span></div>
          <div style="padding-left: 40px;">└── 📁 governance/</div>
          <div style="padding-left: 60px;">├── 📄 LiveGovernance.js <span class="badge badge-primary">Phase 4 Engine</span></div>
          <div style="padding-left: 60px;">└── 📄 PolicyEngine.js <span class="badge badge-warning">14 Rules</span></div>
          <div style="padding-left: 20px;">├── 📁 specifications/</div>
          <div style="padding-left: 40px;">├── 📄 MCS-0000.md to MCS-1000.md <span class="badge badge-success">Normative Specs</span></div>
          <div style="padding-left: 20px;">├── 📁 mcp-server/</div>
          <div style="padding-left: 40px;">└── 📄 index.js <span class="badge badge-primary">Phase 5 Agent Hub</span></div>
        </div>
      </div>
    `;
  }

  renderInsights() {
    return `
      <div class="card" style="margin-bottom: var(--spacing-xl);">
        <div class="card-header">
          <h2 class="card-title">Insights & Epistemic Studio</h2>
          <p class="card-subtitle">MCS-0006 Lifecycle: Observation → Fact → Pattern → Knowledge → Policy</p>
        </div>
        <div style="margin-top: var(--spacing-md);">
          <textarea placeholder="Capture a new raw observation or technical insight..." style="width: 100%; height: 80px; padding: var(--spacing-md); background: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 4px;"></textarea>
          <div style="margin-top: var(--spacing-sm); display: flex; gap: var(--spacing-md);">
            <button class="btn btn-primary" onclick="alert('Insight captured! Epistemic Pipeline started.')">+ Register Insight</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title" style="font-size: 16px;">Active Institutional Knowledge</h3>
        <div style="margin-top: var(--spacing-md);">
          <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--color-border);">
            <strong>KNOW-001: Graph-based state is non-hierarchical</strong>
            <p style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">Derived from MCS-1000 Theory. Status: <span class="badge badge-success">Standard</span></p>
          </div>
          <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--color-border);">
            <strong>KNOW-002: Evidence requires cryptographic hash or URI</strong>
            <p style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">Derived from LAW-0003. Status: <span class="badge badge-primary">Policy Enforced</span></p>
          </div>
        </div>
      </div>
    `;
  }

  renderSkills() {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Skills & Agent Workspace</h2>
          <p class="card-subtitle">Active AI Skills and Agent Governance Contracts (MCS-0009)</p>
        </div>
        <div style="margin-top: var(--spacing-lg); display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-lg);">
          <div style="padding: var(--spacing-md); border: 1px solid var(--color-border); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3>⚡ mission-control-executive</h3>
              <span class="badge badge-success">Active</span>
            </div>
            <p style="font-size: 13px; color: var(--color-text-secondary); margin-top: var(--spacing-sm);">Especialista em otimização executiva e governança ALM. Lê o Operational Graph, analisa violações e aplica políticas de rastreabilidade (Evidence-First).</p>
            <div style="margin-top: var(--spacing-md);">
              <button class="btn btn-primary" onclick="alert('Running Live Governance Audit...')">Run Executive Audit</button>
            </div>
          </div>

          <div style="padding: var(--spacing-md); border: 1px solid var(--color-border); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3>🛡️ guarddrive-forensics</h3>
              <span class="badge badge-primary">Workspace Skill</span>
            </div>
            <p style="font-size: 13px; color: var(--color-text-secondary); margin-top: var(--spacing-sm);">Especialista em atestação de veículos (L1), protocolo Symbeon (L2) e tokenização ESG (L4) para conformidade com a base de verdade do GuardDrive.</p>
            <div style="margin-top: var(--spacing-md);">
              <button class="btn" onclick="alert('Checking GuardDrive Telemetry Evidence...')">Verify L1/L2 Evidence</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize application
const app = new MissionControl();
