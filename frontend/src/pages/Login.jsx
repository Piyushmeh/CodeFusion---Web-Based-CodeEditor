import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import AuthFormCard, { AuthField, authInputClass } from '../components/AuthFormCard';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline="Welcome back"
      highlight="Developer"
      description="Login to your account and continue building amazing projects."
      illustration="login"
    >
      <AuthFormCard
        title="Login to your account"
        subtitle="Enter your credentials to access your workspace"
        footer={
          <p className="text-center text-zinc-500 text-sm mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-[#8b7aff] font-medium hover:text-[#a599ff]">
              Sign up
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label="Email address" icon={Mail}>
            <input
              type="email"
              className={`${authInputClass} pl-11`}
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </AuthField>

          <AuthField label="Password" icon={Lock}>
            <input
              type={showPass ? 'text' : 'password'}
              className={`${authInputClass} pl-11 pr-11`}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-zinc-500 hover:text-zinc-300"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </AuthField>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-[#0d0f14] text-[#7c5cff] focus:ring-[#7c5cff]/50 focus:ring-offset-0"
              />
              Remember me
            </label>
            <button type="button" className="text-[#8b7aff] hover:text-[#a599ff] font-medium">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#6d4aff] hover:bg-[#7c5cff] text-white font-semibold text-sm transition shadow-lg shadow-violet-900/30 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </AuthFormCard>
    </AuthLayout>
  );
};

export default Login;
