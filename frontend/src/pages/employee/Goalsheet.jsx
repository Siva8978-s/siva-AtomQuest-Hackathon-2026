import { useEffect, useState } from 'react';
import API from '../../api/axios';

const GoalSheet = () => {
  const [goals, setGoals] = useState([]);

  const [formData, setFormData] = useState({
    thrustArea: '',
    title: '',
    description: '',
    uom: 'numeric_min',
    target: '',
    weightage: '',
  });

  const fetchGoals = async () => {
    try {
      const { data } = await API.get('/goals/my');
      setGoals(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const totalWeightage = goals.reduce(
    (sum, goal) => sum + goal.weightage,
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post('/goals', {
        ...formData,
        weightage: Number(formData.weightage),
      });

      alert('Goal Created');

      setFormData({
        thrustArea: '',
        title: '',
        description: '',
        uom: 'numeric_min',
        target: '',
        weightage: '',
      });

      fetchGoals();
    } catch (error) {
      alert(error.response?.data?.message || 'Error');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await API.delete(`/goals/${id}`);
      fetchGoals();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  const submitGoals = async () => {
    try {
      const { data } = await API.post('/goals/submit');

      alert(data.message);

      fetchGoals();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Goal Sheet</h1>

      <h3>Total Weightage: {totalWeightage}%</h3>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
        }}
      >
        <input
          type="text"
          name="thrustArea"
          placeholder="Thrust Area"
          value={formData.thrustArea}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          type="text"
          name="title"
          placeholder="Goal Title"
          value={formData.title}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          style={inputStyle}
        />

        <select
          name="uom"
          value={formData.uom}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="numeric_min">Numeric Min</option>
          <option value="numeric_max">Numeric Max</option>
          <option value="timeline">Timeline</option>
          <option value="zero">Zero Based</option>
        </select>

        <input
          type="text"
          name="target"
          placeholder="Target"
          value={formData.target}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <input
          type="number"
          name="weightage"
          placeholder="Weightage"
          value={formData.weightage}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Add Goal
        </button>
      </form>

      <button onClick={submitGoals} style={submitButton}>
        Submit Goals
      </button>

      <div style={{ marginTop: '30px' }}>
        {goals.map((goal) => (
          <div
            key={goal._id}
            style={{
              background: '#fff',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '10px',
            }}
          >
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

            {!goal.isLocked && (
              <button
                onClick={() => deleteGoal(goal._id)}
                style={{
                  background: 'red',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 15px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '15px',
};

const buttonStyle = {
  padding: '10px 20px',
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
};

const submitButton = {
  padding: '12px 20px',
  background: 'green',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
};

export default GoalSheet;