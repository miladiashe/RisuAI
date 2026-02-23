const express = require('express');
const app = express();
const path = require('path');
const htmlparser = require('node-html-parser');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const fs = require('fs/promises')
const crypto = require('crypto')
const { Unpackr } = require('msgpackr')
const fflate = require('fflate')
const zlib = require('zlib')
const { promisify } = require('util')
const gunzipAsync = promisify(zlib.gunzip)
app.use(express.static(path.join(process.cwd(), 'dist'), {index: false}));
app.use(express.json({ limit: '500mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '500mb' }));
app.use(express.text({ limit: '500mb' }));
const {pipeline} = require('stream/promises')
const https = require('https');
const sslPath = path.join(process.cwd(), 'server/node/ssl/certificate');
const hubURL = 'https://sv.risuai.xyz'; 
const openid = require('openid-client');

let password = ''

const savePath = path.join(process.cwd(), "save")
if(!existsSync(savePath)){
    mkdirSync(savePath)
}

const passwordPath = path.join(process.cwd(), 'save', '__password')
if(existsSync(passwordPath)){
    password = readFileSync(passwordPath, 'utf-8')
}

const authCodePath = path.join(process.cwd(), 'save', '__authcode')
const hexRegex = /^[0-9a-fA-F]+$/;
function isHex(str) {
    return hexRegex.test(str.toUpperCase().trim()) || str === '__password';
}

app.get('/', async (req, res, next) => {

    const clientIP = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'Unknown IP';
    const timestamp = new Date().toISOString();
    console.log(`[Server] ${timestamp} | Connection from: ${clientIP}`);
    
    try {
        const mainIndex = await fs.readFile(path.join(process.cwd(), 'dist', 'index.html'))
        const root = htmlparser.parse(mainIndex)
        const head = root.querySelector('head')
        head.innerHTML = `<script>globalThis.__NODE__ = true</script>` + head.innerHTML
        
        res.send(root.toString())
    } catch (error) {
        console.log(error)
        next(error)
    }
})

const reverseProxyFunc = async (req, res, next) => {
    const authHeader = req.headers['risu-auth'];
    if(!authHeader || authHeader.trim() !== password.trim()){
        console.log('incorrect', 'received:', authHeader, 'expected:', password)
        res.status(400).send({
            error:'Password Incorrect'
        });
        return
    }
    
    const urlParam = req.headers['risu-url'] ? decodeURIComponent(req.headers['risu-url']) : req.query.url;

    if (!urlParam) {
        res.status(400).send({
            error:'URL has no param'
        });
        return;
    }
    const header = req.headers['risu-header'] ? JSON.parse(decodeURIComponent(req.headers['risu-header'])) : req.headers;
    if(!header['x-forwarded-for']){
        header['x-forwarded-for'] = req.ip
    }

    if(req.headers['authorization']?.startsWith('X-SERVER-REGISTER')){
        if(!existsSync(authCodePath)){
            delete header['authorization']
        }
        else{
            const authCode = fs.readFileSync(authCodePath, 'utf-8')
            header['authorization'] = `Bearer ${authCode}`
        }
    }
    let originalResponse;
    try {
        // make request to original server
        originalResponse = await fetch(urlParam, {
            method: req.method,
            headers: header,
            body: JSON.stringify(req.body)
        });
        // get response body as stream
        const originalBody = originalResponse.body;
        // get response headers
        const head = new Headers(originalResponse.headers);
        head.delete('content-security-policy');
        head.delete('content-security-policy-report-only');
        head.delete('clear-site-data');
        head.delete('Cache-Control');
        head.delete('Content-Encoding');
        const headObj = {};
        for (let [k, v] of head) {
            headObj[k] = v;
        }
        // send response headers to client
        res.header(headObj);
        // send response status to client
        res.status(originalResponse.status);
        // send response body to client
        await pipeline(originalResponse.body, res);


    }
    catch (err) {
        next(err);
        return;
    }
}

const reverseProxyFunc_get = async (req, res, next) => {
    const authHeader = req.headers['risu-auth'];
    if(!authHeader || authHeader.trim() !== password.trim()){
        console.log('incorrect', 'received:', authHeader, 'expected:', password)
        res.status(400).send({
            error:'Password Incorrect'
        });
        return
    }
    
    const urlParam = req.headers['risu-url'] ? decodeURIComponent(req.headers['risu-url']) : req.query.url;

    if (!urlParam) {
        res.status(400).send({
            error:'URL has no param'
        });
        return;
    }
    const header = req.headers['risu-header'] ? JSON.parse(decodeURIComponent(req.headers['risu-header'])) : req.headers;
    if(!header['x-forwarded-for']){
        header['x-forwarded-for'] = req.ip
    }
    let originalResponse;
    try {
        // make request to original server
        originalResponse = await fetch(urlParam, {
            method: 'GET',
            headers: header
        });
        // get response body as stream
        const originalBody = originalResponse.body;
        // get response headers
        const head = new Headers(originalResponse.headers);
        head.delete('content-security-policy');
        head.delete('content-security-policy-report-only');
        head.delete('clear-site-data');
        head.delete('Cache-Control');
        head.delete('Content-Encoding');
        const headObj = {};
        for (let [k, v] of head) {
            headObj[k] = v;
        }
        // send response headers to client
        res.header(headObj);
        // send response status to client
        res.status(originalResponse.status);
        // send response body to client
        await pipeline(originalResponse.body, res);
    }
    catch (err) {
        next(err);
        return;
    }
}

let accessTokenCache = {
    token: null,
    expiry: 0
}
async function getSionywAccessToken() {
    if(accessTokenCache.token && Date.now() < accessTokenCache.expiry){
        return accessTokenCache.token;
    }
    //Schema of the client data file
    // {
    //     refresh_token: string;
    //     client_id: string;
    //     client_secret: string;
    // }
    
    const clientDataPath = path.join(process.cwd(), 'save', '__sionyw_client_data.json');
    let refreshToken = ''
    let clientId = ''
    let clientSecret = ''
    if(!existsSync(clientDataPath)){
        throw new Error('No Sionyw client data found');
    }
    const clientDataRaw = readFileSync(clientDataPath, 'utf-8');
    const clientData = JSON.parse(clientDataRaw);
    refreshToken = clientData.refresh_token;
    clientId = clientData.client_id;
    clientSecret = clientData.client_secret;

    //Oauth Refresh Token Flow
    
    const tokenResponse = await fetch('account.sionyw.com/account/api/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret
        })
    })

    if(!tokenResponse.ok){
        throw new Error('Failed to refresh Sionyw access token');
    }

    const tokenData = await tokenResponse.json();

    //Update the refresh token in the client data file
    if(tokenData.refresh_token && tokenData.refresh_token !== refreshToken){
        clientData.refresh_token = tokenData.refresh_token;
        writeFileSync(clientDataPath, JSON.stringify(clientData), 'utf-8');
    }

    accessTokenCache.token = tokenData.access_token;
    accessTokenCache.expiry = Date.now() + (tokenData.expires_in * 1000) - (5 * 60 * 1000); //5 minutes early

    return tokenData.access_token;
}


