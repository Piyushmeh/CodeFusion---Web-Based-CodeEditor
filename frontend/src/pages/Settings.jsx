import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Link as LinkIcon, Copy, Pencil, Upload, Trash2, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/services';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    email: '',
    location: '',
    website: '',
  });
  const [activities, setActivities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        email: user.email || '',
        location: user.location || '',
        website: user.website || '',
      });
    }
  }, [user]);

  useEffect(() => {
    userAPI.getActivities().then((r) => setActivities(r.data)).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser(form);
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Max file size 2MB');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await userAPI.uploadAvatar(fd);
      await refreshUser();
      toast.success('Photo uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await userAPI.removeAvatar();
      await refreshUser();
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=7c3aed&color=fff&size=200`;

  const formatActivityTime = (date) => {
    const diff = Date.now() - new Date(date);
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h || 1} hours ago`;
    return `${Math.floor(h / 24)} days ago`;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">My Profile</h1>
            <p className="text-zinc-500 mt-1">Manage your personal information and account details</p>
          </div>
          <Link to="/" className="btn-outline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form id="profile-form" onSubmit={handleSave} className="lg:col-span-1 glass-card p-6 space-y-4">
            <h2 className="font-semibold text-white mb-4">Profile Information</h2>
            <div>
              <label className="text-sm text-zinc-400">Full Name</label>
              <input
                className="input-dark mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Username</label>
              <input
                className="input-dark mt-1"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <p className="text-xs text-violet-400 mt-1 flex items-center gap-1">
                codefusion.dev/u/{form.username}
                <Copy className="w-3 h-3 cursor-pointer" />
              </p>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Bio</label>
              <textarea
                className="input-dark mt-1 resize-none h-24"
                maxLength={160}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <p className="text-xs text-zinc-500 text-right">{form.bio.length} / 160</p>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Email</label>
              <div className="relative mt-1">
                <input
                  className="input-dark pr-24"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Location</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  className="input-dark pl-10"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Website</label>
              <div className="relative mt-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  className="input-dark pl-10"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
            </div>
          </form>

          <div className="glass-card p-6 flex flex-col items-center">
            <h2 className="font-semibold text-white mb-6 w-full">Profile Photo</h2>
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-40 h-40 rounded-full object-cover border-4 border-violet-500/30"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-neon"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
            <p className="text-xs text-zinc-500 mt-4">JPG, PNG or GIF. Max size 2MB.</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-outline flex items-center gap-2 mt-4 w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="text-red-400 text-sm mt-3 flex items-center gap-1 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" /> Remove Photo
            </button>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-zinc-500 text-sm">No activity yet</p>
              ) : (
                activities.map((a) => (
                  <div key={a._id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                      •
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{a.title}</p>
                      <p className="text-zinc-500 text-xs">{a.description}</p>
                    </div>
                    <span className="text-xs text-zinc-600 shrink-0">
                      {formatActivityTime(a.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 justify-end">
          <button
            type="button"
            onClick={() =>
              user &&
              setForm({
                name: user.name,
                username: user.username,
                bio: user.bio || '',
                email: user.email,
                location: user.location || '',
                website: user.website || '',
              })
            }
            className="btn-outline"
          >
            Reset
          </button>
          <button type="submit" form="profile-form" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
