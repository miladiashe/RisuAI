//@name settingsbackup
//@display-name Settings Backup & Restore
//@link https://github.com/miladiashe/risuai-plugin-builder Plugin Builder Repository

"use strict";
(() => {
  // src/export.ts
  function exportSettings() {
    console.log("Settings Backup: Exporting settings...");
    try {
      const db = globalThis.getDatabase();
      const settingsBackup = {
        ...db,
        characters: void 0,
        // Exclude characters array
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        exportVersion: "1.0.0",
        pluginName: "settingsbackup"
      };
      delete settingsBackup.characters;
      const jsonString = JSON.stringify(settingsBackup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `risuai-settings-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("Settings Backup: Export successful!");
      alert("\u2705 Settings exported successfully!");
    } catch (error) {
      console.error("Settings Backup: Export failed", error);
      alert("\u274C Export failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  // src/import.ts
  function importSettings() {
    console.log("Settings Backup: Importing settings...");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        const importedSettings = JSON.parse(text);
        if (!importedSettings.pluginName || importedSettings.pluginName !== "settingsbackup") {
          throw new Error("Invalid settings file. This does not appear to be a RisuAI settings backup.");
        }
        const confirmed = confirm(
          `\u26A0\uFE0F Import Settings?

This will replace your current settings (excluding characters).

Export Date: ${importedSettings.exportDate || "Unknown"}
Version: ${importedSettings.exportVersion || "Unknown"}

Continue?`
        );
        if (!confirmed) {
          console.log("Settings Backup: Import cancelled by user");
          return;
        }
        const db = globalThis.getDatabase();
        const currentCharacters = db.characters;
        delete importedSettings.exportDate;
        delete importedSettings.exportVersion;
        delete importedSettings.pluginName;
        const mergedDb = {
          ...importedSettings,
          characters: currentCharacters
        };
        globalThis.setDatabase(mergedDb);
        console.log("Settings Backup: Import successful!");
        alert("\u2705 Settings imported successfully!\n\n\u26A0\uFE0F Please refresh the page to apply changes.");
      } catch (error) {
        console.error("Settings Backup: Import failed", error);
        alert("\u274C Import failed: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    };
    input.click();
  }

  // src/ui.ts
  var container = null;
  function createUI(callbacks) {
    container = document.createElement("div");
    container.id = "settings-backup-ui";
    container.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "\u{1F4BE} Export Settings";
    exportBtn.style.cssText = `
        padding: 12px 20px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
    `;
    exportBtn.onmouseenter = () => {
      exportBtn.style.background = "#059669";
      exportBtn.style.transform = "translateY(-2px)";
      exportBtn.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.15)";
    };
    exportBtn.onmouseleave = () => {
      exportBtn.style.background = "#10b981";
      exportBtn.style.transform = "translateY(0)";
      exportBtn.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    };
    exportBtn.onclick = callbacks.onExport;
    const importBtn = document.createElement("button");
    importBtn.textContent = "\u{1F4E5} Import Settings";
    importBtn.style.cssText = `
        padding: 12px 20px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
    `;
    importBtn.onmouseenter = () => {
      importBtn.style.background = "#2563eb";
      importBtn.style.transform = "translateY(-2px)";
      importBtn.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.15)";
    };
    importBtn.onmouseleave = () => {
      importBtn.style.background = "#3b82f6";
      importBtn.style.transform = "translateY(0)";
      importBtn.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    };
    importBtn.onclick = callbacks.onImport;
    container.appendChild(exportBtn);
    container.appendChild(importBtn);
    document.body.appendChild(container);
    console.log("Settings Backup: UI created");
    onUnload(cleanupUI);
  }
  function cleanupUI() {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
      console.log("Settings Backup: UI cleaned up");
    }
  }

  // src/index.ts
  console.log("Settings Backup Plugin: Initializing...");
  createUI({
    onExport: exportSettings,
    onImport: importSettings
  });
  onUnload(() => {
    console.log("Settings Backup Plugin: Cleaning up...");
  });
  console.log("Settings Backup Plugin: Initialized successfully!");
})();
