
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Nosotros from './pages/Nosotros';
import Membresias from './pages/Membresias';
import Eventos from './pages/Eventos';
import Recursos from './pages/Recursos';
import Blog from './pages/Blog';
import Contacto from './pages/Contacto';
import PostDetalle from './pages/PostDetalle';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EventoDetalle from './pages/EventoDetalle';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPortal from './pages/AdminPortal';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname === '/admin-portal';

  return (
    <LanguageProvider>
      <div className="flex flex-col min-h-screen">
        {!isAdminPath && <Navbar />}
        <main className={`flex-grow ${!isAdminPath ? 'pt-20' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/membresias" element={<Membresias />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/recursos" element={<Recursos />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<PostDetalle />} />
            <Route path="/eventos/:id" element={<EventoDetalle />} />
            <Route path="/checkout/:productId" element={<Checkout />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-portal" element={<AdminPortal />} />
          </Routes>
        </main>
        {!isAdminPath && <Footer />}
      </div>
    </LanguageProvider>
  );
};

export default App;
