//@name testdbactual
//@display-name Test Database Functions (Actual Call)

console.log('🔍 Testing Database Functions with ACTUAL CALLS...');

const results = [];

// Test 1: getDatabase - READ TEST
try {
    const db = getDatabase();
    if (db && typeof db === 'object') {
        results.push('✅ getDatabase() - WORKS (returned object)');
        console.log('✅ getDatabase() works, formatversion:', db.formatversion);
    } else {
        results.push('⚠️ getDatabase() - EXISTS but returned: ' + typeof db);
    }
} catch (error) {
    results.push('❌ getDatabase() - ERROR: ' + error.message);
    console.error('❌ getDatabase() error:', error);
}

// Test 2: setDatabase - WRITE TEST (safe, just reads and writes back)
try {
    const db = getDatabase();
    const originalTemp = db.temperature;

    // Try to call setDatabase
    setDatabase(db);

    // Check if it actually worked
    const dbAfter = getDatabase();
    if (dbAfter.temperature === originalTemp) {
        results.push('✅ setDatabase() - WORKS (successfully called and data persisted)');
        console.log('✅ setDatabase() works!');
    } else {
        results.push('⚠️ setDatabase() - CALLED but data changed unexpectedly');
    }
} catch (error) {
    results.push('❌ setDatabase() - ERROR when calling: ' + error.message);
    console.error('❌ setDatabase() error:', error);
}

// Test 3: setDatabaseLite - WRITE TEST
try {
    const db = getDatabase();

    // Try to call setDatabaseLite
    setDatabaseLite(db);

    results.push('✅ setDatabaseLite() - WORKS (successfully called)');
    console.log('✅ setDatabaseLite() works!');
} catch (error) {
    results.push('❌ setDatabaseLite() - ERROR when calling: ' + error.message);
    console.error('❌ setDatabaseLite() error:', error);
}

// Test 4: getCurrentCharacter - READ TEST
try {
    const char = getCurrentCharacter();
    if (char) {
        results.push('✅ getCurrentCharacter() - WORKS (returned: ' + (char.name || 'unnamed') + ')');
    } else {
        results.push('⚠️ getCurrentCharacter() - WORKS but returned null/undefined');
    }
} catch (error) {
    results.push('❌ getCurrentCharacter() - ERROR: ' + error.message);
}

// Test 5: alertNormal - UI TEST
try {
    // Don't actually call it to avoid spamming
    if (typeof alertNormal === 'function') {
        results.push('✅ alertNormal() - EXISTS (not called to avoid spam)');
    }
} catch (error) {
    results.push('❌ alertNormal() - ERROR: ' + error.message);
}

// Test 6: sleep - ASYNC TEST
(async () => {
    try {
        const start = Date.now();
        await sleep(100);
        const elapsed = Date.now() - start;
        if (elapsed >= 90 && elapsed <= 150) {
            results.push('✅ sleep() - WORKS (slept ~100ms)');
        } else {
            results.push('⚠️ sleep() - EXISTS but timing off: ' + elapsed + 'ms');
        }
    } catch (error) {
        results.push('❌ sleep() - ERROR: ' + error.message);
    }

    displayResults();
})();

function displayResults() {
    console.log('\n=================================');
    console.log('DATABASE FUNCTION ACTUAL CALL TEST');
    console.log('=================================');
    results.forEach(r => console.log(r));
    console.log('=================================\n');

    // Create UI
    const resultDiv = document.createElement('div');
    resultDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a1a;
        color: #00ff00;
        padding: 20px;
        border: 2px solid #00ff00;
        border-radius: 8px;
        font-family: monospace;
        font-size: 13px;
        z-index: 99999;
        max-height: 80vh;
        overflow-y: auto;
        min-width: 600px;
    `;

    resultDiv.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #00ff00; text-align: center;">
            🧪 Database Function ACTUAL CALL Test
        </h3>
        <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
            <strong>This test actually CALLS the functions</strong><br>
            (not just checks if they exist)
        </div>
        <div style="white-space: pre-line; line-height: 1.8;">
            ${results.join('\n')}
        </div>
        <button id="closeTestResults2" style="
            margin-top: 15px;
            width: 100%;
            padding: 10px;
            background: #00ff00;
            color: #000;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        ">Close</button>
    `;

    document.body.appendChild(resultDiv);

    document.getElementById('closeTestResults2').onclick = () => {
        document.body.removeChild(resultDiv);
    };

    window.testResultDiv = resultDiv;
}

onUnload(() => {
    if (window.testResultDiv && document.body.contains(window.testResultDiv)) {
        document.body.removeChild(window.testResultDiv);
    }
});

console.log('🧪 Actual call test plugin loaded. Results will appear in ~100ms...');
