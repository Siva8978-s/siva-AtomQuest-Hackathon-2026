import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'manager') return '/manager';
    return '/employee';
  };

  return (
    <nav style={styles.nav}>
      <div
        style={styles.logo}
        onClick={() => navigate(getDashboardLink())}
      >
        AtomQuest Portal
      </div>

      <div style={styles.right}>
        <span style={styles.userInfo}>
          {user?.name} &nbsp;

          <span style={styles.role}>
            {user?.role?.toUpperCase()}
          </span>
        </span>

        <button
          style={styles.logoutBtn}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: '14px 32px',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 10px 30px rgba(15,23,42,0.18)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },

  logo: {
    fontSize: '21px',
    fontWeight: '800',
    color: '#f43f5e',
    cursor: 'pointer',
    letterSpacing: '0',
  },

  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  userInfo: {
    fontSize: '14px',
    color: '#e5e7eb',
    fontWeight: '600',
  },

  role: {
    backgroundColor: '#f43f5e',
    color: 'white',
    padding: '4px 9px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '800',
  },

  logoutBtn: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    border: '1px solid #f43f5e',
    color: '#fb7185',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
  },
};

export default Navbar;
