const crypto = require('crypto');

class Scheduler {
  constructor(workerPortRegistry, eventQueue) {
    this._workers = workerPortRegistry;
    this._events = eventQueue;
    this._assignmentHistory = [];
    this._recentAssignments = new Map();
    this._assignmentSequence = 0;
  }

  schedule(mission, options = {}) {
    const requiredCaps = mission.metadata.requiredCapabilities;
    const selectedWorkers = [];

    for (const cap of requiredCaps) {
      const worker = this._selectWorker(cap, mission);
      if (worker) {
        selectedWorkers.push({
          worker,
          capability: cap,
          assignedAt: new Date().toISOString()
        });
        this._recordAssignment(worker.workerId, mission.id, cap);
      }
    }

    if (selectedWorkers.length === 0) return [];

    const assignment = {
      missionId: mission.id,
      type: mission.type,
      target: mission.target,
      workers: selectedWorkers.map(w => ({
        workerId: w.worker.workerId,
        model: w.worker.model,
        capability: w.capability
      })),
      scheduledAt: new Date().toISOString(),
      routingKey: this._computeRoutingKey(mission)
    };

    for (const w of selectedWorkers) {
      w.worker.transition('assigned', { missionId: mission.id });
    }

    this._events.emit('worker_assigned', {
      missionId: mission.id,
      assignments: selectedWorkers.map(w => ({ workerId: w.worker.workerId, capability: w.capability }))
    });

    return [assignment];
  }

  scheduleForConsensus(mission, workerCount = 3) {
    if (mission.metadata.requiredCapabilities.length === 0) return [];
    if (workerCount < 2) return [];

    const primaryCap = mission.metadata.requiredCapabilities[0];
    const workers = this._workers.findAvailable(primaryCap, workerCount);

    if (workers.length < 2) return [];

    const assignment = {
      missionId: mission.id,
      type: mission.type,
      target: mission.target,
      workers: workers.map(w => ({ workerId: w.workerId, model: w.model, capability: primaryCap })),
      scheduledAt: new Date().toISOString(),
      consensusCount: workers.length,
      routingKey: this._computeRoutingKey(mission)
    };

    for (const w of workers) {
      w.transition('assigned', { missionId: mission.id });
      this._recordAssignment(w.workerId, mission.id, primaryCap);
    }

    this._events.emit('worker_assigned', {
      missionId: mission.id,
      assignments: workers.map(w => ({ workerId: w.workerId, capability: primaryCap })),
      consensusCount: workers.length
    });

    return [assignment];
  }

  _selectWorker(capability, mission) {
    const seed = JSON.stringify({
      capability,
      missionId: mission.id,
      missionType: mission.type,
      target: mission.target
    });

    const available = this._workers.findAvailable(capability, 10);
    if (available.length === 0) return null;

    const loadBalanced = available.sort((a, b) => {
      const aRecent = this._getRecentLoad(a.workerId);
      const bRecent = this._getRecentLoad(b.workerId);
      if (aRecent !== bRecent) return aRecent - bRecent;
      return a.currentLoad - b.currentLoad;
    });

    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const index = parseInt(hash.substring(0, 8), 16) % loadBalanced.length;

    return loadBalanced[index];
  }

  _computeRoutingKey(mission) {
    const raw = `${mission.type}:${mission.target || 'global'}:${mission.metadata.priority}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 12);
  }

  _recordAssignment(workerId, missionId, capability) {
    if (!this._recentAssignments.has(workerId)) {
      this._recentAssignments.set(workerId, []);
    }
    this._recentAssignments.get(workerId).push({
      missionId,
      capability,
      sequence: this._assignmentSequence++
    });
    this._assignmentHistory.push({
      workerId,
      missionId,
      capability,
      sequence: this._assignmentSequence
    });
    this._cleanupOldAssignments();
  }

  _cleanupOldAssignments() {
    const recentThreshold = Math.max(0, this._assignmentSequence - 100);
    for (const [workerId, assignments] of this._recentAssignments.entries()) {
      const filtered = assignments.filter(a => a.sequence >= recentThreshold);
      this._recentAssignments.set(workerId, filtered);
    }
    if (this._assignmentHistory.length > 1000) {
      this._assignmentHistory = this._assignmentHistory.slice(-1000);
    }
  }

  _getRecentLoad(workerId) {
    const assignments = this._recentAssignments.get(workerId) || [];
    const recentThreshold = Math.max(0, this._assignmentSequence - 10);
    const recent = assignments.filter(a => a.sequence >= recentThreshold);
    return recent.length;
  }

  getStats() {
    return {
      totalAssignments: this._assignmentHistory.length,
      workerUtilization: Array.from(this._recentAssignments.entries()).map(([id, assignments]) => ({
        workerId: id,
        recentLoad: this._getRecentLoad(id),
        totalJobs: assignments.length
      }))
    };
  }

  reset() {
    this._recentAssignments.clear();
    this._assignmentSequence = 0;
  }
}

module.exports = { Scheduler };
