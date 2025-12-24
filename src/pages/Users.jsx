
import React, { useState } from 'react';
import { Plus, Trash2, User, Store, Monitor, X } from 'lucide-react';
import { useUsers, createUser, deleteUser } from '../api/users';
import { useStores } from '../api/stores';
import { fetchSessions } from '../api/sessions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ConfirmModal from '../components/ConfirmModal';
import { useStore } from '../context/StoreContext';

const Users = () => {
    // TanStack Query Hooks
    const { data: users = [] } = useUsers();
    const { data: stores = [] } = useStores();
    const { role } = useStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'CASHIER',
        storeId: ''
    });

    // Fetch sessions only if Owner and Modal is Open
    const { data: sessions = [], refetch: refetchSessions } = useQuery({
        queryKey: ['sessions'],
        queryFn: fetchSessions,
        enabled: role === 'OWNER' && isSessionModalOpen,
        staleTime: 60000 // 1 min
    });

    const queryClient = useQueryClient();

    // Mutations
    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            setIsModalOpen(false);
            setFormData({ username: '', password: '', role: 'CASHIER', storeId: '' });
        },
        onError: (error) => {
            alert("Error creating user: " + (error.response?.data?.message || error.message));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
        },
        onError: (error) => {
            console.error("Error deleting user", error);
        }
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (!payload.storeId) {
            alert("Store is required for Admin/Cashier");
            return;
        }
        createMutation.mutate(payload);
    };

    const handleDelete = (id) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = () => {
        if (confirmDeleteId) {
            deleteMutation.mutate(confirmDeleteId);
            setConfirmDeleteId(null);
        }
    };

    const getStoreName = (id) => {
        const store = stores.find(s => s.id === id);
        return store ? store.name : 'Global';
    };

    // Improved UA Parser
    const parseUA = (ua) => {
        if (!ua) return { os: 'Unknown', browser: 'Unknown' };

        let os = 'Unknown OS';
        if (ua.includes('Win')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'MacOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

        let browser = 'Unknown Browser';
        if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';

        return { os, browser };
    };

    return (
        <div className="fade-in">
            <div className="header-actions" style={{ justifyContent: 'space-between' }}>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Add User
                </button>
                {role === 'OWNER' && (
                    <button className="btn" onClick={() => { setIsSessionModalOpen(true); refetchSessions(); }} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        <Monitor size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Active Sessions
                    </button>
                )}
            </div>

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Assigned Store</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <User size={16} color="var(--accent-color)" />
                                        </div>
                                        <span style={{ fontWeight: '500' }}>{user.username}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        backgroundColor: user.role === 'OWNER' ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                                        color: 'white'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    {user.role === 'OWNER' ? (
                                        <span style={{ color: 'var(--text-secondary)' }}>All Stores</span>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Store size={16} />
                                            {getStoreName(user.storeId)}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {user.role !== 'OWNER' && ( // Don't allow deleting owners easily
                                        <button className="btn-icon" onClick={() => handleDelete(user.id)} style={{ color: 'var(--danger)' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New User</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select name="role" value={formData.role} onChange={handleInputChange}>
                                    <option value="CASHIER">Cashier</option>
                                    <option value="STORE_ADMIN">Store Admin</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Assign Store</label>
                                <select name="storeId" value={formData.storeId} onChange={handleInputChange} required>
                                    <option value="">Select a Store</option>
                                    {stores.map(store => (
                                        <option key={store.id} value={store.id}>{store.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Session Modal */}
            {isSessionModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '900px', width: '90%', borderRadius: '12px' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Monitor size={24} color="var(--accent-color)" />
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Active Sessions</h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                        Monitor user login history and device details.
                                    </p>
                                </div>
                            </div>
                            <button className="btn-icon" onClick={() => setIsSessionModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto', padding: '0 0.5rem' }}>
                            <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>
                                        <th style={{ padding: '0 1rem' }}>User</th>
                                        <th style={{ padding: '0 1rem' }}>Device</th>
                                        <th style={{ padding: '0 1rem' }}>IP Address</th>
                                        <th style={{ padding: '0 1rem' }}>Login Time</th>
                                        <th style={{ padding: '0 1rem', textAlign: 'right' }}>Duration</th>
                                        <th style={{ padding: '0 1rem', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.length === 0 ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No sessions recorded.</td></tr>
                                    ) : (
                                        sessions.map(session => {
                                            const isActive = session.status === 'ACTIVE';
                                            const loginDate = new Date(session.loginTime);
                                            const logoutDate = session.logoutTime ? new Date(session.logoutTime) : new Date();
                                            const durationMs = logoutDate - loginDate;

                                            // Format duration
                                            const hours = Math.floor(durationMs / 3600000);
                                            const minutes = Math.floor((durationMs % 3600000) / 60000);
                                            // Show "Just now" if less than 1 min
                                            let durationStr = `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
                                            if (hours === 0 && minutes === 0) durationStr = "Just now";

                                            return (
                                                <tr key={session.id} style={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.9rem' }}>
                                                    <td style={{ padding: '1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{session.username}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{parseUA(session.userAgent).os}</span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{parseUA(session.userAgent).browser}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                        {session.ipAddress === '0:0:0:0:0:0:0:1' ? 'Localhost' : session.ipAddress}
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                        {loginDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: 'var(--text-primary)' }}>
                                                        {isActive ? (
                                                            <span style={{ color: 'var(--accent-color)' }}>Running...</span>
                                                        ) : (
                                                            durationStr
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '999px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-tertiary)',
                                                            color: isActive ? '#10B981' : 'var(--text-secondary)',
                                                            border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)'
                                                        }}>
                                                            {isActive ? 'Active' : 'Closed'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={confirmDeleteId ? `Are you sure you want to delete user "${users.find(u => u.id === confirmDeleteId)?.username}"?` : "Are you sure you want to delete this user?"}
                confirmText="Delete"
                isDanger={true}
            />
        </div>
    );
};

export default Users;
