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
 * Get RisuAI's getFileSrc function
 */
function getFileSrcFunc(): ((loc: string) => Promise<string>) | null {
    // Try multiple access patterns
    if ((globalThis as any).getFileSrc) {
        return (globalThis as any).getFileSrc;
    }
    if ((window as any).getFileSrc) {
        return (window as any).getFileSrc;
    }
    if ((globalThis as any).__pluginApis__?.getFileSrc) {
        return (globalThis as any).__pluginApis__.getFileSrc;
    }
    return null;
}

/**
 * Get RisuAI's forageStorage
 */
function getForageStorage() {
    if ((globalThis as any).forageStorage) {
        return (globalThis as any).forageStorage;
    }
    if ((globalThis as any).localforage) {
        return (globalThis as any).localforage.createInstance({ name: "risuai" });
    }
    throw new Error('No storage available');
}

/**
 * Create storage helper using RisuAI's getFileSrc + forageStorage
 * getFileSrc handles IndexedDB, SW cache, Tauri, and Capacitor
 */
export function createStorage(): StorageHelper {
    const storage = getForageStorage();
    const getFileSrc = getFileSrcFunc();

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
