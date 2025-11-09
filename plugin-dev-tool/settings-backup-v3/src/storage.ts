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
 * Create storage helper using RisuAI's getFileSrc + forageStorage
 * getFileSrc handles IndexedDB, SW cache, Tauri, and Capacitor
 */
export function createStorage(): StorageHelper {
    // Get forageStorage directly inline
    let storage: any;
    if ((globalThis as any).forageStorage) {
        storage = (globalThis as any).forageStorage;
    } else if ((globalThis as any).localforage) {
        storage = (globalThis as any).localforage.createInstance({ name: "risuai" });
    } else {
        throw new Error('No storage available (forageStorage/localforage not found)');
    }

    // Get getFileSrc directly inline
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
         * Get item using getFileSrc (URL) or forageStorage fallback
         * getFileSrc automatically handles SW cache, IndexedDB, Tauri, Capacitor
         */
        getItem: async (key: string) => {
            // Try getFileSrc first (handles SW cache + all platforms)
            if (getFileSrc) {
                try {
                    const url = await getFileSrc(key);
                    if (url && url.length > 0) {
                        // Fetch the URL to get Uint8Array
                        const response = await fetch(url);
                        if (response.ok) {
                            const arrayBuffer = await response.arrayBuffer();
                            const data = new Uint8Array(arrayBuffer);
                            console.log(`✓ Found ${key} via getFileSrc (${data.length} bytes)`);
                            return data;
                        }
                    }
                } catch (error) {
                    console.warn(`getFileSrc failed for ${key}, trying forageStorage:`, error);
                }
            }

            // Fallback to forageStorage
            try {
                const data = await storage.getItem(key);
                if (data && (data as Uint8Array).length > 0) {
                    console.log(`✓ Found ${key} via forageStorage (${(data as Uint8Array).length} bytes)`);
                    return data as Uint8Array;
                }
                console.warn(`Asset not found: ${key}`);
                return null;
            } catch (error) {
                console.warn(`Failed to read ${key}:`, error);
                return null;
            }
        },

        /**
         * Set item using forageStorage
         */
        setItem: async (key: string, value: Uint8Array) => {
            await storage.setItem(key, value);
        },

        /**
         * Get all keys from forageStorage
         */
        keys: async () => {
            if (storage.keys) {
                return await storage.keys();
            }
            // Fallback for storage without keys() method
            return [];
        }
    };
}
