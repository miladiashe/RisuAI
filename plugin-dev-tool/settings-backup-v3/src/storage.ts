/**
 * Storage helper with Service Worker cache fallback
 */

export interface StorageHelper {
    getItem: (key: string) => Promise<Uint8Array | null>;
    setItem: (key: string, value: Uint8Array) => Promise<void>;
    keys: () => Promise<string[]>;
}

/**
 * Get data from Service Worker cache
 */
async function getFromSWCache(storageKey: string): Promise<Uint8Array | null> {
    try {
        // Encode storage key to hex (same as RisuAI does)
        const textEncoder = new TextEncoder();
        const bytes = textEncoder.encode(storageKey);
        const encoded = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Check if in SW cache
        const checkResponse = await fetch("/sw/check/" + encoded);
        const checkData = await checkResponse.json();

        if (checkData.able) {
            console.log(`✓ Found ${storageKey} in Service Worker cache`);
            // Get from SW cache
            const imgResponse = await fetch("/sw/img/" + encoded);
            const arrayBuffer = await imgResponse.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        }
    } catch (error) {
        console.warn(`SW cache access failed for ${storageKey}:`, error);
    }
    return null;
}

/**
 * Create storage helper with IndexedDB and SW cache fallback
 */
export function createStorage(): StorageHelper {
    // Try localforage first
    if ((globalThis as any).localforage) {
        console.log('Using localforage for storage');
        const storage = (globalThis as any).localforage.createInstance({ name: "risuai" });

        return {
            getItem: async (key: string) => {
                try {
                    const data = await storage.getItem(key);
                    if (data) return data;

                    // Fallback to SW cache
                    console.log(`Storage miss for ${key}, trying SW cache...`);
                    return await getFromSWCache(key);
                } catch (error) {
                    console.warn(`Storage getItem failed for ${key}:`, error);
                    return await getFromSWCache(key);
                }
            },
            setItem: async (key: string, value: Uint8Array) => {
                await storage.setItem(key, value);
            },
            keys: async () => {
                return await storage.keys();
            }
        };
    }

    // Fallback to IndexedDB
    console.log('Using IndexedDB for storage');
    return {
        getItem: async (key: string) => {
            return new Promise(async (resolve, reject) => {
                const request = indexedDB.open("risuai");
                request.onsuccess = async (event: any) => {
                    const db = event.target.result;

                    if (!db.objectStoreNames.contains("keyvaluepairs")) {
                        db.close();
                        // Try SW cache
                        resolve(await getFromSWCache(key));
                        return;
                    }

                    const transaction = db.transaction(["keyvaluepairs"], "readonly");
                    const store = transaction.objectStore("keyvaluepairs");
                    const getRequest = store.get(key);

                    getRequest.onsuccess = async () => {
                        db.close();
                        if (getRequest.result) {
                            resolve(getRequest.result);
                        } else {
                            // Fallback to SW cache
                            console.log(`Storage miss for ${key}, trying SW cache...`);
                            resolve(await getFromSWCache(key));
                        }
                    };

                    getRequest.onerror = async () => {
                        db.close();
                        resolve(await getFromSWCache(key));
                    };
                };
                request.onerror = () => reject(request.error);
            });
        },

        setItem: async (key: string, value: Uint8Array) => {
            return new Promise((resolve, reject) => {
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

        keys: async () => {
            return new Promise((resolve, reject) => {
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
        }
    };
}
