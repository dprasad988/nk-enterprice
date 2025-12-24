import React from 'react';
import Modal from '../Modal';

const ProductFormModal = ({ isOpen, onClose, onSubmit, formData, onChange, isOwner, editingId }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingId ? "Edit Product" : "Add New Product"}
        >
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Product Name</label>
                    <input name="name" value={formData.name} onChange={onChange} disabled={!isOwner} required />
                </div>
                <div className="form-group">
                    <label>Barcode</label>
                    <input name="barcode" value={formData.barcode} onChange={onChange} disabled={!isOwner} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                    <div className="form-group">
                        <label>Selling Price (Rs)</label>
                        <input type="number" name="price" value={formData.price} onChange={onChange} step="0.01" disabled={!isOwner} required />
                    </div>
                    {isOwner && (
                        <div className="form-group">
                            <label>Cost Price (Rs)</label>
                            <input type="number" name="costPrice" value={formData.costPrice} onChange={onChange} step="0.01" />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Discount (%)</label>
                        <input type="number" name="discount" value={formData.discount} onChange={onChange} step="0.1" placeholder="0" disabled={!isOwner} />
                    </div>
                    <div className="form-group">
                        <label>Initial Stock</label>
                        <input type="number" name="stock" value={formData.stock} onChange={onChange} disabled={!isOwner} required />
                    </div>
                    <div className="form-group">
                        <label>Alert Level</label>
                        <input type="number" name="alertLevel" value={formData.alertLevel} onChange={onChange} disabled={!isOwner} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn" onClick={onClose} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        {isOwner ? 'Cancel' : 'Close'}
                    </button>
                    {isOwner && (
                        <button type="submit" className="btn btn-primary">
                            {editingId ? "Update Product" : "Save Product"}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
};

export default ProductFormModal;