async function hubProxyFunc(req, res) {
    const excludedHeaders = [
        'content-encoding',
        'content-length',
        'transfer-encoding'
    ];

    try {
        let externalURL = '';

        const pathHeader = req.headers['x-risu-node-path'];
        if (pathHeader) {
            const decodedPath = decodeURIComponent(pathHeader);
            externalURL = decodedPath;
        } else {
            const pathAndQuery = req.originalUrl.replace(/^\/hub-proxy/, '');
            externalURL = hubURL + pathAndQuery;
        }
        
        const headersToSend = { ...req.headers };
        delete headersToSend.host;
        delete headersToSend.connection;
        delete headersToSend['content-length'];
        delete headersToSend['x-risu-node-path'];

        const hubOrigin = new URL(hubURL).origin;
        headersToSend.origin = hubOrigin;

        //if Authorization header is "Server-Auth, set the token to be Server-Auth
        if(headersToSend['Authorization'] === 'X-Node-Server-Auth'){
            //this requires password auth
            const authHeader = req.headers['risu-auth'];
            if(!authHeader || authHeader.trim() !== password.trim()){
                console.log('incorrect', 'received:', authHeader, 'expected:', password)
                throw new Error('Incorrect password for server auth');
            }

            headersToSend['Authorization'] = "Bearer " + await getSionywAccessToken();
            delete headersToSend['risu-auth'];
        }
        
        
        const response = await fetch(externalURL, {
            method: req.method,
            headers: headersToSend,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
            redirect: 'manual',
            duplex: 'half'
        });
        
        for (const [key, value] of response.headers.entries()) {
            // Skip encoding-related headers to prevent double decoding
            if (excludedHeaders.includes(key.toLowerCase())) {
                continue;
            }
            res.setHeader(key, value);
        }
        res.status(response.status);

        if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
            const redirectUrl = response.headers.get('location');
            const newHeaders = { ...headersToSend };
            const redirectResponse = await fetch(redirectUrl, {
                method: req.method,
                headers: newHeaders,
                body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
                redirect: 'manual',
                duplex: 'half'
            });
            for (const [key, value] of redirectResponse.headers.entries()) {
                if (excludedHeaders.includes(key.toLowerCase())) {
                    continue;
                }
                res.setHeader(key, value);
            }
            res.status(redirectResponse.status);
            if (redirectResponse.body) {
                await pipeline(redirectResponse.body, res);
            } else {
                res.end();
            }
            return;
        }
        
        if (response.body) {
            await pipeline(response.body, res);
        } else {
            res.end();
        }
        
    } catch (error) {
        console.error("[Hub Proxy] Error:", error);
        if (!res.headersSent) {
            res.status(502).send({ error: 'Proxy request failed: ' + error.message });
        } else {
            res.end();
        }
    }
}

