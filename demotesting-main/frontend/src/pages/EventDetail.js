import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import ChatBot from '../components/ChatBot';
import { Calendar, MapPin, Users, Clock, User as UserIcon, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '../utils/auth';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const user = getUser();

  // 🔹 Fetch Event Details
  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // 🔹 Fetch Feedback
  const fetchFeedback = useCallback(async () => {
    try {
      const response = await api.get(`/feedback/event/${id}`);
      setFeedback(response.data);
    } catch (error) {
      console.error('Failed to load feedback');
    }
  }, [id]);

  // 🔹 Check Registration
  const checkRegistration = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.get('/registrations/my');
      const registered = response.data.some(
        (reg) => String(reg.event_id) === String(id)
      );
      setIsRegistered(registered);
    } catch (error) {
      console.error('Failed to check registration');
    }
  }, [id, user]);

  // 🔹 useEffect (Clean Dependency Handling)
  useEffect(() => {
    fetchEventDetails();
    fetchFeedback();
    checkRegistration();
  }, [fetchEventDetails, fetchFeedback, checkRegistration]);

  // 🔹 Handle Registration
  const handleRegister = async () => {
    if (!user) {
      toast.error('Please login to register');
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      await api.post('/registrations', { event_id: id });
      toast.success('Successfully registered!');
      setIsRegistered(true);
      fetchEventDetails();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  // 🔹 Average Rating
  const calculateAverageRating = () => {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, fb) => acc + fb.rating, 0);
    return (sum / feedback.length).toFixed(1);
  };

  // 🔹 Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">

            {/* Event Image */}
            {event.image_url && (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-96 object-cover border-2 border-black"
              />
            )}

            {/* Event Info Card */}
            <div className="card-brutalist">
              <div className="inline-flex items-center px-2.5 py-0.5 border-2 border-black bg-secondary text-xs font-bold mb-4">
                {event.category}
              </div>

              <h1 className="font-heading font-bold text-3xl md:text-5xl mb-4">
                {event.title}
              </h1>

              <p className="text-base md:text-lg text-muted-foreground mb-6">
                {event.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={<Calendar />} label="Date" value={event.date} />
                <InfoItem icon={<Clock />} label="Time" value={event.time} />
                <InfoItem icon={<MapPin />} label="Venue" value={event.venue} />
                <InfoItem icon={<UserIcon />} label="Coordinator" value={event.coordinator_name} />
              </div>
            </div>

            {/* Feedback Section */}
            <div className="card-brutalist">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-bold text-2xl">Feedback</h2>
                {feedback.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">
                      {calculateAverageRating()} / 5.0
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({feedback.length} reviews)
                    </span>
                  </div>
                )}
              </div>

              {feedback.length === 0 ? (
                <p className="text-muted-foreground">No feedback yet</p>
              ) : (
                <div className="space-y-4">
                  {feedback.map((fb) => (
                    <div key={fb.id} className="border-2 border-black p-4">
                      <div className="flex justify-between mb-2">
                        <p className="font-bold">{fb.user_name}</p>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < fb.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fb.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <div className="card-brutalist">
              <div className="flex items-center gap-2 mb-4">
                <Users />
                <div>
                  <p className="text-2xl font-bold">
                    {event.registered_count} / {event.capacity}
                  </p>
                  <p className="text-sm text-muted-foreground">Registered</p>
                </div>
              </div>

              {user ? (
                isRegistered ? (
                  <div className="bg-secondary border-2 border-black p-4 text-center">
                    <p className="font-bold">✅ You're registered!</p>
                  </div>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={
                      registering ||
                      event.registered_count >= event.capacity
                    }
                    className="btn-primary w-full"
                  >
                    {registering
                      ? 'Registering...'
                      : event.registered_count >= event.capacity
                        ? 'Event Full'
                        : 'Register Now'}
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary w-full"
                >
                  Login to Register
                </button>
              )}
            </div>

            {/* Status */}
            <div className="card-brutalist text-center">
              <p className="text-sm font-bold text-muted-foreground mb-2">
                Status
              </p>
              <div className="inline-flex px-4 py-2 border-2 border-black font-bold bg-secondary">
                {event.status?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatBot />
    </div>
  );
};

// 🔹 Reusable Info Component
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    <div className="w-5 h-5">{icon}</div>
    <div>
      <p className="text-xs font-bold text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  </div>
);

export default EventDetail;