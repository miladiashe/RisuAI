/**
 * Storage helper using RisuAI's native file access APIs
 * Automatically handles IndexedDB, Service Worker cache, Tauri, and Capacitor
 */

export interface StorageHelper {
    getItem: (key: string) => Promise<Uint8Array | null>;
    setItem: (key: string, value: Uint8Array) => Promise<void>;
    keys: () => Promise<string[]>;
}

/**
 * Get RisuAI's readImage function
 */
function getReadImage(): (path: string) => Promise<Uint8Array> {
    if ((globalThis as any).readImage) {
        return (globalThis as any).readImage;
    }
    throw new Error('readImage not available');
}

/**
 * Create storage helper using RisuAI's native APIs
 * Uses readImage() for reading (handles all platforms automatically)
 * Uses forageStorage for writing
 */
export function createStorage(): StorageHelper {
    const readImage = getReadImage();

    // Get forageStorage for writing and keys
    const getForageStorage = () => {
        if ((globalThis as any).forageStorage) {
            return (globalThis as any).forageStorage;
        }
        if ((globalThis as any).localforage) {
            return (globalThis as any).localforage.createInstance({ name: "risuai" });
        }
        throw new Error('No storage available');
    };

    return {
        /**
         * Get item using RisuAI's readImage API
         * Automatically handles IndexedDB, SW cache, Tauri, Capacitor
         */
        getItem: async (key: string) => {
            try {
                const data = await readImage(key);
                if (data && data.length > 0) {
                    console.log(`✓ Found ${key} (${data.length} bytes)`);
                    return data;
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
            const storage = getForageStorage();
            await storage.setItem(key, value);
        },

        /**
         * Get all keys from forageStorage
         */
        keys: async () => {
            const storage = getForageStorage();
            if (storage.keys) {
                return await storage.keys();
            }
            // Fallback for storage without keys() method
            return [];
        }
    };
}