app.get('/proxy', reverseProxyFunc_get);
app.get('/proxy2', reverseProxyFunc_get);
app.get('/hub-proxy/*', hubProxyFunc);

app.post('/proxy', reverseProxyFunc);
app.post('/proxy2', reverseProxyFunc);
app.post('/hub-proxy/*', hubProxyFunc);

app.get('/api/password', async(req, res)=> {
    if(password === ''){
        res.send({status: 'unset'})
    }
    else if(req.headers['risu-auth']  === password){
        res.send({status:'correct'})
    }
    else{
        res.send({status:'incorrect'})
    }
})

app.post('/api/crypto', async (req, res) => {
    try {
        const hash = crypto.createHash('sha256')
        hash.update(Buffer.from(req.body.data, 'utf-8'))
        res.send(hash.digest('hex'))
    } catch (error) {
        next(error)
    }
})


app.post('/api/set_password', async (req, res) => {
    if(password === ''){
        password = req.body.password
        writeFileSync(passwordPath, password, 'utf-8')
    }
    res.status(400).send("already set")
})

app.get('/api/read', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        console.log('incorrect')
        res.status(400).send({
            error:'Password Incorrect'
        });
        return
    }
    const filePath = req.headers['file-path'];
    if (!filePath) {
        console.log('no path')
        res.status(400).send({
            error:'File path required'
        });
        return;
    }

    if(!isHex(filePath)){
        res.status(400).send({
            error:'Invaild Path'
        });
        return;
    }
    try {
        if(!existsSync(path.join(savePath, filePath))){
            res.send();
        }
        else{
            res.setHeader('Content-Type','application/octet-stream');
            res.sendFile(path.join(savePath, filePath));
        }
    } catch (error) {
        next(error);
    }
});

app.get('/api/remove', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        console.log('incorrect')
        res.status(400).send({
            error:'Password Incorrect'
        });
        return
    }
    const filePath = req.headers['file-path'];
    if (!filePath) {
        res.status(400).send({
            error:'File path required'
        });
        return;
    }
    if(!isHex(filePath)){
        res.status(400).send({
            error:'Invaild Path'
        });
        return;
    }

    try {
        const fullPath = path.join(savePath, filePath);
        // Check if file exists before trying to delete
        if (existsSync(fullPath)) {
            await fs.rm(fullPath);
        }
        // Return success even if file doesn't exist (idempotent delete)
        res.send({
            success: true,
        });
    } catch (error) {
        next(error);
    }
});

