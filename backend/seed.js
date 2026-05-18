const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Goal = require('./models/Goal');

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    await User.deleteMany({
      email: {
        $in: [
          'admin@atomquest.com',
          'manager@atomquest.com',
          'employee@atomquest.com',
        ],
      },
    });
    await Goal.deleteMany({});

    const admin = await User.create({
      name: 'AtomQuest Admin',
      email: 'admin@atomquest.com',
      password: '123456',
      role: 'admin',
      department: 'HR',
    });

    const manager = await User.create({
      name: 'AtomQuest Manager',
      email: 'manager@atomquest.com',
      password: '123456',
      role: 'manager',
      department: 'Technology',
    });

    const employee = await User.create({
      name: 'AtomQuest Employee',
      email: 'employee@atomquest.com',
      password: '123456',
      role: 'employee',
      department: 'Technology',
      manager: manager._id,
    });

    const secondEmployee = await User.create({
      name: 'Priya Sharma',
      email: 'priya@atomquest.com',
      password: '123456',
      role: 'employee',
      department: 'Operations',
      manager: manager._id,
    });

    await Goal.create([
      {
        employee: employee._id,
        manager: manager._id,
        thrustArea: 'Revenue Growth',
        title: 'Increase enterprise pipeline',
        description: 'Build qualified pipeline through demos and partner leads.',
        uom: 'numeric_min',
        target: '1000',
        weightage: 40,
        status: 'approved',
        isLocked: true,
        quarterlyUpdates: [
          {
            quarter: 'Q1',
            achievement: '320',
            progressStatus: 'on_track',
            progressScore: 32,
            managerComment: 'Good start. Focus on higher-value accounts next quarter.',
          },
        ],
      },
      {
        employee: employee._id,
        manager: manager._id,
        thrustArea: 'Customer Satisfaction',
        title: 'Improve customer response quality',
        description: 'Reduce support escalations and keep CSAT above target.',
        uom: 'numeric_min',
        target: '90',
        weightage: 30,
        status: 'approved',
        isLocked: true,
        quarterlyUpdates: [
          {
            quarter: 'Q1',
            achievement: '88',
            progressStatus: 'on_track',
            progressScore: 97.8,
            managerComment: 'Very close to target. Keep tracking weekly dips.',
          },
        ],
      },
      {
        employee: employee._id,
        manager: manager._id,
        thrustArea: 'Digital Transformation',
        title: 'Automate weekly KPI reporting',
        description: 'Replace manual reporting with a dashboard-driven workflow.',
        uom: 'timeline',
        target: '2026-09-30',
        weightage: 30,
        status: 'submitted',
        isLocked: false,
      },
      {
        employee: secondEmployee._id,
        manager: manager._id,
        thrustArea: 'Cost Optimization',
        title: 'Reduce process rework hours',
        description: 'Identify repeated manual steps and eliminate avoidable rework.',
        uom: 'numeric_max',
        target: '50',
        weightage: 50,
        status: 'approved',
        isLocked: true,
        quarterlyUpdates: [
          {
            quarter: 'Q1',
            achievement: '60',
            progressStatus: 'on_track',
            progressScore: 83.3,
            managerComment: 'Moving in the right direction. Document root causes.',
          },
        ],
      },
      {
        employee: secondEmployee._id,
        manager: manager._id,
        thrustArea: 'Compliance & Safety',
        title: 'Maintain zero critical audit findings',
        description: 'Keep critical compliance misses at zero for the year.',
        uom: 'zero',
        target: '0',
        weightage: 50,
        status: 'draft',
        isLocked: false,
      },
    ]);

    console.log('Demo users seeded successfully');
    console.table([
      { role: admin.role, email: admin.email, password: '123456' },
      { role: manager.role, email: manager.email, password: '123456' },
      { role: employee.role, email: employee.email, password: '123456' },
      { role: secondEmployee.role, email: secondEmployee.email, password: '123456' },
    ]);
    console.log('Sample goals and quarterly check-ins seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
