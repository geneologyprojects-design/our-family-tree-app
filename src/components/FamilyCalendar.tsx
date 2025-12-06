import { useState, useEffect } from 'react';
import type { CalendarEvent, Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Loader, Calendar as CalendarIcon } from 'lucide-react';

export function FamilyCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<(CalendarEvent & { creator?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data } = await supabase
        .from('family_calendar')
        .select('*, creator:profiles!family_calendar_created_by_fkey(username, full_name)')
        .order('event_date', { ascending: true });

      setEvents(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await supabase.from('family_calendar').insert({
        created_by: user.id,
        title,
        description: description || null,
        event_date: eventDate,
      });

      setTitle('');
      setDescription('');
      setEventDate('');
      setShowModal(false);
      await loadEvents();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('family_calendar').delete().eq('id', id);
    await loadEvents();
  };

  if (loading) return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Family Calendar</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{event.title}</h4>
                      <p className="text-blue-600 font-medium">{new Date(event.event_date).toLocaleDateString()}</p>
                      {event.description && <p className="text-gray-600 mt-2">{event.description}</p>}
                    </div>
                    {user?.id === event.created_by && (
                      <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Past Events</h3>
            <div className="space-y-4">
              {pastEvents.map((event) => (
                <div key={event.id} className="bg-gray-50 rounded-lg p-6 opacity-75">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{event.title}</h4>
                      <p className="text-gray-500">{new Date(event.event_date).toLocaleDateString()}</p>
                    </div>
                    {user?.id === event.created_by && (
                      <button onClick={() => handleDelete(event.id)} className="text-red-600 p-2">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Event</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Event Title"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
