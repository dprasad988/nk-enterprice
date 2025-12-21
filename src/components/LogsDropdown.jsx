import React, { useState } from 'react';
import { History, ChevronDown, Calendar, FileText } from 'lucide-react';

const LogsDropdown = ({ onFilterChange, onOpenLogs }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('All Time');

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (filter, label) => {
        setSelectedFilter(label);
        setIsOpen(false);
        onFilterChange(filter);
        if (filter !== 'CUSTOM') {
            onOpenLogs(); // Open modal immediately for presets
        }
    };

    // Determine date ranges
    const getTodayRange = () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    };

    const getWeeklyRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={toggleDropdown}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f3f4f6', color: '#1f2937' }}
            >
                <History size={18} />
                <span>Logs: {selectedFilter}</span>
                <ChevronDown size={14} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px androidx.compose.ui.graphics.Color(0x1a000000)',
                    zIndex: 50,
                    minWidth: '200px',
                    overflow: 'hidden'
                }}>
                    <button
                        onClick={() => handleSelect('ALL', 'All Time')}
                        style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        All Time
                    </button>
                    <button
                        onClick={() => {
                            const range = getTodayRange();
                            handleSelect(range, 'Today');
                        }}
                        style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => {
                            const range = getWeeklyRange();
                            handleSelect(range, 'Last 7 Days');
                        }}
                        style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => {
                            onOpenLogs(); // Open modal first
                            handleSelect('CUSTOM', 'Custom Range'); // Then set custom mode
                        }}
                        style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        Custom Range...
                    </button>
                </div>
            )}
        </div>
    );
};

export default LogsDropdown;
