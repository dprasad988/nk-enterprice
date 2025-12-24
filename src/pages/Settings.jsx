import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsMap, updateSettings } from '../api/settings';
import { useStore } from '../context/StoreContext';
import { useAlert } from '../context/AlertContext';
import { Save, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const Settings = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('general');

    // Use Global Store Context
    const { selectedStoreId, stores, role } = useStore();
    const { showAlert } = useAlert();

    // TanStack Query (Pass selectedStoreId from Context)
    const { data: settingsData = {}, isLoading: loading } = useSettingsMap(selectedStoreId);
    const [localSettings, setLocalSettings] = useState({});

    // Sync remote data to local for editing
    useEffect(() => {
        if (settingsData) {
            setLocalSettings(settingsData);
        } else {
            setLocalSettings({}); // Clear if no data
        }
    }, [settingsData, selectedStoreId]);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: updateSettings,
        onSuccess: () => {
            queryClient.invalidateQueries(['settingsMap', selectedStoreId]);
            showAlert('Settings saved successfully!', 'success');
        },
        onError: (error) => {
            console.error("Failed to save settings", error);
            showAlert('Failed to save settings.', 'error');
        }
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tab = queryParams.get('tab');
        if (tab) setActiveTab(tab);
        else setActiveTab('general');
    }, [location]);

    const handleSave = () => {
        if (!selectedStoreId) {
            showAlert('No store selected.', 'error');
            return;
        }

        // Convert map state back to list of objects for API, including STORE ID
        const settingsList = Object.keys(localSettings).map(key => ({
            settingKey: key,
            settingValue: localSettings[key] !== null && localSettings[key] !== undefined ? String(localSettings[key]) : "",
            storeId: Number(selectedStoreId),
            description: getDescription(key)
        }));
        mutation.mutate(settingsList);
    };

    const getDescription = (key) => {
        switch (key) {
            case 'discount_min_bill_amount': return 'Minimum bill amount required to apply a full bill discount';
            case 'discount_max_percent': return 'Maximum percentage discount allowed for full bill';
            case 'store_name': return 'Name of the store displayed on receipts';
            case 'currency': return 'Currency symbol used in the application';
            default: return '';
        }
    };

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading && !selectedStoreId) return <div className="p-4">Loading settings...</div>;

    return (
        <div style={{ paddingBottom: '4rem' }}>


            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div
                    className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'general' ? '2px solid var(--accent-color)' : 'none' }}
                >
                    General
                </div>
                <div
                    className={`nav-item ${activeTab === 'discounts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discounts')}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'discounts' ? '2px solid var(--accent-color)' : 'none' }}
                >
                    Discounts
                </div>
            </div>

            <div className="card">
                {activeTab === 'general' && (
                    <div>
                        <div className="grid grid-cols-2" style={{ marginTop: '1rem', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Store Name</label>
                                <input
                                    type="text"
                                    value={localSettings['store_name'] || ''}
                                    onChange={(e) => handleChange('store_name', e.target.value)}
                                    placeholder={stores.find(s => s.id === selectedStoreId)?.name || "My Hardware Store"}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                                />
                                <small style={{ color: 'var(--text-secondary)' }}>Global display name override (Optional)</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Currency</label>
                                <select
                                    value={localSettings['currency'] || 'LKR (Rs)'}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                                >
                                    <option>USD ($)</option>
                                    <option>EUR (€)</option>
                                    <option>LKR (Rs)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'discounts' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <AlertCircle size={20} color="var(--accent-color)" />
                            <h3>Discount Configuration</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Configure rules for the "Full Bill Discount" feature in POS for <strong>{stores.find(s => Number(s.id) === Number(selectedStoreId))?.name || "Selected Store"}</strong>.
                        </p>

                        <div className="grid grid-cols-2" style={{ marginTop: '1rem', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Minimum Bill Amount (Rs)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 10000"
                                    value={localSettings['discount_min_bill_amount'] || ''}
                                    onChange={(e) => handleChange('discount_min_bill_amount', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                                />
                                <small style={{ color: 'var(--text-secondary)' }}>Minimum total required before a discount can be applied.</small>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Maximum Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 5"
                                    value={localSettings['discount_max_percent'] || ''}
                                    onChange={(e) => handleChange('discount_max_percent', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                                />
                                <small style={{ color: 'var(--text-secondary)' }}>Maximum percentage a cashier is allowed to deduct.</small>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={mutation.isPending || !selectedStoreId || role === 'STORE_ADMIN'}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem',
                            opacity: (mutation.isPending || !selectedStoreId || role === 'STORE_ADMIN') ? 0.5 : 1,
                            cursor: (mutation.isPending || !selectedStoreId || role === 'STORE_ADMIN') ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Save size={18} />
                        {role === 'STORE_ADMIN' ? 'Read Only' : (mutation.isPending ? 'Saving...' : 'Save Configuration')}
                    </button>
                </div>
            </div>

            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 'var(--sidebar-width)',
                right: 0,
                paddingTop: '1rem',
                paddingBottom: '1.5rem',
                backgroundColor: 'var(--bg-primary)',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                zIndex: 10
            }}>
                <p>&copy; {new Date().getFullYear()} NK Enterprice Pvt Ltd. All rights reserved. Version 1.0.0</p>
            </div>
        </div>
    );
};

export default Settings;
