import { useEffect, useState } from 'react';
import API from '../../api/axios';
import Navbar from '../../components/Navbar';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const STATUS_COLORS = {
  approved: '#22c55e',
  submitted: '#f59e0b',
  draft: '#64748b',
  rework: '#ef4444',
};

const AdminDashboard = () => {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportRows, setReportRows] = useState([]);
  const [reportTitle, setReportTitle] = useState('');

  useEffect(() => {
    fetchAllGoals();
    fetchUsers();
  }, []);

  const fetchAllGoals = async () => {
    try {
      const { data } = await API.get('/goals/all');

      setGoals(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to fetch goals'
      );
    } finally {
      setLoading(false);
    }
  };

  const unlockGoal = async (id) => {
    try {
      const { data } = await API.put(
        `/goals/${id}/unlock`
      );

      setSuccess(data.message);

      fetchAllGoals();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unlock failed'
      );
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    }
  };

  const fetchReport = async (type) => {
    const config = {
      achievement: {
        title: 'Achievement Report',
        url: '/admin/reports/achievement',
      },
      completion: {
        title: 'Completion Dashboard',
        url: '/admin/reports/completion-dashboard',
      },
      managers: {
        title: 'Manager Effectiveness Report',
        url: '/admin/reports/managers',
      },
    };

    try {
      const { data } = await API.get(config[type].url);
      setReportRows(data);
      setReportTitle(config[type].title);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report');
    }
  };

  const exportReportCsv = () => {
    if (reportRows.length === 0) return;

    const headers = Object.keys(reportRows[0]);
    const csvRows = [
      headers.join(','),
      ...reportRows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? '';
            return `"${String(value).replaceAll('"', '""')}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle || 'atomquest-report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const assignManager = async (employeeId, managerId) => {
    if (!managerId) return;

    try {
      const { data } = await API.put('/admin/assign-manager', {
        employeeId,
        managerId,
      });

      setSuccess(data.message);
      setError('');
      fetchUsers();
      fetchAllGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign manager');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#22c55e';

      case 'submitted':
        return '#f59e0b';

      case 'rework':
        return '#ef4444';

      default:
        return '#6b7280';
    }
  };

  const totalGoals = goals.length;

  const approvedGoals = goals.filter(
    (g) => g.status === 'approved'
  ).length;

  const submittedGoals = goals.filter(
    (g) => g.status === 'submitted'
  ).length;

  const draftGoals = goals.filter(
    (g) => g.status === 'draft'
  ).length;

  const statusChartData = ['approved', 'submitted', 'draft', 'rework'].map(
    (status) => ({
      name: status,
      value: goals.filter((goal) => goal.status === status).length,
    })
  );

  const departmentChartData = Object.values(
    goals.reduce((acc, goal) => {
      const department = goal.employee?.department || 'Unassigned';
      acc[department] = acc[department] || { department, goals: 0 };
      acc[department].goals += 1;
      return acc;
    }, {})
  );

  if (loading) {
    return <h2 style={{ padding: '30px', color: '#111827' }}>Loading...</h2>;
  }

  return (
    <div style={{ background: '#eef2f7', minHeight: '100vh' }}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1>Admin Dashboard</h1>

            <p style={styles.headerText}>
              Organization Goal Management Portal
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h2>{totalGoals}</h2>
            <p>Total Goals</p>
          </div>

          <div style={styles.statCard}>
            <h2>{approvedGoals}</h2>
            <p>Approved</p>
          </div>

          <div style={styles.statCard}>
            <h2>{submittedGoals}</h2>
            <p>Submitted</p>
          </div>

          <div style={styles.statCard}>
            <h2>{draftGoals}</h2>
            <p>Drafts</p>
          </div>
        </div>

        <div style={styles.chartGrid}>
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h2>Goal Status Mix</h2>
              <p>Current distribution across the organization</p>
            </div>

            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={styles.legend}>
              {statusChartData.map((entry) => (
                <span key={entry.name} style={styles.legendItem}>
                  <span
                    style={{
                      ...styles.legendDot,
                      background: STATUS_COLORS[entry.name],
                    }}
                  />
                  {entry.name}: {entry.value}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h2>Goals by Department</h2>
              <p>Goal volume by employee department</p>
            </div>

            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentChartData}>
                  <XAxis dataKey="department" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="goals" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={styles.reportPanel}>
          <div style={styles.reportHeader}>
            <div>
              <h2>Reports</h2>
              <p>View and export organization performance data</p>
            </div>

            {reportRows.length > 0 && (
              <button style={styles.exportBtn} onClick={exportReportCsv}>
                Export CSV
              </button>
            )}
          </div>

          <div style={styles.reportActions}>
            <button
              style={styles.reportBtn}
              onClick={() => fetchReport('achievement')}
            >
              Achievement
            </button>
            <button
              style={styles.reportBtn}
              onClick={() => fetchReport('completion')}
            >
              Completion
            </button>
            <button
              style={styles.reportBtn}
              onClick={() => fetchReport('managers')}
            >
              Managers
            </button>
          </div>

          {reportRows.length > 0 && (
            <div style={styles.tableWrap}>
              <h3>{reportTitle}</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {Object.keys(reportRows[0]).map((header) => (
                      <th key={header} style={styles.th}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(reportRows[0]).map((header) => (
                        <td key={header} style={styles.td}>
                          {String(row[header] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.userPanel}>
          <div style={styles.reportHeader}>
            <div>
              <h2>User Management</h2>
              <p>Review users and assign managers to employees</p>
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Manager</th>
                  <th style={styles.th}>Assign Manager</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td style={styles.td}>{user.name}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.role}</td>
                    <td style={styles.td}>{user.department}</td>
                    <td style={styles.td}>{user.manager?.name || '-'}</td>
                    <td style={styles.td}>
                      {user.role === 'employee' ? (
                        <select
                          style={styles.select}
                          value={user.manager?._id || ''}
                          onChange={(e) =>
                            assignManager(user._id, e.target.value)
                          }
                        >
                          <option value="">Select manager</option>
                          {users
                            .filter((candidate) => candidate.role === 'manager')
                            .map((manager) => (
                              <option key={manager._id} value={manager._id}>
                                {manager.name}
                              </option>
                            ))}
                        </select>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <div style={styles.emptyBox}>
            No goals found
          </div>
        ) : (
          <div style={styles.goalGrid}>
            {goals.map((goal) => (
              <div key={goal._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3>{goal.title}</h3>

                    <p style={styles.employeeName}>
                      {goal.employee?.name}
                    </p>

                    <p style={styles.employeeDept}>
                      {goal.employee?.department}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor:
                        getStatusColor(goal.status),
                    }}
                  >
                    {goal.status.toUpperCase()}
                  </span>
                </div>

                <div style={styles.goalInfo}>
                  <p>
                    <strong>Thrust Area:</strong>{' '}
                    {goal.thrustArea}
                  </p>

                  <p>
                    <strong>Target:</strong>{' '}
                    {goal.target}
                  </p>

                  <p>
                    <strong>Weightage:</strong>{' '}
                    {goal.weightage}%
                  </p>

                  <p>
                    <strong>UOM:</strong>{' '}
                    {goal.uom}
                  </p>

                  <p>
                    <strong>Locked:</strong>{' '}
                    {goal.isLocked ? 'Yes' : 'No'}
                  </p>
                </div>

                {goal.isLocked && (
                  <button
                    style={styles.unlockBtn}
                    onClick={() =>
                      unlockGoal(goal._id)
                    }
                  >
                    Unlock Goal
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '34px',
  },

  header: {
    marginBottom: '28px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
  },

  headerText: {
    color: '#64748b',
    marginBottom: 0,
    fontWeight: '500',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },

  statCard: {
    background: '#fff',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
    color: '#111827',
  },

  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },

  chartCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
    color: '#111827',
  },

  chartHeader: {
    marginBottom: '10px',
  },

  chartBox: {
    width: '100%',
    height: '240px',
  },

  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '8px',
    color: '#475569',
    fontSize: '13px',
  },

  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },

  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
  },

  reportPanel: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
    color: '#111827',
  },

  userPanel: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
    color: '#111827',
  },

  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '16px',
  },

  reportActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '18px',
  },

  reportBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  exportBtn: {
    background: '#111827',
    color: '#fff',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  tableWrap: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },

  th: {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    padding: '10px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    color: '#334155',
  },

  td: {
    border: '1px solid #e5e7eb',
    padding: '10px',
    whiteSpace: 'nowrap',
    color: '#334155',
  },

  select: {
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '8px',
    minWidth: '180px',
    color: '#111827',
    background: '#ffffff',
  },

  goalGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },

  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '22px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },

  employeeName: {
    color: '#2563eb',
    fontWeight: '600',
  },

  employeeDept: {
    fontSize: '13px',
    color: '#6b7280',
  },

  statusBadge: {
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    height: 'fit-content',
  },

  goalInfo: {
    lineHeight: '1.8',
    fontSize: '14px',
    color: '#374151',
  },

  unlockBtn: {
    marginTop: '20px',
    width: '100%',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  errorBox: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
  },

  successBox: {
    background: '#dcfce7',
    color: '#166534',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
  },

  emptyBox: {
    background: '#fff',
    padding: '40px',
    textAlign: 'center',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    color: '#6b7280',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
  },
};

export default AdminDashboard;
