import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth, alignTop, borderColor }) => {
    // ... useEffect ...

    if (!isOpen) return null;

    return (
        <div className="modal-overlay"
            style={alignTop ? { alignItems: 'flex-start', paddingTop: '4rem' } : {}}
            onClick={(e) => {
                if (e.target.className === 'modal-overlay') onClose();
            }}>
            <div className="modal-content" style={{
                ...(maxWidth ? { maxWidth } : {}),
                border: `2px solid ${borderColor || '#FBC02D'}`
            }}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
