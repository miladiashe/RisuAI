//@name testdbfunctions
//@display-name Test Database Functions

console.log('🔍 Testing Database Functions...');

const results = [];

// Test 1: getDatabase
try {
    const db = getDatabase();
    results.push('✅ getDatabase() - WORKS');
    console.log('✅ getDatabase() works, DB formatversion:', db.formatversion);
} catch (error) {
    results.push('❌ getDatabase() - FAILED: ' + error.message);
    console.error('❌ getDatabase() failed:', error);
}

// Test 2: setDatabase
try {
    if (typeof setDatabase === 'function') {
        results.push('✅ setDatabase() - EXISTS (as function)');
        console.log('✅ setDatabase exists');
    } else {
        results.push('❌ setDatabase() - NOT A FUNCTION (type: ' + typeof setDatabase + ')');
        console.log('❌ setDatabase is not a function, type:', typeof setDatabase);
    }
} catch (error) {
    results.push('❌ setDatabase() - DOES NOT EXIST: ' + error.message);
    console.error('❌ setDatabase does not exist:', error);
}

// Test 3: setDatabaseLite
try {
    if (typeof setDatabaseLite === 'function') {
        results.push('✅ setDatabaseLite() - EXISTS (as function)');
        console.log('✅ setDatabaseLite exists');
    } else {
        results.push('❌ setDatabaseLite() - NOT A FUNCTION (type: ' + typeof setDatabaseLite + ')');
        console.log('❌ setDatabaseLite is not a function, type:', typeof setDatabaseLite);
    }
} catch (error) {
    results.push('❌ setDatabaseLite() - DOES NOT EXIST: ' + error.message);
    console.error('❌ setDatabaseLite does not exist:', error);
}

// Test 4: getCurrentCharacter
try {
    if (typeof getCurrentCharacter === 'function') {
        results.push('✅ getCurrentCharacter() - EXISTS (as function)');
        console.log('✅ getCurrentCharacter exists');
    } else {
        results.push('❌ getCurrentCharacter() - NOT A FUNCTION');
    }
} catch (error) {
    results.push('❌ getCurrentCharacter() - DOES NOT EXIST: ' + error.message);
}

// Test 5: Other undocumented functions
const testFunctions = [
    'setCurrentCharacter',
    'getCharacterByIndex',
    'setCharacterByIndex',
    'getCurrentChat',
    'setCurrentChat',
    'saveImage',
    'downloadFile',
    'getFileSrc',
    'saveAsset',
    'loadAsset',
    'alertError',
    'alertNormal',
    'sleep'
];

for (const funcName of testFunctions) {
    try {
        if (typeof eval(funcName) === 'function') {
            results.push(`✅ ${funcName}() - EXISTS`);
        } else {
            results.push(`⚠️ ${funcName}() - NOT A FUNCTION`);
        }
    } catch (error) {
        results.push(`❌ ${funcName}() - DOES NOT EXIST`);
    }
}

// Display results
console.log('\n=================================');
console.log('DATABASE FUNCTION TEST RESULTS');
console.log('=================================');
results.forEach(r => console.log(r));
console.log('=================================\n');

// Create UI to show results
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
    min-width: 500px;
`;

resultDiv.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #00ff00; text-align: center;">
        🔍 Database Function Test Results
    </h3>
    <div style="white-space: pre-line; line-height: 1.6;">
        ${results.join('\n')}
    </div>
    <button id="closeTestResults" style="
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

document.getElementById('closeTestResults').onclick = () => {
    document.body.removeChild(resultDiv);
};

onUnload(() => {
    if (document.body.contains(resultDiv)) {
        document.body.removeChild(resultDiv);
    }
});

console.log('🔍 Test plugin loaded. Check the popup for results!');
