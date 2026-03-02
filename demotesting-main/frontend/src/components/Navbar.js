import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout } from '../utils/auth';
import { LogOut, Calendar, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-card border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="w-8 h-8" />
            <span className="font-heading font-bold text-2xl">EVENTFLOW</span>
          </Link>

          {user && (
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 hover:bg-muted transition-colors"
                data-testid="navbar-dashboard-link"
              >
                <User className="w-5 h-5" />
                <span className="font-bold">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-black shadow-button hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                data-testid="navbar-logout-button"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-bold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;