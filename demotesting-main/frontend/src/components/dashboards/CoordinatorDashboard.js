import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Calendar, Users, TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import CreateEventModal from '../CreateEventModal';

const CoordinatorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/coordinator');
      setStats(response.data);
      setEvents(response.data.events);
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = () => {
    setShowCreateModal(false);
    fetchStats();
    toast.success('Event created successfully!');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center py-12 font-bold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-5xl mb-2" data-testid="coordinator-dashboard-heading">
            Coordinator Dashboard
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Manage your events and track performance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          data-testid="create-event-button"
        >
          <Plus className="w-5 h-5 mr-2 inline" />
          Create Event
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-brutalist" data-testid="total-events-card">
          <Calendar className="w-12 h-12 mb-4 text-primary" />
          <h3 className="font-heading font-bold text-3xl">{stats?.total_events || 0}</h3>
          <p className="text-sm text-muted-foreground mt-2">Total Events</p>
        </div>

        <div className="card-brutalist" data-testid="total-registrations-card">
          <Users className="w-12 h-12 mb-4 text-secondary" />
          <h3 className="font-heading font-bold text-3xl">{stats?.total_registrations || 0}</h3>
          <p className="text-sm text-muted-foreground mt-2">Total Registrations</p>
        </div>

        <div className="card-brutalist" data-testid="total-attendance-card">
          <TrendingUp className="w-12 h-12 mb-4 text-accent" />
          <h3 className="font-heading font-bold text-3xl">{stats?.total_attendance || 0}</h3>
          <p className="text-sm text-muted-foreground mt-2">Total Attendance</p>
        </div>
      </div>

      {/* Events List */}
      <div className="card-brutalist">
        <h2 className="font-heading font-bold text-2xl mb-6">My Events</h2>

        {events.length === 0 ? (
          <div className="text-center py-12" data-testid="no-events-message">
            <p className="text-muted-foreground mb-4">You haven't created any events yet</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus className="w-5 h-5 mr-2 inline" />
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div key={event.id} className="border-2 border-black p-6 hover:shadow-hard transition-all" data-testid={`event-card-${event.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-heading font-bold text-xl">{event.title}</h3>
                  <div className={`inline-flex px-2 py-1 border-2 border-black text-xs font-bold ${
                    event.status === 'upcoming' ? 'bg-secondary text-secondary-foreground' :
                    event.status === 'ongoing' ? 'bg-primary text-primary-foreground' :
                    'bg-muted'
                  }`}>
                    {event.status}
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <p><span className="font-bold">Date:</span> {event.date}</p>
                  <p><span className="font-bold">Time:</span> {event.time}</p>
                  <p><span className="font-bold">Venue:</span> {event.venue}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-bold">{event.registered_count || 0}</span>
                    <span className="text-muted-foreground"> / {event.capacity} registered</span>
                  </div>
                  <Link
                    to={`/events/${event.id}/manage`}
                    className="text-sm font-bold hover:underline"
                    data-testid={`manage-event-link-${event.id}`}
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleEventCreated}
        />
      )}
    </div>
  );
};

export default CoordinatorDashboard;