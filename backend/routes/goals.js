const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const AuditLog = require('../models/AuditLog');
const { protect, authorizeRoles } = require('../middleware/auth');

// Helper: compute progress score
const computeScore = (uom, target, achievement) => {
  if (!achievement || !target) return 0;
  switch (uom) {
    case 'numeric_min':
      return Math.min((parseFloat(achievement) / parseFloat(target)) * 100, 100);
    case 'numeric_max':
      return Math.min((parseFloat(target) / parseFloat(achievement)) * 100, 100);
    case 'zero':
      return parseFloat(achievement) === 0 ? 100 : 0;
    case 'timeline':
      return achievement <= target ? 100 : 0;
    default:
      return 0;
  }
};

// GET /api/goals/my
router.get('/my', protect, async (req, res) => {
  try {
    const goals = await Goal.find({ employee: req.user._id });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/goals
router.post('/', protect, authorizeRoles('employee'), async (req, res) => {
  const { thrustArea, title, description, uom, target, weightage } = req.body;
  try {
    const existingGoals = await Goal.find({
      employee: req.user._id,
      status: { $ne: 'rework' },
    });
    if (existingGoals.length >= 8) {
      return res.status(400).json({ message: 'Maximum 8 goals allowed per employee' });
    }
    if (weightage < 10) {
      return res.status(400).json({ message: 'Minimum weightage per goal is 10%' });
    }
    const goal = await Goal.create({
      employee: req.user._id,
      manager: req.user.manager,
      thrustArea,
      title,
      description,
      uom,
      target,
      weightage,
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id
router.put('/:id', protect, authorizeRoles('employee'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.isLocked) return res.status(400).json({ message: 'Goal is locked. Contact admin to edit.' });
    if (goal.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { thrustArea, title, description, uom, target, weightage } = req.body;
    if (weightage < 10) {
      return res.status(400).json({ message: 'Minimum weightage per goal is 10%' });
    }
    goal.thrustArea = thrustArea || goal.thrustArea;
    goal.title = title || goal.title;
    goal.description = description || goal.description;
    goal.uom = uom || goal.uom;
    goal.target = target || goal.target;
    goal.weightage = weightage || goal.weightage;
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/goals/submit
router.post('/submit', protect, authorizeRoles('employee'), async (req, res) => {
  try {
    const goals = await Goal.find({
      employee: req.user._id,
      status: 'draft',
    });
    if (goals.length === 0) {
      return res.status(400).json({ message: 'No draft goals to submit' });
    }
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeightage !== 100) {
      return res.status(400).json({
        message: `Total weightage must be 100%. Current total: ${totalWeightage}%`,
      });
    }
    await Goal.updateMany(
      { employee: req.user._id, status: 'draft' },
      { status: 'submitted' }
    );
    res.json({ message: 'Goals submitted successfully for manager approval' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', protect, authorizeRoles('employee'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.isLocked) return res.status(400).json({ message: 'Goal is locked' });
    if (goal.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await goal.deleteOne();
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id/checkin
router.put('/:id/checkin', protect, authorizeRoles('employee'), async (req, res) => {
  const { quarter, achievement, progressStatus } = req.body;
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    const score = computeScore(goal.uom, goal.target, achievement);
    const existingIndex = goal.quarterlyUpdates.findIndex(
      (q) => q.quarter === quarter
    );
    if (existingIndex >= 0) {
      goal.quarterlyUpdates[existingIndex].achievement = achievement;
      goal.quarterlyUpdates[existingIndex].progressStatus = progressStatus;
      goal.quarterlyUpdates[existingIndex].progressScore = score;
      goal.quarterlyUpdates[existingIndex].updatedAt = Date.now();
    } else {
      goal.quarterlyUpdates.push({
        quarter,
        achievement,
        progressStatus,
        progressScore: score,
      });
    }
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/goals/team
router.get('/team', protect, authorizeRoles('manager'), async (req, res) => {
  try {
    const goals = await Goal.find({ manager: req.user._id }).populate(
      'employee',
      'name email department'
    );
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id/approve
router.put('/:id/approve', protect, authorizeRoles('manager'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    goal.status = 'approved';
    goal.isLocked = true;
    await goal.save();
    await AuditLog.create({
      action: 'GOAL_APPROVED',
      performedBy: req.user._id,
      targetGoal: goal._id,
      targetUser: goal.employee,
      details: `Goal "${goal.title}" approved and locked`,
    });
    res.json({ message: 'Goal approved and locked', goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id/rework
router.put('/:id/rework', protect, authorizeRoles('manager'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    goal.status = 'rework';
    goal.isLocked = false;
    await goal.save();
    res.json({ message: 'Goal returned for rework', goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id/manager-comment
router.put('/:id/manager-comment', protect, authorizeRoles('manager'), async (req, res) => {
  const { quarter, comment } = req.body;
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    const update = goal.quarterlyUpdates.find((q) => q.quarter === quarter);
    if (!update) return res.status(404).json({ message: 'Quarter update not found' });
    update.managerComment = comment;
    await goal.save();
    res.json({ message: 'Comment added', goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/goals/all
router.get('/all', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const goals = await Goal.find()
      .populate('employee', 'name email department')
      .populate('manager', 'name email');
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/goals/:id/unlock
router.put('/:id/unlock', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    goal.isLocked = false;
    goal.status = 'draft';
    await goal.save();
    await AuditLog.create({
      action: 'GOAL_UNLOCKED',
      performedBy: req.user._id,
      targetGoal: goal._id,
      targetUser: goal.employee,
      details: `Goal "${goal.title}" unlocked by admin`,
    });
    res.json({ message: 'Goal unlocked', goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;