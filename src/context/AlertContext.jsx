import React, { createContext, useContext, useState, useCallback } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext();

export const useAlert = () => {
    return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({ message: null, type: 'error' });

    const showAlert = useCallback((message, type = 'error') => {
        setAlert({ message, type });
        // Alert component handles auto-close via timeout calling onClose
    }, []);

    const closeAlert = useCallback(() => {
        setAlert({ message: null, type: 'error' });
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {alert.message && (
                <Alert
                    message={alert.message}
                    type={alert.type}
                    onClose={closeAlert}
                />
            )}
        </AlertContext.Provider>
    );
};
