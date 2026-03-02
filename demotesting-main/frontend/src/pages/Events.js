import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import ChatBot from '../components/ChatBot';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/events', { params });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-5xl mb-4" data-testid="events-page-heading">
            Discover Events
          </h1>
          
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            {['all', 'upcoming', 'ongoing', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-2 font-bold border-2 border-black transition-all ${
                  filter === status
                    ? 'bg-primary text-primary-foreground shadow-hard'
                    : 'bg-white hover:bg-muted'
                }`}
                data-testid={`filter-${status}-button`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="font-bold text-lg">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="card-brutalist text-center py-12" data-testid="no-events-message">
            <p className="font-bold text-lg">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/events/${event.id}`}>
                  <div className="card-brutalist h-full" data-testid={`event-card-${event.id}`}>
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-48 object-cover border-2 border-black mb-4"
                      />
                    )}
                    
                    <div className="inline-flex items-center px-2.5 py-0.5 border-2 border-black bg-secondary text-secondary-foreground text-xs font-bold mb-2">
                      {event.category}
                    </div>
                    
                    <h3 className="font-heading font-bold text-2xl mb-2">{event.title}</h3>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.registered_count} / {event.capacity} registered</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <ChatBot />
    </div>
  );
};

export default Events;