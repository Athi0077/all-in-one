import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary">All-in-One Store</Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
