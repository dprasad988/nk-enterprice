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
                    if (data.length > 0) {
                        console.log("[StoreContext] Selecting first store:", data[0].id);
                        setSelectedStoreId(data[0].id);
                    } else {
                        console.warn("[StoreContext] No stores found for owner.");
                    }
                } catch (error) {
                    console.error("Failed to load stores", error);
                }
            }
            setLoading(false);
        };
        loadStores();
    }, [role]);

    const value = {
        selectedStoreId,
        setSelectedStoreId,
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
