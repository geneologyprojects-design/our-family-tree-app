import { useState, useEffect } from 'react';
import type { FamilySide, FamilySideMember, Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Loader, Users } from 'lucide-react';

export function FamilyTree() {
  const { user } = useAuth();
  const [familySides, setFamilySides] = useState<(FamilySide & { members?: (FamilySideMember & { profile?: Profile })[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [sideName, setSideName] = useState('');
  const [sideDescription, setSideDescription] = useState('');
  const [selectedSideId, setSelectedSideId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFamilySides();
  }, []);

  const loadFamilySides = async () => {
    try {
      const { data: sidesData } = await supabase.from('family_sides').select('*').order('name');

      const sidesWithMembers = await Promise.all(
        (sidesData || []).map(async (side) => {
          const { data: membersData } = await supabase
            .from('family_side_members')
            .select('*, profile:profiles!family_side_members_user_id_fkey(id, username, full_name)')
            .eq('family_side_id', side.id);

          return { ...side, members: membersData || [] };
        })
      );

      setFamilySides(sidesWithMembers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { data: newSide } = await supabase.from('family_sides').insert({
        name: sideName,
        description: sideDescription || null,
      }).select().single();

      if (newSide) {
        await supabase.from('family_side_members').insert({
          family_side_id: newSide.id,
          user_id: user.id,
          role: 'admin',
        });
      }

      setSideName('');
      setSideDescription('');
      setShowCreateModal(false);
      await loadFamilySides();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSideId) return;

    setSubmitting(true);
    try {
      await supabase.from('family_side_members').insert({
        family_side_id: selectedSideId,
        user_id: user.id,
        role: 'member',
      });

      setSelectedSideId('');
      setShowJoinModal(false);
      await loadFamilySides();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const userSides = familySides.filter(side => side.members?.some(m => m.user_id === user?.id));
  const availableSides = familySides.filter(side => !side.members?.some(m => m.user_id === user?.id));

  if (loading) return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Family Tree</h2>
        <div className="flex space-x-3">
          {availableSides.length > 0 && (
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              <span>Join Side</span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Create Side</span>
          </button>
        </div>
      </div>

      {userSides.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No family sides yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {userSides.map((side) => (
            <div key={side.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <h3 className="text-2xl font-bold text-white mb-2">{side.name}</h3>
                {side.description && <p className="text-blue-100">{side.description}</p>}
              </div>
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Members</h4>
                <div className="space-y-2">
                  {side.members?.map((member) => (
                    <div key={member.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{member.profile?.full_name}</p>
                        <p className="text-sm text-gray-500">@{member.profile?.username}</p>
                      </div>
                      {member.role === 'admin' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create Family Side</h3>
            <form onSubmit={handleCreateSide} className="space-y-4">
              <input
                type="text"
                value={sideName}
                onChange={(e) => setSideName(e.target.value)}
                required
                placeholder="e.g., Mother's Side"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                value={sideDescription}
                onChange={(e) => setSideDescription(e.target.value)}
                rows={3}
                placeholder="Description (optional)"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Join Family Side</h3>
            <form onSubmit={handleJoinSide} className="space-y-4">
              <select
                value={selectedSideId}
                onChange={(e) => setSelectedSideId(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a side...</option>
                {availableSides.map((side) => (
                  <option key={side.id} value={side.id}>{side.name}</option>
                ))}
              </select>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
