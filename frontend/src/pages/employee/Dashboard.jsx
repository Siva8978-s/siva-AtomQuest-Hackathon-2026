import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import Navbar from '../../components/Navbar';

const THRUST_AREAS = [
  'Revenue Growth',
  'Cost Optimization',
  'Customer Satisfaction',
  'Process Improvement',
  'People Development',
  'Innovation',
  'Compliance & Safety',
  'Digital Transformation',
];

const UOM_OPTIONS = [
  { value: 'numeric_min', label: 'Numeric (Higher is Better)' },
  { value: 'numeric_max', label: 'Numeric (Lower is Better)' },
  { value: 'timeline', label: 'Timeline (Date-based)' },
  { value: 'zero', label: 'Zero-based (0 = Success)' },
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

const emptyForm = {
  thrustArea: '',
  title: '',
  description: '',
  uom: '',
  target: '',
  weightage: '',
};

const EmployeeDashboard = () => {
  const { user } = useAuth();

  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [checkinForms, setCheckinForms] = useState({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data } = await API.get('/goals/my');
      setGoals(data);
    } catch (err) {
      setError('Failed to fetch goals');
    }
  };

  const totalWeightage = goals.reduce(
    (sum, goal) => sum + goal.weightage,
    0
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (parseInt(form.weightage) < 10) {
      return setError('Minimum weightage is 10%');
    }

    setLoading(true);

    try {
      if (editingId) {
        await API.put(`/goals/${editingId}`, {
          ...form,
          weightage: Number(form.weightage),
        });

        setSuccess('Goal updated successfully');
      } else {
        await API.post('/goals', {
          ...form,
          weightage: Number(form.weightage),
        });

        setSuccess('Goal created successfully');
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal) => {
    setForm({
      thrustArea: goal.thrustArea,
      title: goal.title,
      description: goal.description,
      uom: goal.uom,
      target: goal.target,
      weightage: goal.weightage,
    });

    setEditingId(goal._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this goal?'
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/goals/${id}`);

      setSuccess('Goal deleted successfully');

      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSubmitGoals = async () => {
    if (totalWeightage !== 100) {
      return setError(
        `Total weightage must equal 100%. Current: ${totalWeightage}%`
      );
    }

    try {
      const { data } = await API.post('/goals/submit');

      setSuccess(data.message);

      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    }
  };

  const getCheckinForm = (goal) => {
    return checkinForms[goal._id] || {
      quarter: 'Q1',
      achievement: '',
      progressStatus: 'on_track',
    };
  };

  const handleCheckinChange = (goalId, field, value) => {
    setCheckinForms((prev) => ({
      ...prev,
      [goalId]: {
        ...(prev[goalId] || {
          quarter: 'Q1',
          achievement: '',
          progressStatus: 'on_track',
        }),
        [field]: value,
      },
    }));
  };

  const handleSubmitCheckin = async (goal) => {
    const checkin = getCheckinForm(goal);

    if (!checkin.achievement) {
      return setError('Please enter achievement before saving check-in');
    }

    try {
      await API.put(`/goals/${goal._id}/checkin`, checkin);
      setSuccess(`${checkin.quarter} check-in saved successfully`);
      setError('');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    }
  };

  return (
    <div style={{ background: '#eef2f7', minHeight: '100vh' }}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1>Employee Dashboard</h1>

            <p style={styles.headerText}>
              Welcome, {user?.name} ({user?.department})
            </p>
          </div>

          <div>
            <h2 style={styles.weightageText}>Total Weightage: {totalWeightage}%</h2>

            <button
              style={styles.addBtn}
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              + Add Goal
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {success && <div style={styles.success}>{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmitForm} style={styles.form}>
            <input
              type="text"
              name="title"
              placeholder="Goal Title"
              value={form.title}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <select
              name="thrustArea"
              value={form.thrustArea}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select Thrust Area</option>

              {THRUST_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <textarea
              name="description"
              placeholder="Goal Description"
              value={form.description}
              onChange={handleChange}
              style={styles.input}
            />

            <select
              name="uom"
              value={form.uom}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select UOM</option>

              {UOM_OPTIONS.map((uom) => (
                <option key={uom.value} value={uom.value}>
                  {uom.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="target"
              placeholder="Target"
              value={form.target}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="number"
              name="weightage"
              placeholder="Weightage"
              value={form.weightage}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={styles.saveBtn}>
                {loading
                  ? 'Saving...'
                  : editingId
                  ? 'Update Goal'
                  : 'Save Goal'}
              </button>

              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div style={styles.goalGrid}>
          {goals.map((goal) => (
            <div key={goal._id} style={styles.card}>
              <h3>{goal.title}</h3>

              <p>
                <strong>Thrust Area:</strong> {goal.thrustArea}
              </p>

              <p>
                <strong>Target:</strong> {goal.target}
              </p>

              <p>
                <strong>Weightage:</strong> {goal.weightage}%
              </p>

              <p>
                <strong>Status:</strong> {goal.status}
              </p>

              {goal.quarterlyUpdates &&
                goal.quarterlyUpdates.length > 0 && (
                  <div>
                    <h4>Quarterly Updates</h4>

                    {goal.quarterlyUpdates.map((q) => (
                      <div key={q.quarter} style={styles.updateRow}>
                        <p>
                          <strong>{q.quarter}</strong> - {q.progressScore}%
                        </p>
                        <p>Status: {q.progressStatus}</p>
                        <p>Achievement: {q.achievement}</p>
                        {q.managerComment && (
                          <p>Manager Comment: {q.managerComment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {goal.status === 'approved' && (
                <div style={styles.checkinBox}>
                  <h4>Quarterly Check-in</h4>

                  <select
                    style={styles.input}
                    value={getCheckinForm(goal).quarter}
                    onChange={(e) =>
                      handleCheckinChange(goal._id, 'quarter', e.target.value)
                    }
                  >
                    {QUARTERS.map((quarter) => (
                      <option key={quarter} value={quarter}>
                        {quarter}
                      </option>
                    ))}
                  </select>

                  <input
                    style={styles.input}
                    type={goal.uom === 'timeline' ? 'date' : 'text'}
                    placeholder="Achievement"
                    value={getCheckinForm(goal).achievement}
                    onChange={(e) =>
                      handleCheckinChange(goal._id, 'achievement', e.target.value)
                    }
                  />

                  <select
                    style={styles.input}
                    value={getCheckinForm(goal).progressStatus}
                    onChange={(e) =>
                      handleCheckinChange(goal._id, 'progressStatus', e.target.value)
                    }
                  >
                    <option value="not_started">Not Started</option>
                    <option value="on_track">On Track</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button
                    style={styles.checkinBtn}
                    onClick={() => handleSubmitCheckin(goal)}
                  >
                    Save Check-in
                  </button>
                </div>
              )}

              {!goal.isLocked && (
                <div style={styles.cardActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => handleEdit(goal)}
                  >
                    Edit
                  </button>

                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(goal._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {goals.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <button
              style={styles.submitBtn}
              onClick={handleSubmitGoals}
            >
              Submit Goals
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '34px',
    maxWidth: '1240px',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    marginBottom: '28px',
    alignItems: 'center',
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

  weightageText: {
    color: '#111827',
    fontSize: '20px',
  },

  addBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: '700',
  },

  form: {
    background: '#fff',
    padding: '22px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginBottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
  },

  input: {
    padding: '11px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    color: '#111827',
    background: '#ffffff',
  },

  saveBtn: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: '700',
  },

  cancelBtn: {
    background: '#6b7280',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: '700',
  },

  goalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },

  card: {
    background: '#fff',
    padding: '22px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
    color: '#1f2937',
  },

  updateRow: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#334155',
  },

  checkinBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '14px',
    marginTop: '14px',
    color: '#1e3a8a',
  },

  checkinBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '10px 14px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: '600',
  },

  cardActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '14px',
    flexWrap: 'wrap',
  },

  editBtn: {
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    marginRight: '10px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontWeight: '700',
  },

  deleteBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    cursor: 'pointer',
    borderRadius: '5px',
    fontWeight: '700',
  },

  submitBtn: {
    background: '#111827',
    color: '#fff',
    border: 'none',
    padding: '12px 22px',
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: '800',
  },

  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '20px',
  },

  success: {
    background: '#dcfce7',
    color: '#166534',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '20px',
  },
};

export default EmployeeDashboard;
