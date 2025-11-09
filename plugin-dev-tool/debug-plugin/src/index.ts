/**
 * Debug Plugin for RisuAI
 * Analyzes storage and database for debugging export issues
 */

console.log('Debug Plugin: Initializing...');

// Create debug UI
const debugContainer = document.createElement('div');
debugContainer.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #0f0;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
`;

const title = document.createElement('h3');
title.textContent = '🔍 Debug Plugin';
title.style.cssText = 'margin: 0 0 10px 0; color: #0f0;';
debugContainer.appendChild(title);

const buttonContainer = document.createElement('div');
buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;';
debugContainer.appendChild(buttonContainer);

const output = document.createElement('pre');
output.style.cssText = 'margin: 10px 0; white-space: pre-wrap; word-wrap: break-word;';
debugContainer.appendChild(output);

function createButton(text: string, onClick: () => void) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
        background: #0f0;
        color: #000;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    btn.onclick = onClick;
    buttonContainer.appendChild(btn);
    return btn;
}

function log(message: string) {
    output.textContent += message + '\n';
    console.log(message);
}

function clear() {
    output.textContent = '';
}

// Button 1: Analyze Persona Icons
createButton('Persona Icons', async () => {
    clear();
    log('=== Persona Icon Analysis ===\n');

    try {
        // @ts-ignore - getDatabase is a global function
        const db = getDatabase();

        if (!db.personas || !Array.isArray(db.personas)) {
            log('No personas found');
            return;
        }

        log(`Total personas: ${db.personas.length}\n`);

        let dataURICount = 0;
        let storageKeyCount = 0;
        let noIconCount = 0;
        let otherCount = 0;

        for (let i = 0; i < db.personas.length; i++) {
            const p = db.personas[i];
            if (!p.icon) {
                noIconCount++;
                continue;
            }

            if (p.icon.startsWith('data:')) {
                dataURICount++;
                if (i < 3 || i === 68 || i === 69) {
                    log(`[${i}] ${p.name}: Data URI (${(p.icon.length / 1024).toFixed(1)} KB)`);
                }
            } else if (p.icon.startsWith('assets/')) {
                storageKeyCount++;
                if (i < 3 || i === 68 || i === 69) {
                    log(`[${i}] ${p.name}: ${p.icon}`);
                }
            } else {
                otherCount++;
                log(`[${i}] ${p.name}: Unknown - ${p.icon.substring(0, 50)}`);
            }
        }

        log('\n=== Summary ===');
        log(`Data URI icons: ${dataURICount}`);
        log(`Storage key icons: ${storageKeyCount}`);
        log(`No icon: ${noIconCount}`);
        log(`Other format: ${otherCount}`);

    } catch (error) {
        log(`Error: ${error}`);
    }
});

// Button 2: Analyze Module Assets
createButton('Module Assets', async () => {
    clear();
    log('=== Module Asset Analysis ===\n');

    try {
        // @ts-ignore
        const db = getDatabase();

        if (!db.modules || !Array.isArray(db.modules)) {
            log('No modules found');
            return;
        }

        log(`Total modules: ${db.modules.length}\n`);

        let totalAssets = 0;
        let modulesWithAssets = 0;

        for (const module of db.modules) {
            if (module.assets && module.assets.length > 0) {
                modulesWithAssets++;
                totalAssets += module.assets.length;

                log(`\nModule: ${module.id} (${module.assets.length} assets)`);

                // Show first 3 assets
                for (let i = 0; i < Math.min(3, module.assets.length); i++) {
                    const asset = module.assets[i];
                    const [assetId, storageKey, ext] = asset;
                    log(`  [${i}] ID: ${assetId}, Key: ${storageKey}, Ext: ${ext || 'undefined'}`);
                }
            }
        }

        log(`\n=== Summary ===`);
        log(`Modules with assets: ${modulesWithAssets}`);
        log(`Total assets: ${totalAssets}`);

    } catch (error) {
        log(`Error: ${error}`);
    }
});

// Button 3: Check Storage
createButton('Check Storage', async () => {
    clear();
    log('=== Storage Check ===\n');

    try {
        // Try to access storage
        const storage = (globalThis as any).localforage?.createInstance({ name: "risuai" });

        if (!storage) {
            log('localforage not available, trying IndexedDB directly...\n');

            const request = indexedDB.open("risuai");
            request.onsuccess = async (event: any) => {
                const idb = event.target.result;
                const transaction = idb.transaction(["keyvaluepairs"], "readonly");
                const store = transaction.objectStore("keyvaluepairs");
                const getAllKeysRequest = store.getAllKeys();

                getAllKeysRequest.onsuccess = () => {
                    const allKeys = getAllKeysRequest.result;
                    const assetKeys = allKeys.filter((k: string) => k.startsWith("assets/"));
                    const personaKeys = allKeys.filter((k: string) => k.includes("persona") || k.includes("icon"));

                    log(`Total keys: ${allKeys.length}`);
                    log(`Asset keys: ${assetKeys.length}`);
                    log(`Persona/icon keys: ${personaKeys.length}`);

                    if (personaKeys.length > 0) {
                        log('\nPersona keys found:');
                        personaKeys.forEach((k: string) => log(`  ${k}`));
                    }

                    idb.close();
                };
            };
            request.onerror = () => {
                log('IndexedDB error: ' + request.error);
            };
        } else {
            const keys = await storage.keys();
            const assetKeys = keys.filter((k: string) => k.startsWith("assets/"));
            const personaKeys = keys.filter((k: string) => k.includes("persona") || k.includes("icon"));

            log(`Total keys: ${keys.length}`);
            log(`Asset keys: ${assetKeys.length}`);
            log(`Persona/icon keys: ${personaKeys.length}`);

            if (personaKeys.length > 0) {
                log('\nPersona keys found:');
                personaKeys.forEach((k: string) => log(`  ${k}`));
            }
        }

    } catch (error) {
        log(`Error: ${error}`);
    }
});

// Button 4: Test Asset Lookup
createButton('Test Lookup', async () => {
    clear();
    log('=== Test Asset Lookup ===\n');

    try {
        // @ts-ignore
        const db = getDatabase();

        // Get first module with assets
        const moduleWithAssets = db.modules?.find((m: any) => m.assets && m.assets.length > 0);

        if (!moduleWithAssets) {
            log('No modules with assets found');
            return;
        }

        log(`Testing module: ${moduleWithAssets.id}`);
        log(`Asset count: ${moduleWithAssets.assets.length}\n`);

        // Try to access storage
        let storage: any = null;
        if ((globalThis as any).localforage) {
            storage = (globalThis as any).localforage.createInstance({ name: "risuai" });
            log('Using localforage\n');
        } else {
            log('localforage not available, using IndexedDB\n');
            storage = {
                getItem: async (key: string) => {
                    return new Promise((resolve, reject) => {
                        const request = indexedDB.open("risuai");
                        request.onsuccess = (event: any) => {
                            const db = event.target.result;
                            const transaction = db.transaction(["keyvaluepairs"], "readonly");
                            const store = transaction.objectStore("keyvaluepairs");
                            const getRequest = store.get(key);
                            getRequest.onsuccess = () => {
                                db.close();
                                resolve(getRequest.result);
                            };
                            getRequest.onerror = () => {
                                db.close();
                                reject(getRequest.error);
                            };
                        };
                        request.onerror = () => reject(request.error);
                    });
                }
            };
        }

        // Test first 5 assets
        for (let i = 0; i < Math.min(5, moduleWithAssets.assets.length); i++) {
            const [assetId, storageKey, ext] = moduleWithAssets.assets[i];

            try {
                const data = await storage.getItem(storageKey);
                const exists = !!data;
                const size = data ? (data.length || data.byteLength || 0) : 0;

                log(`[${i}] ${assetId}`);
                log(`    Key: ${storageKey}`);
                log(`    Ext: ${ext || 'undefined'}`);
                log(`    Exists: ${exists}`);
                log(`    Size: ${(size / 1024).toFixed(1)} KB\n`);
            } catch (error) {
                log(`[${i}] ${assetId} - Error: ${error}\n`);
            }
        }

    } catch (error) {
        log(`Error: ${error}`);
    }
});

// Button 5: Close
createButton('Close', () => {
    document.body.removeChild(debugContainer);
});

document.body.appendChild(debugContainer);

console.log('Debug Plugin: Ready!');

// Cleanup
onUnload(() => {
    if (document.body.contains(debugContainer)) {
        document.body.removeChild(debugContainer);
    }
});
