import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIShoppingAssistant from '../components/AIShoppingAssistant';

const UserLayout = () => {
  const location = useLocation();
  
  // Show AI assistant only on home page and product pages
  const showAIAssistant = 
    location.pathname === '/' || 
    location.pathname === '/products' || 
    location.pathname.startsWith('/products/');

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
      {showAIAssistant && <AIShoppingAssistant />}
    </div>
  );
};

export default UserLayout;
