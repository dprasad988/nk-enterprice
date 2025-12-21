import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Store } from 'lucide-react';
import { fetchUsers, createUser, deleteUser } from '../api/users';
import { fetchStores } from '../api/stores';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [stores, setStores] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'CASHIER',
        storeId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersData, storesData] = await Promise.all([fetchUsers(), fetchStores()]);
            setUsers(usersData);
            setStores(storesData);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.role === 'OWNER') {
                payload.storeId = null;
            } else if (!payload.storeId) {
                alert("Store is required for Admin/Cashier");
                return;
            }

            await createUser(payload);
            setIsModalOpen(false);
            setFormData({ username: '', password: '', role: 'CASHIER', storeId: '' });
            loadData();
        } catch (error) {
            alert("Error creating user: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(id);
                loadData();
            } catch (error) {
                console.error("Error deleting user", error);
            }
        }
    };

    const getStoreName = (id) => {
        const store = stores.find(s => s.id === id);
        return store ? store.name : 'Global';
    };

    return (
        <div className="fade-in">
            <div className="header-actions">

                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Add User
                </button>
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
                                    <option value="OWNER">Owner</option>
                                </select>
                            </div>

                            {formData.role !== 'OWNER' && (
                                <div className="form-group">
                                    <label>Assign Store</label>
                                    <select name="storeId" value={formData.storeId} onChange={handleInputChange} required>
                                        <option value="">Select a Store</option>
                                        {stores.map(store => (
                                            <option key={store.id} value={store.id}>{store.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
