import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
    <h1 className="text-6xl font-bold text-violet-500">404</h1>
    <p className="text-zinc-400 mt-4">Page not found</p>
    <Link to="/" className="btn-primary mt-8">
      Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
