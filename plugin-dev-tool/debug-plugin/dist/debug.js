//@name debug
//@display-name Debug Plugin

// src/index.ts
  console.log("Debug Plugin: Initializing...");
  var debugContainer = document.createElement("div");
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
  var title = document.createElement("h3");
  title.textContent = "\u{1F50D} Debug Plugin";
  title.style.cssText = "margin: 0 0 10px 0; color: #0f0;";
  debugContainer.appendChild(title);
  var output = document.createElement("pre");
  output.style.cssText = "margin: 10px 0; white-space: pre-wrap; word-wrap: break-word;";
  debugContainer.appendChild(output);
  var buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = "display: flex; gap: 10px; margin-bottom: 10px;";
  function createButton(text, onClick) {
    const btn = document.createElement("button");
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
  function log(message) {
    output.textContent += message + "\n";
    console.log(message);
  }
  function clear() {
    output.textContent = "";
  }
  createButton("Persona Icons", async () => {
    clear();
    log("=== Persona Icon Analysis ===\n");
    try {
      const db = getDatabase();
      if (!db.personas || !Array.isArray(db.personas)) {
        log("No personas found");
        return;
      }
      log(`Total personas: ${db.personas.length}
`);
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
        if (p.icon.startsWith("data:")) {
          dataURICount++;
          if (i < 3 || i === 68 || i === 69) {
            log(`[${i}] ${p.name}: Data URI (${(p.icon.length / 1024).toFixed(1)} KB)`);
          }
        } else if (p.icon.startsWith("assets/")) {
          storageKeyCount++;
          if (i < 3 || i === 68 || i === 69) {
            log(`[${i}] ${p.name}: ${p.icon}`);
          }
        } else {
          otherCount++;
          log(`[${i}] ${p.name}: Unknown - ${p.icon.substring(0, 50)}`);
        }
      }
      log("\n=== Summary ===");
      log(`Data URI icons: ${dataURICount}`);
      log(`Storage key icons: ${storageKeyCount}`);
      log(`No icon: ${noIconCount}`);
      log(`Other format: ${otherCount}`);
    } catch (error) {
      log(`Error: ${error}`);
    }
  });
  createButton("Module Assets", async () => {
    clear();
    log("=== Module Asset Analysis ===\n");
    try {
      const db = getDatabase();
      if (!db.modules || !Array.isArray(db.modules)) {
        log("No modules found");
        return;
      }
      log(`Total modules: ${db.modules.length}
`);
      let totalAssets = 0;
      let modulesWithAssets = 0;
      for (const module of db.modules) {
        if (module.assets && module.assets.length > 0) {
          modulesWithAssets++;
          totalAssets += module.assets.length;
          log(`
Module: ${module.id} (${module.assets.length} assets)`);
          for (let i = 0; i < Math.min(3, module.assets.length); i++) {
            const asset = module.assets[i];
            const [assetId, storageKey, ext] = asset;
            log(`  [${i}] ID: ${assetId}, Key: ${storageKey}, Ext: ${ext || "undefined"}`);
          }
        }
      }
      log(`
=== Summary ===`);
      log(`Modules with assets: ${modulesWithAssets}`);
      log(`Total assets: ${totalAssets}`);
    } catch (error) {
      log(`Error: ${error}`);
    }
  });
  createButton("Check Storage", async () => {
    clear();
    log("=== Storage Check ===\n");
    try {
      const storage = globalThis.localforage?.createInstance({ name: "risuai" });
      if (!storage) {
        log("localforage not available, trying IndexedDB directly...\n");
        const request = indexedDB.open("risuai");
        request.onsuccess = async (event) => {
          const idb = event.target.result;
          const transaction = idb.transaction(["keyvaluepairs"], "readonly");
          const store = transaction.objectStore("keyvaluepairs");
          const getAllKeysRequest = store.getAllKeys();
          getAllKeysRequest.onsuccess = () => {
            const allKeys = getAllKeysRequest.result;
            const assetKeys = allKeys.filter((k) => k.startsWith("assets/"));
            const personaKeys = allKeys.filter((k) => k.includes("persona") || k.includes("icon"));
            log(`Total keys: ${allKeys.length}`);
            log(`Asset keys: ${assetKeys.length}`);
            log(`Persona/icon keys: ${personaKeys.length}`);
            if (personaKeys.length > 0) {
              log("\nPersona keys found:");
              personaKeys.forEach((k) => log(`  ${k}`));
            }
            idb.close();
          };
        };
        request.onerror = () => {
          log("IndexedDB error: " + request.error);
        };
      } else {
        const keys = await storage.keys();
        const assetKeys = keys.filter((k) => k.startsWith("assets/"));
        const personaKeys = keys.filter((k) => k.includes("persona") || k.includes("icon"));
        log(`Total keys: ${keys.length}`);
        log(`Asset keys: ${assetKeys.length}`);
        log(`Persona/icon keys: ${personaKeys.length}`);
        if (personaKeys.length > 0) {
          log("\nPersona keys found:");
          personaKeys.forEach((k) => log(`  ${k}`));
        }
      }
    } catch (error) {
      log(`Error: ${error}`);
    }
  });
  createButton("Test Lookup", async () => {
    clear();
    log("=== Test Asset Lookup ===\n");
    try {
      const db = getDatabase();
      const moduleWithAssets = db.modules?.find((m) => m.assets && m.assets.length > 0);
      if (!moduleWithAssets) {
        log("No modules with assets found");
        return;
      }
      log(`Testing module: ${moduleWithAssets.id}`);
      log(`Asset count: ${moduleWithAssets.assets.length}
`);
      let storage = null;
      if (globalThis.localforage) {
        storage = globalThis.localforage.createInstance({ name: "risuai" });
        log("Using localforage\n");
      } else {
        log("localforage not available, using IndexedDB\n");
        storage = {
          getItem: async (key) => {
            return new Promise((resolve, reject) => {
              const request = indexedDB.open("risuai");
              request.onsuccess = (event) => {
                const db2 = event.target.result;
                const transaction = db2.transaction(["keyvaluepairs"], "readonly");
                const store = transaction.objectStore("keyvaluepairs");
                const getRequest = store.get(key);
                getRequest.onsuccess = () => {
                  db2.close();
                  resolve(getRequest.result);
                };
                getRequest.onerror = () => {
                  db2.close();
                  reject(getRequest.error);
                };
              };
              request.onerror = () => reject(request.error);
            });
          }
        };
      }
      for (let i = 0; i < Math.min(5, moduleWithAssets.assets.length); i++) {
        const [assetId, storageKey, ext] = moduleWithAssets.assets[i];
        try {
          const data = await storage.getItem(storageKey);
          const exists = !!data;
          const size = data ? data.length || data.byteLength || 0 : 0;
          log(`[${i}] ${assetId}`);
          log(`    Key: ${storageKey}`);
          log(`    Ext: ${ext || "undefined"}`);
          log(`    Exists: ${exists}`);
          log(`    Size: ${(size / 1024).toFixed(1)} KB
`);
        } catch (error) {
          log(`[${i}] ${assetId} - Error: ${error}
`);
        }
      }
    } catch (error) {
      log(`Error: ${error}`);
    }
  });
  createButton("Close", () => {
    document.body.removeChild(debugContainer);
  });
  document.body.appendChild(debugContainer);
  console.log("Debug Plugin: Ready!");
  onUnload(() => {
    if (document.body.contains(debugContainer)) {
      document.body.removeChild(debugContainer);
    }
  });