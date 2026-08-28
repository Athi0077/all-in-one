import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIShoppingAssistant from '../components/AIShoppingAssistant';

const UserLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
      <AIShoppingAssistant />
    </div>
  );
};

export default UserLayout;
