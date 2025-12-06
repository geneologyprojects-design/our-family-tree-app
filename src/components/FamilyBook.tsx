import { useState, useEffect } from 'react';
import type { FamilyBookEntry, FamilySide, Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X, Loader, Book as BookIcon, Edit } from 'lucide-react';

export function FamilyBook() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<(FamilyBookEntry & { creator?: Profile; family_side?: FamilySide })[]>([]);
  const [familySides, setFamilySides] = useState<FamilySide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FamilyBookEntry | null>(null);
  const [selectedSide, setSelectedSide] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [{ data: entries }, { data: sides }] = await Promise.all([
        supabase.from('family_book').select('*, creator:profiles!family_book_created_by_fkey(username, full_name), family_side:family_sides(name)').order('created_at', { ascending: false }),
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

  const openAddModal = () => {
    setEditingEntry(null);
    setTitle('');
    setContent('');
    setSelectedSide('');
    setShowModal(true);
  };

  const openEditModal = (entry: FamilyBookEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setSelectedSide(entry.family_side_id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSide) return;

    setSubmitting(true);
    try {
      if (editingEntry) {
        await supabase.from('family_book').update({
          title,
          content,
          updated_at: new Date().toISOString(),
        }).eq('id', editingEntry.id);
      } else {
        await supabase.from('family_book').insert({
          family_side_id: selectedSide,
          created_by: user.id,
          title,
          content,
        });
      }

      setTitle('');
      setContent('');
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
    if (!confirm('Delete this story?')) return;
    await supabase.from('family_book').delete().eq('id', id);
    await loadData();
  };

  if (loading) return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Family Book</h2>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Story</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
          <BookIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">No stories yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{entry.title}</h3>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mt-2">
                    {entry.family_side?.name}
                  </span>
                </div>
                {user?.id === entry.created_by && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t">
                {new Date(entry.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingEntry ? 'Edit Story' : 'Add Story'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={selectedSide}
                onChange={(e) => setSelectedSide(e.target.value)}
                required
                disabled={!!editingEntry}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select family side</option>
                {familySides.map((side) => (
                  <option key={side.id} value={side.id}>{side.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Title"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={12}
                placeholder="Content"
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
                  {submitting ? 'Saving...' : editingEntry ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
