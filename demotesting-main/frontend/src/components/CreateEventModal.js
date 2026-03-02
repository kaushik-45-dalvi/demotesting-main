import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';

const CreateEventModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    capacity: '',
    category: 'Technical',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/events', {
        ...formData,
        capacity: parseInt(formData.capacity)
      });
      onSubmit();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="create-event-modal">
      <div className="bg-card border-2 border-black shadow-hard-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-black">
          <h2 className="font-heading font-bold text-2xl">Create New Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted transition-colors"
            data-testid="close-modal-button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-brutalist w-full"
              required
              data-testid="event-title-input"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-brutalist w-full"
              rows="4"
              required
              data-testid="event-description-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-brutalist w-full"
                required
                data-testid="event-date-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Time *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="input-brutalist w-full"
                required
                data-testid="event-time-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Venue *</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="input-brutalist w-full"
              required
              data-testid="event-venue-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Capacity *</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="input-brutalist w-full"
                min="1"
                required
                data-testid="event-capacity-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-brutalist w-full"
                data-testid="event-category-select"
              >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Competition">Competition</option>
                <option value="Social">Social</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Image URL (optional)</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="input-brutalist w-full"
              placeholder="https://example.com/image.jpg"
              data-testid="event-image-url-input"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 font-bold border-2 border-black hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
              data-testid="submit-create-event-button"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;