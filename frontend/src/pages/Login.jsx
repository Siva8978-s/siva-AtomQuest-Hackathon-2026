import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);

      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/employee');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@atomquest.com');
      setPassword('123456');
    }

    if (role === 'manager') {
      setEmail('manager@atomquest.com');
      setPassword('123456');
    }

    if (role === 'employee') {
      setEmail('employee@atomquest.com');
      setPassword('123456');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>AtomQuest</h1>
        <h2 style={styles.title}>Goal Setting Portal</h2>
        <p style={styles.subtitle}>Sign in to continue</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.demoSection}>
          <p style={styles.demoTitle}>Quick Demo Login:</p>
          <div style={styles.demoButtons}>
            <button style={styles.demoBtn} onClick={() => fillDemo('admin')}>
              Admin
            </button>
            <button style={styles.demoBtn} onClick={() => fillDemo('manager')}>
              Manager
            </button>
            <button style={styles.demoBtn} onClick={() => fillDemo('employee')}>
              Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    textAlign: 'center',
    color: '#e94560',
    fontSize: '28px',
    marginBottom: '4px',
  },
  title: {
    textAlign: 'center',
    color: '#1a1a2e',
    fontSize: '18px',
    marginBottom: '4px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#888',
    fontSize: '13px',
    marginBottom: '24px',
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#d00',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    textAlign: 'center',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  demoSection: {
    marginTop: '24px',
    borderTop: '1px solid #eee',
    paddingTop: '16px',
  },
  demoTitle: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#888',
    marginBottom: '10px',
  },
  demoButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  demoBtn: {
    padding: '6px 16px',
    border: '1px solid #0f3460',
    backgroundColor: 'transparent',
    color: '#0f3460',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
};

export default Login;