app.get('/api/list', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        console.log('incorrect')
        res.status(400).send({
            error:'Password Incorrect'
        });
        return
    }
    try {
        const data = (await fs.readdir(path.join(savePath))).map((v) => {
            return Buffer.from(v, 'hex').toString('utf-8')
        })
        res.send({
            success: true,
            content: data
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/write', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        console.log('incorrect')
        res.status(400).send({
            error:'Password Incorrect'
        });
        return
    }
    const filePath = req.headers['file-path'];
    const fileContent = req.body
    if (!filePath || !fileContent) {
        res.status(400).send({
            error:'File path required'
        });
        return;
    }
    if(!isHex(filePath)){
        res.status(400).send({
            error:'Invaild Path'
        });
        return;
    }

    try {
        await fs.writeFile(path.join(savePath, filePath), fileContent);
        res.send({
            success: true
        });
    } catch (error) {
        next(error);
    }
});

// Write text/JSON data directly as UTF-8, avoiding client-side TextEncoder.encode()
app.post('/api/write_text', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        console.log('incorrect')
        res.status(400).send({
            error:'Password Incorrect'
        });
        return
    }
    const filePath = req.headers['file-path'];
    const textContent = req.body
    if (!filePath || !textContent) {
        res.status(400).send({
            error:'File path required'
        });
        return;
    }
    if(!isHex(filePath)){
        res.status(400).send({
            error:'Invaild Path'
        });
        return;
    }

    try {
        await fs.writeFile(path.join(savePath, filePath), textContent, 'utf-8');
        res.send({
            success: true
        });
    } catch (error) {
        next(error);
    }
});

// --- Server-side DB helpers ---
// Shared logic for decoding database.bin, character splitting,
// and cold storage operations.

const dbMagicHeader = Buffer.from([0, 82, 73, 83, 85, 83, 65, 86, 69, 0, 7]);
const dbMagicCompressedHeader = Buffer.from([0, 82, 73, 83, 85, 83, 65, 86, 69, 0, 8]);
const dbMagicStreamCompressedHeader = Buffer.from([0, 82, 73, 83, 85, 83, 65, 86, 69, 0, 9]);
const dbMagicRisuSaveHeader = Buffer.from('RISUSAVE\0');

const RISUSAVE_TYPE_CHARACTER_WITH_CHAT = 2;
const RISUSAVE_TYPE_REMOTE = 6;

const coldStorageHeader = '\uEF01COLDSTORAGE\uEF01';

function checkDbHeader(data) {
    if (data.length < dbMagicHeader.length) return 'none';
    if (data.subarray(0, dbMagicHeader.length).equals(dbMagicHeader)) return 'raw';
    if (data.subarray(0, dbMagicCompressedHeader.length).equals(dbMagicCompressedHeader)) return 'compressed';
    if (data.subarray(0, dbMagicStreamCompressedHeader.length).equals(dbMagicStreamCompressedHeader)) return 'stream';
    if (data.subarray(0, dbMagicRisuSaveHeader.length).equals(dbMagicRisuSaveHeader)) return 'risusave';
    return 'none';
}

function getDbFilePath() {
    const dbHexPath = Buffer.from('database/database.bin', 'utf-8').toString('hex');
    return path.join(savePath, dbHexPath);
}

// Decode database.bin into a full database object with characters array
async function decodeFullDatabase(rawData) {
    const header = checkDbHeader(rawData);

    if (header === 'risusave') {
        return decodeRisuSaveFullDatabase(rawData);
    }

    const unpackr = new Unpackr({ int64AsType: 'number', useRecords: false });
    let decoded;

    switch(header) {
        case 'raw':
            decoded = unpackr.decode(rawData.subarray(dbMagicHeader.length));
            break;
        case 'compressed':
            decoded = unpackr.decode(fflate.decompressSync(rawData.subarray(dbMagicCompressedHeader.length)));
            break;
        case 'stream': {
            const decompressed = await gunzipAsync(rawData.subarray(dbMagicStreamCompressedHeader.length));
            decoded = unpackr.decode(decompressed);
            break;
        }
        default:
            decoded = unpackr.decode(rawData);
    }

    return decoded;
}

