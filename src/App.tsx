import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { FamilyTree } from './components/FamilyTree';
import { FamilyGallery } from './components/FamilyGallery';
import { FamilyCalendar } from './components/FamilyCalendar';
import { FamilyTimeline } from './components/FamilyTimeline';
import { FamilyBook } from './components/FamilyBook';
import { Mailbox } from './components/Mailbox';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'family-tree' | 'gallery' | 'calendar' | 'timeline' | 'book' | 'mailbox'>('family-tree');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'family-tree':
        return <FamilyTree />;
      case 'gallery':
        return <FamilyGallery />;
      case 'calendar':
        return <FamilyCalendar />;
      case 'timeline':
        return <FamilyTimeline />;
      case 'book':
        return <FamilyBook />;
      case 'mailbox':
        return <Mailbox />;
      default:
        return <FamilyTree />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
