/**
 * Storage helper using RisuAI's forageStorage
 * Automatically handles IndexedDB, Tauri, and Capacitor
 */

export interface StorageHelper {
    getItem: (key: string) => Promise<Uint8Array | null>;
    setItem: (key: string, value: Uint8Array) => Promise<void>;
    keys: () => Promise<string[]>;
}

/**
 * Create storage helper using RisuAI's getFileSrc + forageStorage/IndexedDB
 * getFileSrc handles IndexedDB, SW cache, Tauri, and Capacitor
 */
export function createStorage(): StorageHelper {
    // Try to get forageStorage (optional)
    let storage: any = null;
    if ((globalThis as any).forageStorage) {
        storage = (globalThis as any).forageStorage;
    } else if ((globalThis as any).localforage) {
        storage = (globalThis as any).localforage.createInstance({ name: "risuai" });
    }

    // Get getFileSrc (optional)
    let getFileSrc: ((loc: string) => Promise<string>) | null = null;
    if ((globalThis as any).getFileSrc) {
        getFileSrc = (globalThis as any).getFileSrc;
    } else if ((window as any).getFileSrc) {
        getFileSrc = (window as any).getFileSrc;
    } else if ((globalThis as any).__pluginApis__?.getFileSrc) {
        getFileSrc = (globalThis as any).__pluginApis__.getFileSrc;
    }

    return {
        /**
         * Get item using getFileSrc (URL) or forageStorage or manual IndexedDB
         * getFileSrc automatically handles SW cache, IndexedDB, Tauri, Capacitor
         */
        getItem: async (key: string) => {
            // Strategy 1: Try getFileSrc first (handles SW cache + all platforms)
            if (getFileSrc) {
                console.log(`[Storage] Trying getFileSrc for ${key}...`);
                try {
                    const url = await getFileSrc(key);
                    console.log(`[Storage] getFileSrc returned:`, url ? `URL (${url.substring(0, 50)}...)` : 'empty/null');

                    if (url && url.length > 0) {
                        // Fetch the URL to get Uint8Array
                        const response = await fetch(url);
                        console.log(`[Storage] fetch response:`, response.ok ? 'OK' : `Failed (${response.status})`);

                        if (response.ok) {
                            const arrayBuffer = await response.arrayBuffer();
                            const data = new Uint8Array(arrayBuffer);
                            console.log(`✓ Found ${key} via getFileSrc (${data.length} bytes)`);
                            return data;
                        }
                    }
                } catch (error) {
                    console.warn(`[Storage] getFileSrc failed for ${key}:`, error);
                }
            } else {
                console.log(`[Storage] getFileSrc not available for ${key}`);
            }

            // Strategy 2: Try forageStorage
            if (storage) {
                try {
                    const data = await storage.getItem(key);
                    if (data && (data as Uint8Array).length > 0) {
                        console.log(`✓ Found ${key} via forageStorage (${(data as Uint8Array).length} bytes)`);
                        return data as Uint8Array;
                    }
                } catch (error) {
                    console.warn(`forageStorage.getItem failed for ${key}:`, error);
                }
            }

            // Strategy 3: Manual IndexedDB access
            try {
                const data = await new Promise<Uint8Array | null>((resolve) => {
                    const request = indexedDB.open("risuai");
                    request.onsuccess = (event: any) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains("keyvaluepairs")) {
                            db.close();
                            resolve(null);
                            return;
                        }
                        const transaction = db.transaction(["keyvaluepairs"], "readonly");
                        const store = transaction.objectStore("keyvaluepairs");
                        const getRequest = store.get(key);
                        getRequest.onsuccess = () => {
                            db.close();
                            resolve(getRequest.result || null);
                        };
                        getRequest.onerror = () => {
                            db.close();
                            resolve(null);
                        };
                    };
                    request.onerror = () => resolve(null);
                });

                if (data && data.length > 0) {
                    console.log(`✓ Found ${key} via IndexedDB (${data.length} bytes)`);
                    return data;
                }
            } catch (error) {
                console.warn(`IndexedDB access failed for ${key}:`, error);
            }

            console.warn(`Asset not found: ${key}`);
            return null;
        },

        /**
         * Set item using forageStorage or manual IndexedDB
         */
        setItem: async (key: string, value: Uint8Array) => {
            if (storage) {
                await storage.setItem(key, value);
                return;
            }

            // Manual IndexedDB write
            return new Promise<void>((resolve, reject) => {
                const request = indexedDB.open("risuai");
                request.onsuccess = (event: any) => {
                    const db = event.target.result;
                    const transaction = db.transaction(["keyvaluepairs"], "readwrite");
                    const store = transaction.objectStore("keyvaluepairs");
                    const putRequest = store.put(value, key);
                    putRequest.onsuccess = () => {
                        db.close();
                        resolve();
                    };
                    putRequest.onerror = () => {
                        db.close();
                        reject(putRequest.error);
                    };
                };
                request.onerror = () => reject(request.error);
            });
        },

        /**
         * Get all keys from forageStorage or manual IndexedDB
         */
        keys: async () => {
            if (storage && storage.keys) {
                return await storage.keys();
            }

            // Manual IndexedDB keys
            try {
                return await new Promise<string[]>((resolve, reject) => {
                    const request = indexedDB.open("risuai");
                    request.onsuccess = (event: any) => {
                        const db = event.target.result;
                        const transaction = db.transaction(["keyvaluepairs"], "readonly");
                        const store = transaction.objectStore("keyvaluepairs");
                        const getAllKeysRequest = store.getAllKeys();
                        getAllKeysRequest.onsuccess = () => {
                            db.close();
                            resolve(getAllKeysRequest.result as string[]);
                        };
                        getAllKeysRequest.onerror = () => {
                            db.close();
                            reject(getAllKeysRequest.error);
                        };
                    };
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                console.warn('Failed to get keys:', error);
                return [];
            }
        }
    };
}