function decodeRisuSaveFullDatabase(data) {
    let offset = dbMagicRisuSaveHeader.length;
    const characters = [];

    while (offset < data.length) {
        try {
            const type = data[offset];
            const compression = data[offset + 1] === 1;
            offset += 2;

            const nameLength = data[offset];
            offset += 1;
            const name = data.subarray(offset, offset + nameLength).toString('utf-8');
            offset += nameLength;

            const lengthBuf = Buffer.alloc(4);
            data.copy(lengthBuf, 0, offset, offset + 4);
            const blockLength = lengthBuf.readUInt32LE(0);
            offset += 4;

            let blockData = data.subarray(offset, offset + blockLength);
            offset += blockLength;

            if (compression) {
                blockData = zlib.gunzipSync(blockData);
            }

            if (type === RISUSAVE_TYPE_CHARACTER_WITH_CHAT) {
                const content = blockData.toString('utf-8');
                try {
                    const parsed = JSON.parse(content);
                    if (parsed.chaId) characters.push(parsed);
                } catch(e) { /* skip malformed */ }
            }
            else if (type === RISUSAVE_TYPE_REMOTE) {
                try {
                    const remoteInfo = JSON.parse(blockData.toString('utf-8'));
                    if (remoteInfo.type === RISUSAVE_TYPE_CHARACTER_WITH_CHAT && remoteInfo.name) {
                        // Read full character data from remote file
                        const remoteFileName = `remotes/${remoteInfo.name}.local.bin`;
                        const hexPath = Buffer.from(remoteFileName, 'utf-8').toString('hex');
                        const fullPath = path.join(savePath, hexPath);
                        if (existsSync(fullPath)) {
                            const content = readFileSync(fullPath, 'utf-8');
                            const parsed = JSON.parse(content);
                            if (parsed.chaId) characters.push(parsed);
                        }
                    }
                } catch(e) { /* skip */ }
            }
        } catch(e) {
            break;
        }
    }

    return { characters };
}

function writeCharRemoteFile(chaId, jsonStr) {
    const remoteFileName = `remotes/${chaId}.local.bin`;
    const hexPath = Buffer.from(remoteFileName, 'utf-8').toString('hex');
    const fullPath = path.join(savePath, hexPath);
    if (!existsSync(fullPath)) {
        writeFileSync(fullPath, jsonStr, 'utf-8');
    }
    return chaId;
}

// --- Cold storage file operations ---

function coldStorageFilePath(key) {
    const fileName = `coldstorage/${key}`;
    const hexPath = Buffer.from(fileName, 'utf-8').toString('hex');
    return path.join(savePath, hexPath);
}

function writeColdStorageFile(key, jsonStr) {
    const compressed = fflate.compressSync(Buffer.from(jsonStr, 'utf-8'));
    writeFileSync(coldStorageFilePath(key), Buffer.from(compressed));
}

function readColdStorageRaw(key) {
    const fullPath = coldStorageFilePath(key);
    if (!existsSync(fullPath)) return null;
    const data = readFileSync(fullPath);
    return fflate.decompressSync(new Uint8Array(data));
}

app.post('/api/split_db_characters', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        res.status(400).send({ error: 'Password Incorrect' });
        return;
    }

    try {
        const dbFilePath = getDbFilePath();

        if (!existsSync(dbFilePath)) {
            res.status(404).send({ error: 'Database not found' });
            return;
        }

        const rawData = await fs.readFile(dbFilePath);
        const db = await decodeFullDatabase(rawData);
        const chaIds = [];

        if (db?.characters) {
            for (const character of db.characters) {
                if (character?.chaId) {
                    writeCharRemoteFile(character.chaId, JSON.stringify(character));
                    chaIds.push(character.chaId);
                }
            }
        }

        console.log(`[Server] Split ${chaIds.length} characters into remote files`);
        res.send({ success: true, chaIds });
    } catch (error) {
        console.error('[Server] Error splitting database:', error);
        next(error);
    }
});

