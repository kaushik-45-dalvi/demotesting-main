import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { Users, UserPlus, QrCode, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/auth';

const ManageEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volunteerEmail, setVolunteerEmail] = useState('');
  const [volunteerRole, setVolunteerRole] = useState('');
  const [volunteerResp, setVolunteerResp] = useState('');
  const currentUser = getUser();

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      const [eventRes, regRes, volRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/registrations/event/${id}`),
        api.get(`/volunteers/event/${id}`)
      ]);
      
      setEvent(eventRes.data);
      setRegistrations(regRes.data);
      setVolunteers(volRes.data);
    } catch (error) {
      toast.error('Failed to load event data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/volunteers', {
        event_id: id,
        user_email: volunteerEmail,
        role: volunteerRole,
        responsibilities: volunteerResp
      });
      
      toast.success('Volunteer added successfully');
      setVolunteerEmail('');
      setVolunteerRole('');
      setVolunteerResp('');
      fetchEventData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add volunteer');
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 mb-4 font-bold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-5xl mb-2" data-testid="manage-event-heading">
                {event.title}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Manage registrations and volunteers
              </p>
            </div>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 bg-red-500 text-white font-bold border-2 border-black shadow-button hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              data-testid="delete-event-button"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete Event
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-brutalist" data-testid="registrations-count-card">
            <Users className="w-10 h-10 mb-4 text-primary" />
            <h3 className="font-heading font-bold text-3xl">{registrations.length}</h3>
            <p className="text-sm text-muted-foreground mt-2">Total Registrations</p>
          </div>

          <div className="card-brutalist">
            <QrCode className="w-10 h-10 mb-4 text-secondary" />
            <h3 className="font-heading font-bold text-3xl">
              {registrations.filter(r => r.attendance_status === 'attended').length}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">Attended</p>
          </div>

          <div className="card-brutalist">
            <UserPlus className="w-10 h-10 mb-4 text-accent" />
            <h3 className="font-heading font-bold text-3xl">{volunteers.length}</h3>
            <p className="text-sm text-muted-foreground mt-2">Volunteers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registrations */}
          <div className="card-brutalist">
            <h2 className="font-heading font-bold text-2xl mb-6">Registrations</h2>
            
            {registrations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No registrations yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {registrations.map((reg) => (
                  <div key={reg.id} className="border-2 border-black p-4" data-testid={`registration-item-${reg.id}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{reg.user_name}</p>
                        <p className="text-sm text-muted-foreground">{reg.user_email}</p>
                      </div>
                      <div className={`px-2 py-1 border-2 border-black text-xs font-bold ${
                        reg.attendance_status === 'attended'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted'
                      }`}>
                        {reg.attendance_status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Volunteers */}
          <div className="card-brutalist">
            <h2 className="font-heading font-bold text-2xl mb-6">Volunteers</h2>
            
            {/* Add Volunteer Form */}
            <form onSubmit={handleAddVolunteer} className="space-y-3 mb-6 p-4 border-2 border-black bg-muted">
              <h3 className="font-bold text-sm">Add Volunteer</h3>
              <input
                type="email"
                value={volunteerEmail}
                onChange={(e) => setVolunteerEmail(e.target.value)}
                placeholder="Email"
                className="input-brutalist w-full h-10 text-sm"
                required
                data-testid="volunteer-email-input"
              />
              <input
                type="text"
                value={volunteerRole}
                onChange={(e) => setVolunteerRole(e.target.value)}
                placeholder="Role (e.g., Registration Desk)"
                className="input-brutalist w-full h-10 text-sm"
                required
                data-testid="volunteer-role-input"
              />
              <textarea
                value={volunteerResp}
                onChange={(e) => setVolunteerResp(e.target.value)}
                placeholder="Responsibilities"
                className="input-brutalist w-full text-sm"
                rows="2"
                required
                data-testid="volunteer-responsibilities-input"
              />
              <button type="submit" className="btn-secondary w-full text-sm" data-testid="add-volunteer-button">
                <UserPlus className="w-4 h-4 inline mr-2" />
                Add Volunteer
              </button>
            </form>

            {/* Volunteers List */}
            {volunteers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No volunteers yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {volunteers.map((vol) => (
                  <div key={vol.id} className="border-2 border-black p-4" data-testid={`volunteer-item-${vol.id}`}>
                    <p className="font-bold">{vol.user_name}</p>
                    <p className="text-sm text-muted-foreground">{vol.user_email}</p>
                    <div className="mt-2">
                      <span className="inline-flex px-2 py-1 border-2 border-black bg-secondary text-secondary-foreground text-xs font-bold">
                        {vol.role}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{vol.responsibilities}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEvent;