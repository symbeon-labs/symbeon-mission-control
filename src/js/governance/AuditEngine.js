/**
 * AuditEngine - Auditable governance decisions
 * 
 * Every governance decision must be auditable
 * Every policy execution is logged
 * Every violation is historically preserved
 * Nothing is deleted
 * Everything is versioned
 */

export class AuditEngine {
  constructor(graphManager, policyEngine) {
    this.graphManager = graphManager;
    this.policyEngine = policyEngine;
    this.auditLogs = new Map();
    this.nextAuditLogId = 1;
  }

  /**
   * Log a policy execution
   */
  logPolicyExecution(policyId, objectId, objectType, result, actor) {
    const auditLog = this.createAuditLog({
      type: 'policy_execution',
      policyId,
      objectId,
      objectType,
      result,
      actor,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Log a violation creation
   */
  logViolationCreation(violationId, policyId, objectId, objectType, actor) {
    const auditLog = this.createAuditLog({
      type: 'violation_created',
      violationId,
      policyId,
      objectId,
      objectType,
      actor,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Log a violation resolution
   */
  logViolationResolution(violationId, resolver, resolution) {
    const auditLog = this.createAuditLog({
      type: 'violation_resolved',
      violationId,
      resolver,
      resolution,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Log a governance score change
   */
  logGovernanceScoreChange(previousScore, newScore, metrics, actor) {
    const auditLog = this.createAuditLog({
      type: 'governance_score_change',
      previousScore,
      newScore,
      metrics,
      actor,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Log a maturity level change
   */
  logMaturityLevelChange(previousLevel, newLevel, score, actor) {
    const auditLog = this.createAuditLog({
      type: 'maturity_level_change',
      previousLevel,
      newLevel,
      score,
      actor,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Log a recommendation action
   */
  logRecommendationAction(recommendationId, action, actor, details) {
    const auditLog = this.createAuditLog({
      type: 'recommendation_action',
      recommendationId,
      action, // acknowledged, dismissed, implemented
      actor,
      details,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Log a graph modification
   */
  logGraphModification(relationId, modificationType, previousState, newState, actor) {
    const auditLog = this.createAuditLog({
      type: 'graph_modification',
      relationId,
      modificationType, // created, updated, removed
      previousState,
      newState,
      actor,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Log a policy modification
   */
  logPolicyModification(policyId, modificationType, previousState, newState, actor) {
    const auditLog = this.createAuditLog({
      type: 'policy_modification',
      policyId,
      modificationType, // created, updated, enabled, disabled
      previousState,
      newState,
      actor,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  }

  /**
   * Create an audit log entry
   */
  createAuditLog(data) {
    const id = this.generateAuditLogId();
    
    const auditLog = {
      id,
      type: data.type,
      timestamp: data.timestamp,
      actor: data.actor,
      data: {
        ...data
      },
      version: 1
    };
    
    this.auditLogs.set(id, auditLog);
    
    return auditLog;
  }

  /**
   * Get audit log by ID
   */
  getAuditLog(auditLogId) {
    return this.auditLogs.get(auditLogId);
  }

  /**
   * Get audit logs by type
   */
  getAuditLogsByType(type) {
    return Array.from(this.auditLogs.values()).filter(log => log.type === type);
  }

  /**
   * Get audit logs by actor
   */
  getAuditLogsByActor(actor) {
    return Array.from(this.auditLogs.values()).filter(log => log.actor === actor);
  }

  /**
   * Get audit logs by date range
   */
  getAuditLogsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.auditLogs.values()).filter(log => {
      const timestamp = new Date(log.timestamp);
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * Get audit logs for a specific object
   */
  getAuditLogsForObject(objectId) {
    return Array.from(this.auditLogs.values()).filter(log => 
      log.data.objectId === objectId || log.data.relationId === objectId
    );
  }

  /**
   * Get audit logs for a specific policy
   */
  getAuditLogsForPolicy(policyId) {
    return Array.from(this.auditLogs.values()).filter(log => log.data.policyId === policyId);
  }

  /**
   * Get recent audit logs
   */
  getRecentAuditLogs(limit = 100) {
    return Array.from(this.auditLogs.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get audit statistics
   */
  getAuditStatistics() {
    const logs = Array.from(this.auditLogs.values());
    const stats = {
      totalLogs: logs.length,
      byType: {},
      byActor: {},
      byDate: {},
      recentActivity: []
    };
    
    for (const log of logs) {
      // Count by type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // Count by actor
      stats.byActor[log.actor] = (stats.byActor[log.actor] || 0) + 1;
      
      // Count by date
      const date = log.timestamp.split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    }
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    stats.recentActivity = logs
      .filter(log => new Date(log.timestamp) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
    
    return stats;
  }

  /**
   * Generate audit trail for an object
   */
  generateAuditTrail(objectId) {
    const logs = this.getAuditLogsForObject(objectId);
    
    return {
      objectId,
      totalEvents: logs.length,
      events: logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      summary: this.summarizeAuditTrail(logs)
    };
  }

  /**
   * Summarize audit trail
   */
  summarizeAuditTrail(logs) {
    const summary = {
      policyExecutions: 0,
      violationsCreated: 0,
      violationsResolved: 0,
      graphModifications: 0,
      policyModifications: 0,
      governanceScoreChanges: 0,
      firstEvent: null,
      lastEvent: null
    };
    
    for (const log of logs) {
      switch (log.type) {
        case 'policy_execution':
          summary.policyExecutions++;
          break;
        case 'violation_created':
          summary.violationsCreated++;
          break;
        case 'violation_resolved':
          summary.violationsResolved++;
          break;
        case 'graph_modification':
          summary.graphModifications++;
          break;
        case 'policy_modification':
          summary.policyModifications++;
          break;
        case 'governance_score_change':
          summary.governanceScoreChanges++;
          break;
      }
    }
    
    if (logs.length > 0) {
      summary.firstEvent = logs[0].timestamp;
      summary.lastEvent = logs[logs.length - 1].timestamp;
    }
    
    return summary;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(startDate, endDate) {
    const logs = this.getAuditLogsByDateRange(startDate, endDate);
    
    const report = {
      period: { startDate, endDate },
      totalEvents: logs.length,
      policyExecutions: logs.filter(l => l.type === 'policy_execution').length,
      violationsCreated: logs.filter(l => l.type === 'violation_created').length,
      violationsResolved: logs.filter(l => l.type === 'violation_resolved').length,
      governanceScoreChanges: logs.filter(l => l.type === 'governance_score_change').length,
      maturityLevelChanges: logs.filter(l => l.type === 'maturity_level_change').length,
      topActors: this.getTopActors(logs),
      dailyActivity: this.getDailyActivity(logs)
    };
    
    return report;
  }

  /**
   * Get top actors
   */
  getTopActors(logs) {
    const actorCounts = new Map();
    
    for (const log of logs) {
      actorCounts.set(log.actor, (actorCounts.get(log.actor) || 0) + 1);
    }
    
    return Array.from(actorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actor, count]) => ({ actor, count }));
  }

  /**
   * Get daily activity
   */
  getDailyActivity(logs) {
    const dailyActivity = new Map();
    
    for (const log of logs) {
      const date = log.timestamp.split('T')[0];
      dailyActivity.set(date, (dailyActivity.get(date) || 0) + 1);
    }
    
    return Array.from(dailyActivity.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Export audit logs to JSON
   */
  exportToJSON() {
    return {
      auditLogs: Array.from(this.auditLogs.values()),
      statistics: this.getAuditStatistics()
    };
  }

  /**
   * Import audit logs from JSON
   */
  importFromJSON(json) {
    this.auditLogs.clear();
    
    for (const auditLogData of json.auditLogs) {
      this.auditLogs.set(auditLogData.id, auditLogData);
    }
    
    // Update next ID
    const maxId = Math.max(...json.auditLogs.map(l => parseInt(l.id.split('-')[1])));
    this.nextAuditLogId = maxId + 1;
  }

  /**
   * Generate audit log ID
   */
  generateAuditLogId() {
    return `AUDIT-${String(this.nextAuditLogId++).padStart(6, '0')}`;
  }
}

export default AuditEngine;
