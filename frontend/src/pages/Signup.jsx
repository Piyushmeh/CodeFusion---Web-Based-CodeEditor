import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AtSign, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import AuthFormCard, { AuthField, authInputClass } from '../components/AuthFormCard';
import toast from 'react-hot-toast';

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline="Start your"
      highlight="Journey"
      description="Create an account and build amazing projects with CodeFusion."
      illustration="signup"
    >
      <AuthFormCard
        title="Create your account"
        subtitle="Enter your details to get started with CodeFusion"
        footer={
          <p className="text-center text-zinc-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#8b7aff] font-medium hover:text-[#a599ff]">
              Login
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField label="Full name" icon={User}>
            <input
              className={`${authInputClass} pl-11`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Your name"
            />
          </AuthField>

          <AuthField label="Username" icon={AtSign}>
            <input
              className={`${authInputClass} pl-11`}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              placeholder="username"
            />
          </AuthField>

          <AuthField label="Email address" icon={Mail}>
            <input
              type="email"
              className={`${authInputClass} pl-11`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="Enter your email"
            />
          </AuthField>

          <AuthField label="Password" icon={Lock}>
            <input
              type={showPass ? 'text' : 'password'}
              className={`${authInputClass} pl-11 pr-11`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#6d4aff] hover:bg-[#7c5cff] text-white font-semibold text-sm transition shadow-lg shadow-violet-900/30 disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
      </AuthFormCard>
    </AuthLayout>
  );
};

export default Signup;
