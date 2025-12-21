import React from 'react';

const Purchases = () => {
    return (
        <div>

            <div className="card">
                <p>Purchase Management Module</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                    This module would handle creating Purchase Orders to restock inventory from suppliers.
                </p>
                {/* Placeholder for future implementation */}
                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>+ New Purchase Order</button>
            </div>
        </div>
    );
};

export default Purchases;
