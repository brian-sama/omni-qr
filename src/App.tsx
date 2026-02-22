/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderPlus,
  Settings,
  LogOut,
  QrCode,
  FileText,
  Plus,
  ChevronRight,
  Download,
  Trash2,
  Upload,
  ExternalLink,
  User,
  Building2,
  Calendar,
  Lock,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from './lib/api';
import { cn, formatDate, formatBytes } from './lib/utils';

// --- Types ---
interface User {
  id: string;
  email: string;
  organization_id: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  logo_path: string | null;
  primary_color: string;
}

interface Folder {
  id: string;
  name: string;
  description: string;
  slug: string;
  access_type: string;
  created_at: string;
}

interface FileData {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  created_at: string;
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#0A1F44] text-white hover:bg-[#1a2f54]',
      secondary: 'bg-emerald-600 text-white hover:bg-emerald-700',
      outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
      ghost: 'text-gray-600 hover:bg-gray-100',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/20 focus:border-[#0A1F44] transition-all',
        className
      )}
      {...props}
    />
  )
);

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string;[key: string]: any }) => (
  <div className={cn('bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden', className)} {...props}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'folder' | 'public'>('dashboard');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Public View State
  const [publicFolder, setPublicFolder] = useState<any>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/f/')) {
      const slug = path.split('/f/')[1];
      fetchPublicFolder(slug);
      setView('public');
      setLoading(false);
    } else {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setOrg(data.organization);
      setIsAuth(true);
    } catch (err) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicFolder = async (slug: string) => {
    try {
      const { data } = await api.get(`/public/folders/${slug}`);
      setPublicFolder(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setOrg(null);
    setIsAuth(false);
    setView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A1F44]"></div>
      </div>
    );
  }

  if (view === 'public') {
    return <PublicView folderData={publicFolder} />;
  }

  if (!isAuth) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        onSuccess={(u, o) => {
          setUser(u);
          setOrg(o);
          setIsAuth(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0A1F44] rounded-xl flex items-center justify-center text-white">
              <QrCode size={24} />
            </div>
            <span className="font-bold text-xl text-[#0A1F44]">OmniQR</span>
          </div>

          <nav className="space-y-1">
            <SidebarItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              active={view === 'dashboard'}
              onClick={() => { setView('dashboard'); setSelectedFolderId(null); }}
            />
            <SidebarItem
              icon={<Settings size={20} />}
              label="Settings"
              active={false}
              onClick={() => { }}
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 truncate">{org?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {selectedFolderId ? (
            <FolderDetailView
              key="folder-detail"
              folderId={selectedFolderId}
              onBack={() => setSelectedFolderId(null)}
            />
          ) : (
            <DashboardView
              key="dashboard"
              onSelectFolder={setSelectedFolderId}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-[#0A1F44]/5 text-[#0A1F44]"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function AuthPage({ mode, setMode, onSuccess }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; onSuccess: (u: User, o: Organization) => void }) {
  const [email, setEmail] = useState('brianmagagula5@gmail.com');
  const [password, setPassword] = useState('Brian7350$@#');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email, password } : { email, password, orgName };
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);

      // Fetch full profile
      const profile = await api.get('/auth/me');
      onSuccess(profile.data.user, profile.data.organization);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0A1F44] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-[#0A1F44]/20">
            <QrCode size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#0A1F44]">
            {mode === 'login' ? 'Welcome Back' : 'Create Organization'}
          </h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' ? 'Log in to manage your meeting QR codes' : 'Start your paperless meeting journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <Input
                placeholder="e.g. Acme Corp"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <Button type="submit" className="w-full py-3" disabled={loading}>
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm font-medium text-[#0A1F44] hover:underline"
          >
            {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function DashboardView({ onSelectFolder, key }: { onSelectFolder: (id: string) => void; key?: string }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const { data } = await api.get('/folders');
      setFolders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 mt-1">Manage your meeting document folders and QR codes</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus size={20} />
          New Meeting
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
            <FolderPlus size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No meetings yet</h3>
          <p className="text-gray-500 mt-1 mb-6">Create your first meeting folder to generate a QR code</p>
          <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">Create Meeting</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map(folder => (
            <Card key={folder.id} className="group hover:border-[#0A1F44]/30 transition-all cursor-pointer" onClick={() => onSelectFolder(folder.id)}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#0A1F44]/5 rounded-xl flex items-center justify-center text-[#0A1F44]">
                    <FileText size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      folder.access_type === 'public' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {folder.access_type}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0A1F44] transition-colors">{folder.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[2.5rem]">{folder.description || 'No description provided.'}</p>
                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={14} />
                    {formatDate(folder.created_at)}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0A1F44] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateFolderModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchFolders();
          }}
        />
      )}
    </motion.div>
  );
}

function CreateFolderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState('public');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/folders', { name, description, access_type: accessType, password });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create New Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Name</label>
            <Input placeholder="e.g. Board Meeting March 2026" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/20 focus:border-[#0A1F44] transition-all min-h-[100px]"
              placeholder="Briefly describe the purpose of this meeting"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccessType('public')}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all",
                  accessType === 'public' ? "bg-[#0A1F44] text-white border-[#0A1F44]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                <Eye size={18} />
                Public
              </button>
              <button
                type="button"
                onClick={() => setAccessType('password')}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all",
                  accessType === 'password' ? "bg-[#0A1F44] text-white border-[#0A1F44]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                <Lock size={18} />
                Password
              </button>
            </div>
          </div>
          {accessType === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
              <Input type="password" placeholder="Enter folder password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          )}
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Meeting'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function FolderDetailView({ folderId, onBack, key }: { folderId: string; onBack: () => void; key?: string }) {
  const [folder, setFolder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFolder();
  }, [folderId]);

  const fetchFolder = async () => {
    try {
      const { data } = await api.get(`/folders/${folderId}`);
      setFolder(data);

      // Fetch QR
      const qrRes = await api.get(`/qr/${data.slug}`);
      setQrDataUrl(qrRes.data.qrDataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFolder();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ChevronRight size={16} className="rotate-180" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Folder Info & Files */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{folder.name}</h1>
              <p className="text-gray-500 mt-2">{folder.description || 'No description provided.'}</p>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                <Button className="gap-2" disabled={uploading}>
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </label>
            </div>
          </div>

          <Card>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Meeting Documents</h2>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{folder.files?.length || 0} Files</span>
            </div>
            <div className="divide-y divide-gray-50">
              {folder.files?.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400 italic">No documents uploaded yet.</p>
                </div>
              ) : (
                folder.files?.map((file: FileData) => (
                  <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatBytes(file.size)} • {formatDate(file.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/files/download/${file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-[#0A1F44] hover:bg-white rounded-lg transition-all"
                        title="Download Document"
                      >
                        <Download size={18} />
                      </a>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                        title="Delete Document"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: QR Code & Actions */}
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-4">Dynamic QR Code</h3>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 inline-block">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Meeting QR" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 bg-gray-50 animate-pulse rounded-xl" />
              )}
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Scan to access live document list.<br />Updates automatically when files change.
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full gap-2" onClick={() => window.open(`/f/${folder.slug}`, '_blank')}>
                <ExternalLink size={16} />
                Preview Public Page
              </Button>
              <Button className="w-full gap-2" variant="secondary" onClick={() => {
                const link = document.createElement('a');
                link.href = qrDataUrl!;
                link.download = `qr-${folder.slug}.png`;
                link.click();
              }}>
                <Download size={16} />
                Download QR (PNG)
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Poster Export</h3>
            <p className="text-sm text-gray-500 mb-6">Generate a branded A4 poster for physical distribution in the meeting room.</p>
            <Button variant="outline" className="w-full gap-2">
              <Plus size={16} />
              Generate A4 Poster
            </Button>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function PublicView({ folderData }: { folderData: any }) {
  if (!folderData) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Not Found</h1>
        <p className="text-gray-500 mt-2">The link may have expired or is incorrect.</p>
      </div>
    </div>
  );

  const { folder, organization, files } = folderData;

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0A1F44] rounded-xl flex items-center justify-center text-white">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">{organization.name}</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Meeting Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{folder.name}</h1>
          <p className="text-gray-500 mt-2 text-sm">{folder.description}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Documents</h3>
          {files.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-400 italic">No documents available for this meeting.</p>
            </Card>
          ) : (
            files.map((file: any) => (
              <Card key={file.id} className="group active:scale-[0.98] transition-all">
                <a
                  href={`/api/files/download/${file.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#0A1F44]/5 group-hover:text-[#0A1F44] transition-colors">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatBytes(file.size)} • {formatDate(file.created_at)}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 group-hover:text-[#0A1F44] transition-colors">
                    <Download size={20} />
                  </div>
                </a>
              </Card>
            ))
          )}
        </div>

        <footer className="mt-12 text-center">
          <p className="text-xs text-gray-400">Powered by OmniQR Paperless Meeting Infrastructure</p>
        </footer>
      </main>
    </div>
  );
}