// --- Server-side cold storage creation ---
// Reads database.bin, finds chats older than 30 days, compresses them
// into cold storage files, and returns which chats were cold-stored.
// The client only needs to apply the pointer changes to its in-memory DB.
app.post('/api/make_cold_data', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        res.status(400).send({ error: 'Password Incorrect' });
        return;
    }

    try {
        const dbFilePath = getDbFilePath();

        if (!existsSync(dbFilePath)) {
            res.status(404).send({ error: 'Database not found' });
            return;
        }

        const rawData = await fs.readFile(dbFilePath);
        const db = await decodeFullDatabase(rawData);

        if (!db?.characters) {
            res.send({ success: true, changes: [] });
            return;
        }

        const currentTime = Date.now();
        const coldTime = currentTime - 1000 * 60 * 60 * 24 * 30; // 30 days
        const changes = [];

        for (let i = 0; i < db.characters.length; i++) {
            const character = db.characters[i];
            if (!character?.chats) continue;

            for (let j = 0; j < character.chats.length; j++) {
                const chat = character.chats[j];

                if (!chat.message || chat.message.length < 4) continue;
                if (chat.message?.[0]?.data?.startsWith(coldStorageHeader)) continue;

                let greatestTime = chat.lastDate ?? 0;
                for (const msg of chat.message) {
                    if (msg.time && msg.time > greatestTime) {
                        greatestTime = msg.time;
                    }
                }

                if (greatestTime >= coldTime) continue;

                const id = crypto.randomUUID();
                const coldData = {
                    message: chat.message,
                    hypaV2Data: chat.hypaV2Data,
                    hypaV3Data: chat.hypaV3Data,
                    scriptstate: chat.scriptstate,
                    localLore: chat.localLore
                };

                try {
                    writeColdStorageFile(id, JSON.stringify(coldData));

                    // Verify the written data can be read back
                    const verified = readColdStorageRaw(id);
                    if (!verified) continue;
                    const parsed = JSON.parse(Buffer.from(verified).toString('utf-8'));
                    if (!parsed || (!Array.isArray(parsed) && !parsed.message)) continue;

                    changes.push({
                        chaId: character.chaId,
                        chatIndex: j,
                        coldKey: id,
                        // Verification metadata so the client can confirm
                        // the chat at this index matches what was cold-stored
                        msgCount: chat.message.length,
                        firstMsgTime: chat.message[0]?.time ?? 0
                    });
                } catch(e) {
                    console.error(`[Server] Cold storage write failed for chat ${j} in character ${character.chaId}:`, e);
                }
            }
        }

        console.log(`[Server] Created ${changes.length} cold storage entries`);
        res.send({ success: true, changes });
    } catch (error) {
        console.error('[Server] Error creating cold data:', error);
        next(error);
    }
});

// --- Server-side cold storage retrieval ---
// Reads a cold storage file, decompresses it on the server,
// and returns JSON directly so the client avoids fflate decompression.
app.post('/api/get_cold_storage', async (req, res, next) => {
    if(req.headers['risu-auth'].trim() !== password.trim()){
        res.status(400).send({ error: 'Password Incorrect' });
        return;
    }

    const key = req.headers['x-cold-key'];
    if (!key) {
        res.status(400).send({ error: 'Key required' });
        return;
    }

    try {
        const decompressed = readColdStorageRaw(key);
        if (!decompressed) {
            res.status(404).send({ error: 'Cold storage item not found' });
            return;
        }

        // Write access metadata (fire-and-forget)
        try {
            writeColdStorageFile(key + '_accessMeta', JSON.stringify({ lastAccess: Date.now() }));
        } catch(e) { /* non-critical */ }

        // Send decompressed JSON directly without re-parsing
        res.setHeader('Content-Type', 'application/json');
        res.send(Buffer.from(decompressed));
    } catch (error) {
        console.error('[Server] Error reading cold storage:', error);
        next(error);
    }
});

