import { useState, useEffect } from 'react';
import type { TimelineEntry, FamilySide, Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Loader, Clock } from 'lucide-react';

export function FamilyTimeline() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<(TimelineEntry & { creator?: Profile; family_side?: FamilySide })[]>([]);
  const [familySides, setFamilySides] = useState<FamilySide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSide, setSelectedSide] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [{ data: entries }, { data: sides }] = await Promise.all([
        supabase.from('family_timeline').select('*, creator:profiles!family_timeline_created_by_fkey(username, full_name), family_side:family_sides(name)').order('event_year', { ascending: false }),
        supabase.from('family_sides').select('*').order('name'),
      ]);

      setEntries(entries || []);
      setFamilySides(sides || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSide) return;

    setSubmitting(true);
    try {
      await supabase.from('family_timeline').insert({
        family_side_id: selectedSide,
        created_by: user.id,
        title,
        description,
        event_year: parseInt(eventYear),
      });

      setTitle('');
      setDescription('');
      setEventYear('');
      setSelectedSide('');
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('family_timeline').delete().eq('id', id);
    await loadData();
  };

  if (loading) return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Family Timeline</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Entry</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
          <Clock className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">No timeline entries yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>
          <div className="space-y-8">
            {entries.map((entry) => (
              <div key={entry.id} className="relative pl-20">
                <div className="absolute left-5 top-6 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow"></div>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between mb-4">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {entry.event_year}
                      </span>
                    </div>
                    {user?.id === entry.created_by && (
                      <button onClick={() => handleDelete(entry.id)} className="text-red-600 p-2">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{entry.title}</h3>
                  <p className="text-gray-600">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Timeline Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={selectedSide}
                onChange={(e) => setSelectedSide(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select family side</option>
                {familySides.map((side) => (
                  <option key={side.id} value={side.id}>{side.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={eventYear}
                onChange={(e) => setEventYear(e.target.value)}
                required
                min="1900"
                max="2100"
                placeholder="Year"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Title"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Description"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
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
