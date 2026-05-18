import { useEffect, useState } from 'react';
import API from '../../api/axios';
import Navbar from '../../components/Navbar';

const ManagerDashboard = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [commentForms, setCommentForms] = useState({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data } = await API.get('/goals/team');

      setGoals(data);
    } catch (err) {
      setError('Failed to fetch team goals');
    } finally {
      setLoading(false);
    }
  };

  const approveGoal = async (id) => {
    try {
      const { data } = await API.put(`/goals/${id}/approve`);

      setSuccess(data.message);

      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    }
  };

  const returnForRework = async (id) => {
    try {
      const { data } = await API.put(`/goals/${id}/rework`);

      setSuccess(data.message);

      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Rework failed');
    }
  };

  const handleCommentChange = (goalId, quarter, comment) => {
    setCommentForms((prev) => ({
      ...prev,
      [`${goalId}-${quarter}`]: comment,
    }));
  };

  const saveManagerComment = async (goalId, quarter) => {
    const comment = commentForms[`${goalId}-${quarter}`];

    if (!comment) {
      return setError('Please enter a comment before saving');
    }

    try {
      const { data } = await API.put(`/goals/${goalId}/manager-comment`, {
        quarter,
        comment,
      });

      setSuccess(data.message);
      setError('');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
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

  if (loading) {
    return <h2 style={{ padding: '30px', color: '#111827' }}>Loading...</h2>;
  }

  return (
    <div style={{ background: '#eef2f7', minHeight: '100vh' }}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Manager Dashboard</h1>

          <p style={styles.headerText}>Review and approve employee goals</p>
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

        {goals.length === 0 ? (
          <div style={styles.emptyBox}>
            No employee goals submitted yet
          </div>
        ) : (
          <div style={styles.goalGrid}>
            {goals.map((goal) => (
              <div key={goal._id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <h3 style={styles.goalTitle}>
                      {goal.title}
                    </h3>

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
                      backgroundColor: getStatusColor(goal.status),
                    }}
                  >
                    {goal.status.toUpperCase()}
                  </span>
                </div>

                <div style={styles.info}>
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

                  {goal.description && (
                    <p>
                      <strong>Description:</strong>{' '}
                      {goal.description}
                    </p>
                  )}
                </div>

                {goal.quarterlyUpdates?.length > 0 && (
                  <div style={styles.checkinBox}>
                    <h4>Quarterly Check-ins</h4>

                    {goal.quarterlyUpdates.map((update) => (
                      <div key={update.quarter} style={styles.updateRow}>
                        <p>
                          <strong>{update.quarter}</strong> - {update.progressScore}%
                        </p>
                        <p>Status: {update.progressStatus}</p>
                        <p>Achievement: {update.achievement}</p>
                        {update.managerComment && (
                          <p>Manager Comment: {update.managerComment}</p>
                        )}

                        <textarea
                          style={styles.commentInput}
                          placeholder={`Comment for ${update.quarter}`}
                          value={
                            commentForms[`${goal._id}-${update.quarter}`] ||
                            update.managerComment ||
                            ''
                          }
                          onChange={(e) =>
                            handleCommentChange(
                              goal._id,
                              update.quarter,
                              e.target.value
                            )
                          }
                        />

                        <button
                          style={styles.commentBtn}
                          onClick={() =>
                            saveManagerComment(goal._id, update.quarter)
                          }
                        >
                          Save Comment
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!goal.isLocked &&
                  goal.status === 'submitted' && (
                    <div style={styles.actions}>
                      <button
                        style={styles.approveBtn}
                        onClick={() =>
                          approveGoal(goal._id)
                        }
                      >
                        Approve
                      </button>

                      <button
                        style={styles.reworkBtn}
                        onClick={() =>
                          returnForRework(goal._id)
                        }
                      >
                        Return Rework
                      </button>
                    </div>
                  )}

                {goal.isLocked && (
                  <div style={styles.lockedBox}>
                    Goal locked after approval
                  </div>
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
    padding: '34px',
    maxWidth: '1300px',
    margin: '0 auto',
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

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },

  goalTitle: {
    marginBottom: '5px',
    color: '#111827',
  },

  employeeName: {
    fontWeight: '600',
    color: '#2563eb',
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

  info: {
    lineHeight: '1.8',
    fontSize: '14px',
    color: '#374151',
  },

  checkinBox: {
    background: '#f8fafc',
    border: '1px solid #dbe3ef',
    borderRadius: '8px',
    padding: '14px',
    marginTop: '14px',
    color: '#334155',
  },

  updateRow: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '10px',
    marginTop: '10px',
    fontSize: '13px',
  },

  commentInput: {
    width: '100%',
    minHeight: '70px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '8px',
    boxSizing: 'border-box',
    marginTop: '8px',
    background: '#ffffff',
    color: '#111827',
  },

  commentBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    marginTop: '8px',
  },

  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },

  approveBtn: {
    background: '#22c55e',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  reworkBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  lockedBox: {
    marginTop: '20px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '10px',
    borderRadius: '6px',
    textAlign: 'center',
    color: '#475569',
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

export default ManagerDashboard;
