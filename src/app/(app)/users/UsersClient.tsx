'use client';

import { useState, useTransition } from 'react';
import { UserCog, Plus, X, Shield, ShoppingCart, RefreshCw, Edit2, KeyRound } from 'lucide-react';
import { createUser, updateUser, resetUserPassword } from '@/app/actions/userActions';
import styles from '../shared.module.css';

type SystemUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
};

type ModalMode = 'create' | 'edit' | 'reset' | null;

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   'rgba(234,88,12,0.12)',
  CASHIER: 'rgba(59,130,246,0.12)',
};
const ROLE_TEXT: Record<string, string> = {
  ADMIN:   '#f97316',
  CASHIER: '#60a5fa',
};

export default function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: SystemUser[];
  currentUserId: string;
}) {
  const [users, setUsers]     = useState<SystemUser[]>(initialUsers);
  const [modal, setModal]     = useState<ModalMode>(null);
  const [target, setTarget]   = useState<SystemUser | null>(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, start]    = useTransition();

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else          { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const openCreate = () => { setTarget(null); setError(''); setModal('create'); };
  const openEdit   = (u: SystemUser) => { setTarget(u); setError(''); setModal('edit'); };
  const openReset  = (u: SystemUser) => { setTarget(u); setError(''); setModal('reset'); };
  const closeModal = () => { setModal(null); setTarget(null); setError(''); };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createUser(fd);
      if (res?.error) { flash(res.error, true); return; }
      flash('User created successfully');
      // Refresh by reloading users in optimistic way
      window.location.reload();
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateUser(fd);
      if (res?.error) { flash(res.error, true); return; }
      flash('User updated');
      closeModal();
      window.location.reload();
    });
  };

  const handleReset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await resetUserPassword(fd);
      if (res?.error) { flash(res.error, true); return; }
      flash('Password reset successfully');
      closeModal();
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.9rem',
    fontFamily: 'inherit', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)',
    marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em',
  };

  return (
    <>
      {/* ── HEADER ACTION ── */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* ── FEEDBACK ── */}
      {error   && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', padding:'0.75rem 1rem', borderRadius:'10px', marginBottom:'1rem', fontSize:'0.875rem' }}>{error}</div>}
      {success && <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', color:'#34d399', padding:'0.75rem 1rem', borderRadius:'10px', marginBottom:'1rem', fontSize:'0.875rem' }}>{success}</div>}

      {/* ── TABLE ── */}
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username / Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: ROLE_COLORS[u.role] || 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: ROLE_TEXT[u.role] || '#fff', flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                    {u.id === currentUserId && <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', padding: '0.1rem 0.45rem', borderRadius: 999, fontWeight: 700 }}>You</span>}
                  </div>
                </td>
                <td style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{u.username}</td>
                <td>
                  <span className={styles.badge} style={{ background: ROLE_COLORS[u.role] || 'rgba(255,255,255,0.06)', color: ROLE_TEXT[u.role] || 'rgba(255,255,255,0.5)', border: 'none' }}>
                    {u.role === 'ADMIN' ? <><Shield size={10} /> Admin</> : <><ShoppingCart size={10} /> Cashier</>}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${u.status === 'ACTIVE' ? styles.badgeGreen : styles.badgeRed}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
                  {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEdit(u)} title="Edit user" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.4rem 0.65rem', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => openReset(u)} title="Reset password" style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.18)', borderRadius: 8, padding: '0.4rem 0.65rem', color: '#f97316', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 600 }}>
                      <KeyRound size={13} /> Reset PW
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MODAL OVERLAY ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 460, position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            {/* CREATE */}
            {modal === 'create' && (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>
                  <UserCog size={18} style={{ display: 'inline', marginRight: 8, color: '#f97316' }} />
                  Add New User
                </div>
                {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', padding:'0.6rem 0.875rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.85rem' }}>{error}</div>}
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><label style={labelStyle}>Full Name</label><input name="name" required style={inputStyle} placeholder="e.g. John Doe" /></div>
                  <div><label style={labelStyle}>Username / Email</label><input name="username" required style={inputStyle} placeholder="e.g. john@restaurant.com" /></div>
                  <div><label style={labelStyle}>Password</label><input name="password" type="password" required minLength={6} style={inputStyle} placeholder="Min. 6 characters" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <select name="role" required style={{ ...inputStyle }}>
                        <option value="CASHIER">Cashier</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select name="status" style={{ ...inputStyle }}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={isPending} className={styles.btnPrimary} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                    {isPending ? 'Creating…' : 'Create User'}
                  </button>
                </form>
              </>
            )}

            {/* EDIT */}
            {modal === 'edit' && target && (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', marginBottom: '1.5rem', letterSpacing: '-0.025em' }}>
                  <Edit2 size={18} style={{ display: 'inline', marginRight: 8, color: '#f97316' }} />
                  Edit — {target.name}
                </div>
                {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', padding:'0.6rem 0.875rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.85rem' }}>{error}</div>}
                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input type="hidden" name="id" value={target.id} />
                  <div><label style={labelStyle}>Full Name</label><input name="name" defaultValue={target.name} required style={inputStyle} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <select name="role" defaultValue={target.role} style={{ ...inputStyle }}>
                        <option value="CASHIER">Cashier</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select name="status" defaultValue={target.status} style={{ ...inputStyle }}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={isPending} className={styles.btnPrimary} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                    {isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </>
            )}

            {/* RESET PASSWORD */}
            {modal === 'reset' && target && (
              <>
                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                  <RefreshCw size={18} style={{ display: 'inline', marginRight: 8, color: '#f97316' }} />
                  Reset Password
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Set a new password for <strong style={{ color: '#fff' }}>{target.name}</strong>
                </p>
                {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', padding:'0.6rem 0.875rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.85rem' }}>{error}</div>}
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input type="hidden" name="id" value={target.id} />
                  <div><label style={labelStyle}>New Password</label><input name="newPassword" type="password" required minLength={6} style={inputStyle} placeholder="Min. 6 characters" /></div>
                  <button type="submit" disabled={isPending} className={styles.btnPrimary} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                    {isPending ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
