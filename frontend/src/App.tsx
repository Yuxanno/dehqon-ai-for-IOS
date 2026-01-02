import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import MarketplacePage from './pages/MarketplacePage';
import AIConsultantPage from './pages/AIConsultantPage';
import ProfilePage from './pages/ProfilePage';
import ProductPage from './pages/ProductPage';
import CreateListingPage from './pages/CreateListingPage';
import FavoritesPage from './pages/FavoritesPage';
import ChatsPage from './pages/ChatsPage';
import SettingsPage from './pages/SettingsPage';
import MyListingsPage from './pages/MyListingsPage';
import HelpPage from './pages/HelpPage';

export default function App() {
  const location = useLocation();
  
  // Pages without header
  const noHeaderPages = ['/ai', '/chats', '/favorites', '/settings', '/my-listings', '/help'];
  const hideHeader = noHeaderPages.some(page => location.pathname.startsWith(page));
  
  return (
    <div className="min-h-screen bg-earth-50">
      {/* Header - скрыт на некоторых страницах */}
      {!hideHeader && <Header />}
      
      {/* Main content */}
      <main className={hideHeader ? '' : 'page-content'}>
        <Routes>
          <Route path="/" element={<Navigate to="/marketplace" replace />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/ai" element={<AIConsultantPage />} />
          <Route path="/ai/:chatId" element={<AIConsultantPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/create" element={<CreateListingPage />} />
          <Route path="*" element={<Navigate to="/marketplace" replace />} />
        </Routes>
      </main>
      
      {/* Bottom Navigation - hidden on desktop */}
      <BottomNav />
    </div>
  );
}
