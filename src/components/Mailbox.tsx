import { useState, useEffect } from 'react';
import type { Message, Profile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Loader, Mail, Send, Inbox, Trash2 } from 'lucide-react';

export function Mailbox() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<(Message & { sender?: Profile; recipient?: Profile })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message & { sender?: Profile; recipient?: Profile } | null>(null);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [{ data: messagesData }, { data: profilesData }] = await Promise.all([
        supabase.from('mailbox').select('*, sender:profiles!mailbox_from_user_id_fkey(id, username, full_name), recipient:profiles!mailbox_to_user_id_fkey(id, username, full_name)').or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').neq('id', user?.id || ''),
      ]);

      setMessages(messagesData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const recipient = profiles.find(p => p.username === recipientUsername);
    if (!recipient) {
      alert('User not found');
      return;
    }

    setSubmitting(true);
    try {
      await supabase.from('mailbox').insert({
        from_user_id: user.id,
        to_user_id: recipient.id,
        subject,
        message: messageText,
      });

      setRecipientUsername('');
      setSubject('');
      setMessageText('');
      setShowComposeModal(false);
      await loadData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    await supabase.from('mailbox').update({ read: true }).eq('id', messageId);
    await loadData();
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('mailbox').delete().eq('id', messageId);
    setSelectedMessage(null);
    await loadData();
  };

  const openMessage = async (message: Message & { sender?: Profile; recipient?: Profile }) => {
    setSelectedMessage(message);
    if (message.to_user_id === user?.id && !message.read) {
      await handleMarkAsRead(message.id);
    }
  };

  const inboxMessages = messages.filter(m => m.to_user_id === user?.id);
  const sentMessages = messages.filter(m => m.from_user_id === user?.id);
  const unreadCount = inboxMessages.filter(m => !m.read).length;

  const displayedMessages = activeTab === 'inbox' ? inboxMessages : sentMessages;

  if (loading) return <div className="text-center py-12"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Family Mailbox</h2>
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Send className="w-5 h-5" />
          <span>Compose</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium ${
              activeTab === 'inbox'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Inbox className="w-5 h-5" />
            <span>Inbox</span>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium ${
              activeTab === 'sent'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>Sent</span>
          </button>
        </div>

        {displayedMessages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">{activeTab === 'inbox' ? 'No messages' : 'No sent messages'}</p>
          </div>
        ) : (
          <div className="divide-y">
            {displayedMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => openMessage(message)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${!message.read && message.to_user_id === user?.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {!message.read && message.to_user_id === user?.id && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      <p className="font-medium">
                        {activeTab === 'inbox'
                          ? `From: ${message.sender?.full_name} (@${message.sender?.username}@family.local)`
                          : `To: ${message.recipient?.full_name} (@${message.recipient?.username}@family.local)`}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 mt-1">{message.subject}</p>
                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">{message.message}</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">{new Date(message.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{selectedMessage.subject}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">From:</span> {selectedMessage.sender?.full_name} (@{selectedMessage.sender?.username}@family.local)</p>
                  <p><span className="font-medium">To:</span> {selectedMessage.recipient?.full_name} (@{selectedMessage.recipient?.username}@family.local)</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedMessage(null)} className="p-2 text-gray-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
            {selectedMessage.from_user_id !== user?.id && (
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setRecipientUsername(selectedMessage.sender?.username || '');
                    setSubject(`Re: ${selectedMessage.subject}`);
                    setSelectedMessage(null);
                    setShowComposeModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Compose Message</h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To (Username)</label>
                <input
                  type="text"
                  value={recipientUsername}
                  onChange={(e) => setRecipientUsername(e.target.value)}
                  required
                  placeholder="username"
                  list="usernames"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <datalist id="usernames">
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.username}>
                      {profile.full_name}
                    </option>
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">Internal address: @{recipientUsername || 'username'}@family.local</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                  rows={8}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