const oauthData = {
    client_id: '',
    client_secret: '',
    config: {},
    code_verifier: ''

}
app.get('/api/oauth_login', async (req, res) => {
    const redirect_uri = (new URL (req.url)).host + '/api/oauth_callback'

    if(!redirect_uri){
        res.status(400).send({ error: 'redirect_uri is required' });
        return
    }
    if(!oauthData.client_id || !oauthData.client_secret){
        const discovery = await openid.discovery('https://account.sionyw.com/','','');
        oauthData.config = discovery;

        //oauth dynamic client registration
        //https://datatracker.ietf.org/doc/html/rfc7591

        const serverMeta = discovery.serverMetadata()
        //since we can't find a good library to do this, we will do it manually
        const registrationResponse = await fetch(serverMeta.registration_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (serverMeta.registration_access_token || '')
            },
            body: JSON.stringify({
                client_id: oauthData.client_id,
                client_secret: oauthData.client_secret,
                redirect_uris: [redirect_uri],
                response_types: ['code'],
                grant_types: ['authorization_code'],
                scope: 'risuai',
                token_endpoint_auth_method: 'client_secret_basic',
                client_name: 'Risuai Node Server',
            })
        });

        if(registrationResponse.status === 201 || registrationResponse.status === 200){
            const registrationData = await registrationResponse.json();
            oauthData.client_id = registrationData.client_id;
            oauthData.client_secret = registrationData.client_secret;
            discovery.clientMetadata().client_id = oauthData.client_id;
            discovery.clientMetadata().client_secret = oauthData.client_secret;
        }
        else{
            console.error('[Server] OAuth2 dynamic client registration failed:', registrationResponse.statusText);
            res.status(500).send({ error: 'OAuth2 client registration failed' });
            return
        }


        //now lets request

        let code_verifier = openid.randomPKCECodeVerifier();
        let code_challenge = await openid.calculatePKCECodeChallenge(code_verifier);

        oauthData.code_verifier = code_verifier;
        let redirectTo = openid.buildAuthorizationUrl(oauthData.config, {
            redirect_uri,
            code_challenge,
            code_challenge_method: 'S256',
            scope: 'risuai',
        })

        res.redirect(redirectTo.toString());

        return;

    }
    
    res.status(500).send({ error: 'OAuth2 login failed' });
});

app.get('/api/oauth_callback', async (req, res) => {

    //since this is a callback we don't need to check password

    const params = (new URL(req.url, `http://${req.headers.host}`)).searchParams;
    const code = params.get('code');

    if(!code){
        res.status(400).send({ error: 'code is required' });
        return
    }
    if(!oauthData.client_id || !oauthData.client_secret || !oauthData.code_verifier){
        res.status(400).send({ error: 'OAuth2 not initialized' });
        return
    }

    let tokens = await openid.authorizationCodeGrant(
        oauthData.config,   
        getCurrentUrl(),
        {
            pkceCodeVerifier: oauthData.code_verifier,
        },
    )

    fs.writeFileSync(authCodePath, tokens.access_token, 'utf-8')

    res.send(tokens)
            
})

async function getHttpsOptions() {

    const keyPath = path.join(sslPath, 'server.key');
    const certPath = path.join(sslPath, 'server.crt');

    try {
 
        await fs.access(keyPath);
        await fs.access(certPath);

        const [key, cert] = await Promise.all([
            fs.readFile(keyPath),
            fs.readFile(certPath)
        ]);
       
        return { key, cert };

    } catch (error) {
        console.error('[Server] SSL setup errors:', error.message);
        console.log('[Server] Start the server with HTTP instead of HTTPS...');
        return null;
    }
}

async function startServer() {
    try {
      
        const port = process.env.PORT || 6001;
        const httpsOptions = await getHttpsOptions();

        if (httpsOptions) {
            // HTTPS
            https.createServer(httpsOptions, app).listen(port, () => {
                console.log("[Server] HTTPS server is running.");
                console.log(`[Server] https://localhost:${port}/`);
            });
        } else {
            // HTTP
            app.listen(port, () => {
                console.log("[Server] HTTP server is running.");
                console.log(`[Server] http://localhost:${port}/`);
            });
        }
    } catch (error) {
        console.error('[Server] Failed to start server :', error);
        process.exit(1);
    }
}

(async () => {
    await startServer();
})();
