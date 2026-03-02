import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Calendar, QrCode, Star, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import FeedbackModal from '../FeedbackModal';

const StudentDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/registrations/my');
      setRegistrations(response.data);
    } catch (error) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = () => {
    setShowFeedbackModal(false);
    setSelectedEvent(null);
    toast.success('Feedback submitted successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl md:text-5xl mb-4" data-testid="student-dashboard-heading">
          My Dashboard
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Manage your event registrations and QR codes
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/events">
          <div className="card-brutalist text-center" data-testid="browse-events-card">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="font-heading font-bold text-xl">Browse Events</h3>
            <p className="text-sm text-muted-foreground mt-2">Discover upcoming events</p>
          </div>
        </Link>

        <div className="card-brutalist text-center">
          <Ticket className="w-12 h-12 mx-auto mb-4 text-secondary" />
          <h3 className="font-heading font-bold text-xl">{registrations.length}</h3>
          <p className="text-sm text-muted-foreground mt-2">My Registrations</p>
        </div>

        <div className="card-brutalist text-center">
          <QrCode className="w-12 h-12 mx-auto mb-4 text-accent" />
          <h3 className="font-heading font-bold text-xl">QR Codes</h3>
          <p className="text-sm text-muted-foreground mt-2">Access your tickets</p>
        </div>
      </div>

      {/* Registrations */}
      <div className="card-brutalist">
        <h2 className="font-heading font-bold text-2xl mb-6">My Registrations</h2>

        {loading ? (
          <p className="text-center py-8">Loading...</p>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12" data-testid="no-registrations-message">
            <p className="text-muted-foreground mb-4">You haven't registered for any events yet</p>
            <Link to="/events" className="btn-primary">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map((reg) => (
              <div key={reg.id} className="border-2 border-black p-6" data-testid={`registration-card-${reg.id}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Event Info */}
                  <div className="lg:col-span-2">
                    <h3 className="font-heading font-bold text-xl mb-2">{reg.event_title}</h3>
                    <div className="inline-flex items-center px-2.5 py-0.5 border-2 border-black text-xs font-bold mb-4">
                      {reg.attendance_status === 'attended' ? (
                        <span className="bg-secondary text-secondary-foreground px-2">✅ Attended</span>
                      ) : (
                        <span className="bg-muted px-2">Registered</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Registered on: {new Date(reg.registration_date).toLocaleDateString()}
                    </p>
                    
                    <div className="flex gap-3">
                      <Link to={`/events/${reg.event_id}`} className="btn-primary text-sm">
                        View Event
                      </Link>
                      {reg.attendance_status === 'attended' && (
                        <button
                          onClick={() => {
                            setSelectedEvent(reg.event_id);
                            setShowFeedbackModal(true);
                          }}
                          className="btn-secondary text-sm"
                          data-testid="give-feedback-button"
                        >
                          <Star className="w-4 h-4 mr-1 inline" />
                          Give Feedback
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-xs font-bold mb-2">YOUR QR CODE</p>
                    <img
                      src={reg.qr_code}
                      alt="QR Code"
                      className="w-32 h-32 border-2 border-black"
                      data-testid="qr-code-image"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          eventId={selectedEvent}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default StudentDashboard;