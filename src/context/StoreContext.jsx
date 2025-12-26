import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchStores } from '../api/stores';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);

    // User info from local storage
    const role = localStorage.getItem('role');
    const userStoreName = localStorage.getItem('storeName') || 'Hardware POS';

    useEffect(() => {
        const loadStores = async () => {
            if (role === 'OWNER' && localStorage.getItem('token')) {
                try {
                    const data = await fetchStores();
                    console.log("[StoreContext] Loaded Stores:", data);
                    setStores(data);
                    // Only auto-select if not already set (or valid)
                    if (data.length > 0) {
                        const saved = localStorage.getItem('selectedStoreId');
                        if (saved) setSelectedStoreId(Number(saved));
                        else setSelectedStoreId(data[0].id);
                    }
                } catch (error) {
                    console.error("Failed to load stores", error);
                }
            } else {
                // For ADMIN / CASHIER, use the store bound to their account
                const myStoreId = localStorage.getItem('storeId');
                const myStoreName = localStorage.getItem('storeName');
                if (myStoreId) {
                    setSelectedStoreId(Number(myStoreId));
                    if (myStoreName) {
                        setStores([{ id: Number(myStoreId), name: myStoreName }]);
                    }
                }
            }
            setLoading(false);
        };
        loadStores();
    }, [role]);

    const updateSelectedStoreId = (id) => {
        setSelectedStoreId(id);
        if (id) {
            localStorage.setItem('selectedStoreId', id);
        } else {
            localStorage.removeItem('selectedStoreId');
        }
    };

    const value = {
        selectedStoreId,
        setSelectedStoreId: updateSelectedStoreId,
        stores,
        loading,
        role,
        userStoreName
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
