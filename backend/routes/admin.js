const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Goal = require('../models/Goal');
const AuditLog = require('../models/AuditLog');
const { protect, authorizeRoles } = require('../middleware/auth');

// ─────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────

// GET /api/admin/users — get all users
router.get('/users', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('manager', 'name email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users/:id — get single user
router.get('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('manager', 'name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id — update user (assign manager, change role etc)
router.put('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, role, department, manager } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.role = role || user.role;
    user.department = department || user.department;
    user.manager = manager || user.manager;

    await user.save();

    await AuditLog.create({
      action: 'USER_UPDATED',
      performedBy: req.user._id,
      targetUser: user._id,
      details: `User "${user.name}" updated by admin`,
    });

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// ASSIGN MANAGER TO EMPLOYEE
// ─────────────────────────────────────────

// PUT /api/admin/assign-manager
router.put('/assign-manager', protect, authorizeRoles('admin'), async (req, res) => {
  const { employeeId, managerId } = req.body;
  try {
    const employee = await User.findById(employeeId);
    const manager = await User.findById(managerId);

    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    if (manager.role !== 'manager') {
      return res.status(400).json({ message: 'Selected user is not a manager' });
    }

    employee.manager = managerId;
    await employee.save();

    // Also update all existing goals of this employee
    await Goal.updateMany(
      { employee: employeeId },
      { manager: managerId }
    );

    await AuditLog.create({
      action: 'MANAGER_ASSIGNED',
      performedBy: req.user._id,
      targetUser: employee._id,
      details: `Manager "${manager.name}" assigned to employee "${employee.name}"`,
    });

    res.json({ message: `Manager "${manager.name}" assigned to "${employee.name}"` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────

// GET /api/admin/audit-logs
router.get('/audit-logs', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .populate('targetGoal', 'title')
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// REPORTS & DASHBOARD
// ─────────────────────────────────────────

// GET /api/admin/reports/achievement
// Returns all goals with planned vs actual for CSV export
router.get('/reports/achievement', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const goals = await Goal.find()
      .populate('employee', 'name email department')
      .populate('manager', 'name email');

    const report = goals.map((goal) => {
      const q1 = goal.quarterlyUpdates.find((q) => q.quarter === 'Q1');
      const q2 = goal.quarterlyUpdates.find((q) => q.quarter === 'Q2');
      const q3 = goal.quarterlyUpdates.find((q) => q.quarter === 'Q3');
      const q4 = goal.quarterlyUpdates.find((q) => q.quarter === 'Q4');

      return {
        employeeName: goal.employee?.name || '',
        employeeEmail: goal.employee?.email || '',
        department: goal.employee?.department || '',
        managerName: goal.manager?.name || '',
        thrustArea: goal.thrustArea,
        goalTitle: goal.title,
        uom: goal.uom,
        target: goal.target,
        weightage: goal.weightage,
        status: goal.status,
        q1Achievement: q1?.achievement || 'N/A',
        q1Score: q1?.progressScore || 0,
        q1Status: q1?.progressStatus || 'not_started',
        q2Achievement: q2?.achievement || 'N/A',
        q2Score: q2?.progressScore || 0,
        q2Status: q2?.progressStatus || 'not_started',
        q3Achievement: q3?.achievement || 'N/A',
        q3Score: q3?.progressScore || 0,
        q3Status: q3?.progressStatus || 'not_started',
        q4Achievement: q4?.achievement || 'N/A',
        q4Score: q4?.progressScore || 0,
        q4Status: q4?.progressStatus || 'not_started',
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/reports/completion-dashboard
// Shows which employees/managers completed check-ins
router.get('/reports/completion-dashboard', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' }).select('-password');
    const dashboard = [];

    for (const user of users) {
      const goals = await Goal.find({ employee: user._id });

      const completionData = {
        employeeId: user._id,
        employeeName: user.name,
        email: user.email,
        department: user.department,
        totalGoals: goals.length,
        approvedGoals: goals.filter((g) => g.status === 'approved').length,
        submittedGoals: goals.filter((g) => g.status === 'submitted').length,
        draftGoals: goals.filter((g) => g.status === 'draft').length,
        q1Done: goals.some((g) => g.quarterlyUpdates.find((q) => q.quarter === 'Q1')),
        q2Done: goals.some((g) => g.quarterlyUpdates.find((q) => q.quarter === 'Q2')),
        q3Done: goals.some((g) => g.quarterlyUpdates.find((q) => q.quarter === 'Q3')),
        q4Done: goals.some((g) => g.quarterlyUpdates.find((q) => q.quarter === 'Q4')),
      };

      dashboard.push(completionData);
    }

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/reports/managers
// Manager effectiveness — check-in completion rates
router.get('/reports/managers', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' }).select('-password');
    const report = [];

    for (const manager of managers) {
      const teamGoals = await Goal.find({ manager: manager._id });
      const teamEmployees = [...new Set(teamGoals.map((g) => g.employee.toString()))];

      report.push({
        managerId: manager._id,
        managerName: manager.name,
        email: manager.email,
        department: manager.department,
        totalTeamMembers: teamEmployees.length,
        totalGoals: teamGoals.length,
        approvedGoals: teamGoals.filter((g) => g.status === 'approved').length,
        pendingApproval: teamGoals.filter((g) => g.status === 'submitted').length,
        goalsWithQ1Checkin: teamGoals.filter((g) =>
          g.quarterlyUpdates.find((q) => q.quarter === 'Q1' && q.managerComment)
        ).length,
      });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;