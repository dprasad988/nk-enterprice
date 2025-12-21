import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { fetchProductLogs } from '../../api/products';
import { Clock, User as UserIcon, Tag, Info, FileText } from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProductLogsModal = ({ isOpen, onClose, filter, storeId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const loadLogs = async (pageNum, currentFilter = filter) => {
        setLoading(true);
        try {
            const params = { page: pageNum, size: 10 };
            if (storeId) params.storeId = storeId;

            // Handle Filter
            if (currentFilter === 'CUSTOM') {
                if (customRange.start && customRange.end) {
                    params.startDate = new Date(customRange.start).toISOString();
                    // Set end date to end of day
                    const endDate = new Date(customRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    params.endDate = endDate.toISOString();
                } else {
                    // If custom but range not selected, maybe don't load or load all?
                    // Let's load nothing or wait.
                }
            } else if (currentFilter && currentFilter.startDate) {
                params.startDate = currentFilter.startDate;
                params.endDate = currentFilter.endDate;
            }

            const data = await fetchProductLogs(params);
            setLogs(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error("Failed to load logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setPage(0);
            loadLogs(0, filter);
        }
    }, [isOpen, filter, storeId]);

    // Reload when custom range changes (and is valid)
    useEffect(() => {
        if (isOpen && filter === 'CUSTOM' && customRange.start && customRange.end) {
            setPage(0);
            loadLogs(0, 'CUSTOM');
        }
    }, [customRange]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        loadLogs(newPage);
    };

    const getActionStyle = (action) => {
        const baseStyle = {
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'inline-block',
            textTransform: 'uppercase'
        };

        switch (action) {
            case 'ADD': return { ...baseStyle, backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }; // Green
            case 'EDIT': return { ...baseStyle, backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }; // Blue
            case 'DELETE': return { ...baseStyle, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }; // Red
            default: return { ...baseStyle, backgroundColor: '#44403c', color: '#a8a29e' }; // Default
        }
    };

    const generatePDF = () => {
        try {
            const doc = new jsPDF();
            doc.text("Product Audit Logs", 14, 15);

            const tableColumn = ["Timestamp", "Action", "Product", "Changed By", "Details"];
            const tableRows = [];

            logs.forEach(log => {
                const logData = [
                    new Date(log.timestamp).toLocaleString(),
                    log.action,
                    log.productName,
                    log.actionBy,
                    log.details
                ];
                tableRows.push(logData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 8 },
                columnStyles: { 4: { cellWidth: 80 } } // Details column wider
            });

            doc.save("product_audit_logs.pdf");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF: " + error.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Product Audit Logs" maxWidth="900px" alignTop={true}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                {/* Header Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {filter === 'CUSTOM' && (
                            <>
                                <input
                                    type="date"
                                    value={customRange.start}
                                    onChange={(e) => setCustomRange(p => ({ ...p, start: e.target.value }))}
                                    style={{ padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    value={customRange.end}
                                    onChange={(e) => setCustomRange(p => ({ ...p, end: e.target.value }))}
                                    style={{ padding: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </>
                        )}
                        {filter !== 'CUSTOM' && filter && filter.startDate && (
                            <span className="text-sm text-gray-500">
                                Filtering: {new Date(filter.startDate).toLocaleDateString()} - {new Date(filter.endDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <button className="btn btn-secondary" onClick={generatePDF} title="Download PDF">
                        <FileText size={16} /> Download PDF
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>Getting records...</div>
                    ) : logs.length === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-secondary)' }}>No logs found.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Timestamp</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Action</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Product</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Changed By</th>
                                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={getActionStyle(log.action)}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{log.productName}</td>
                                        <td style={{ padding: '0.75rem' }}>{log.actionBy}</td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {log.details && log.details.split(', ').map((detail, index) => {
                                                const parts = detail.split(': ');
                                                if (parts.length >= 2) {
                                                    return (
                                                        <div key={index} style={{ marginBottom: '2px' }}>
                                                            <strong style={{ fontWeight: '600' }}>{parts[0]}: </strong>
                                                            {parts.slice(1).join(': ')}
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={index} style={{ marginBottom: '2px' }}>
                                                        {detail}
                                                    </div>
                                                );
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                            disabled={page === 0}
                            onClick={() => handlePageChange(page - 1)}
                            className="btn"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'white', opacity: page === 0 ? 0.5 : 1 }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '0.9rem' }}>Page {page + 1} of {totalPages}</span>
                        <button
                            disabled={page === totalPages - 1}
                            onClick={() => handlePageChange(page + 1)}
                            className="btn"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'white', opacity: page === totalPages - 1 ? 0.5 : 1 }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ProductLogsModal;
