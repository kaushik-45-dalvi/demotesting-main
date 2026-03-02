import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { setToken, setUser } from '../utils/auth';
import { toast } from 'sonner';
import { Mail, Lock, User, Calendar } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (isSignup) {
        // Signup requires all fields
        response = await api.post('/auth/signup', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      } else {
        // Login should only send email + password
        response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
      }

      setToken(response.data.token);
      setUser(response.data.user);

      toast.success(isSignup ? 'Account created successfully!' : 'Welcome back!');
      navigate('/dashboard');

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Calendar className="w-12 h-12" />
            <span className="font-heading font-bold text-4xl">EVENTFLOW</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="card-brutalist" data-testid="login-form">
          <h2 className="font-heading font-bold text-3xl mb-6 text-center">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-bold mb-2">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-brutalist pl-10 w-full"
                    placeholder="Your name"
                    required={isSignup}
                    data-testid="signup-name-input"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-brutalist pl-10 w-full"
                  placeholder="you@example.com"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-brutalist pl-10 w-full"
                  placeholder="••••••••"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-bold mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-brutalist w-full"
                  data-testid="signup-role-select"
                >
                  <option value="student">Student</option>
                  <option value="coordinator">Coordinator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              data-testid="login-submit-button"
            >
              {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm font-bold hover:underline"
              data-testid="toggle-auth-mode-button"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm font-bold hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;