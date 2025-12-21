import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchSettingsMap, updateSettings } from '../api/settings';
import { Save, AlertCircle } from 'lucide-react';
import Alert from '../components/Alert';

const Settings = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tab = queryParams.get('tab');
        if (tab) setActiveTab(tab);
        else setActiveTab('general');
    }, [location]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await fetchSettingsMap();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings", error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Convert map state back to list of objects for API
            const settingsList = Object.keys(settings).map(key => ({
                settingKey: key,
                settingValue: settings[key],
                description: getDescription(key) // Optional, helper to keep description if needed
            }));
            await updateSettings(settingsList);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            console.error("Failed to save settings", error);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    const getDescription = (key) => {
        switch (key) {
            case 'discount_min_bill_amount': return 'Minimum bill amount required to apply a full bill discount';
            case 'discount_max_percent': return 'Maximum percentage discount allowed for full bill';
            default: return '';
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="p-4">Loading settings...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: message ? '1.5rem' : '0.5rem' }}>
                {message && (
                    <Alert
                        type={message.type}
                        message={message.text}
                        onClose={() => setMessage(null)}
                    />
                )}
            </div>

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
                                    value={settings['store_name'] || 'My Hardware Store'}
                                    onChange={(e) => handleChange('store_name', e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Currency</label>
                                <select
                                    value={settings['currency'] || 'LKR (Rs)'}
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
                            Configure rules for the "Full Bill Discount" feature in POS.
                        </p>

                        <div className="grid grid-cols-2" style={{ marginTop: '1rem', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Minimum Bill Amount (Rs)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 10000"
                                    value={settings['discount_min_bill_amount'] || ''}
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
                                    value={settings['discount_max_percent'] || ''}
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
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
