import { useState, useEffect } from 'react';
import { getUser } from '../utils/auth';
import Navbar from '../components/Navbar';
import ChatBot from '../components/ChatBot';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import CoordinatorDashboard from '../components/dashboards/CoordinatorDashboard';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="py-8">
        {user.role === 'student' && <StudentDashboard />}
        {(user.role === 'coordinator' || user.role === 'admin') && <CoordinatorDashboard />}
      </div>
      <ChatBot />
    </div>
  );
};

export default Dashboard;