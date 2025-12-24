import React from 'react';
import Modal from '../Modal';
import { QRCodeCanvas } from 'qrcode.react';

const ProductQrModal = ({ isOpen, onClose, product }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Product QR Code"
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '1rem' }}>
                {product && (
                    <>
                        <div style={{ padding: '10px', background: 'white', border: '1px solid #ccc' }}>
                            <QRCodeCanvas value={`Name: ${product.name} | Price: Rs. ${product.price?.toFixed(2)} | Code: ${product.barcode}` || ""} size={200} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: 0 }}>{product.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{product.barcode}</p>
                            <h3 style={{ margin: 0, fontWeight: 'bold' }}>Rs. {product.price?.toFixed(2)}</h3>
                        </div>
                        <button className="btn" onClick={() => window.print()} style={{ marginTop: '1rem' }}>Print Label</button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ProductQrModal;
