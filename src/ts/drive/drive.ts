import { alertError, alertInput, alertNormal, alertSelect, alertStore } from "../alert";
import { getDatabase, setDatabase, type Database } from "../storage/database.svelte";
import { forageStorage, getUnpargeables, isTauri, openURL } from "../globalApi.svelte";
import { BaseDirectory, exists, readFile, readDir, writeFile } from "@tauri-apps/plugin-fs";
import { language } from "../../lang";
import { relaunch } from '@tauri-apps/plugin-process';
import { sleep } from "../util";
import { hubURL } from "../characterCards";
import { decodeRisuSave, encodeRisuSaveLegacy } from "../storage/risuSave";

/**
 * Refresh token을 사용해 새로운 access token을 받습니다
 */
async function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string,
    expires_in: number
} | null> {
    try {
        const response = await fetch('/drive/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        })

        if (response.ok) {
            const json = await response.json()
            return json
        } else {
            console.error('Failed to refresh token:', await response.text())
            return null
        }
    } catch (error) {
        console.error('Error refreshing token:', error)
        return null
    }
}

/**
 * 유효한 access token을 반환합니다.
 * 만료되었으면 refresh token으로 자동 갱신합니다.
 * 갱신 실패 시 null을 반환합니다.
 */
async function getValidAccessToken(): Promise<string | null> {
    const db = getDatabase()
    const now = Date.now()

    // Access token이 없거나 만료되었는지 확인 (5분 여유를 둠)
    const isExpired = !db.google.accessToken ||
                     !db.google.tokenExpiresAt ||
                     db.google.tokenExpiresAt < now + (5 * 60 * 1000)

    if (isExpired) {
        // Refresh token이 있으면 갱신 시도
        if (db.google.refreshToken) {
            console.log('Access token expired or missing, refreshing...')
            const newToken = await refreshAccessToken(db.google.refreshToken)

            if (newToken) {
                // 새 토큰 저장
                db.google.accessToken = newToken.access_token
                db.google.tokenExpiresAt = Date.now() + (newToken.expires_in * 1000)
                setDatabase(db)
                console.log('Token refreshed successfully')
                return newToken.access_token
            } else {
                console.error('Failed to refresh token')
                return null
            }
        } else {
            console.error('No refresh token available')
            return null
        }
    }

    // 유효한 토큰이 있으면 그대로 반환
    return db.google.accessToken
}

export async function checkDriver(type:'save'|'load'|'loadtauri'|'savetauri'|'reftoken'){
    // 먼저 저장된 refresh token이 있는지 확인
    const db = getDatabase()
    const hasRefreshToken = !!db.google.refreshToken

    // refresh token이 있으면 재인증 없이 바로 실행
    if (hasRefreshToken && (type === 'save' || type === 'load' || type === 'loadtauri' || type === 'savetauri')) {
        try {
            if(type === 'save' || type === 'savetauri'){
                await backupDrive()  // 토큰 없이 호출하면 자동으로 getValidAccessToken 사용
            }
            else if(type === 'load' || type === 'loadtauri'){
                await loadDrive(null, 'backup')
            }
            return
        } catch (error) {
            console.error('Error using stored token:', error)
            alertError('Stored token failed. Re-authenticating...')
            // 실패하면 아래 OAuth 인증으로 계속 진행
        }
    }

    // OAuth 인증 진행
    const CLIENT_ID = '580075990041-l26k2d3c0nemmqiu3d3aag01npfrkn76.apps.googleusercontent.com';
    const REDIRECT_URI = type === 'reftoken' ? 'https://sv.risuai.xyz/drive' : "https://risuai.xyz/"
    const SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';
    const encodedRedirectUri = encodeURIComponent(REDIRECT_URI);
    // reftoken 타입은 state를 "accesstauri"로 설정해야 함
    const state = type === 'reftoken' ? 'accesstauri' : type
    const authorizationUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodedRedirectUri}&scope=${SCOPE}&response_type=code&state=${state}&access_type=offline&prompt=consent`;


    if(type === 'reftoken'){
        return authorizationUrl
    }

    if(type === 'save' || type === 'load'){
        location.href = (authorizationUrl);
    }
    else{

        try {
            if(isTauri){
                openURL(authorizationUrl)
            }
            else{
                window.open(authorizationUrl)
            }
            let code = await alertInput(language.pasteAuthCode)
            if(code.includes(' ')){
                code = code.substring(code.lastIndexOf(' ')).trim()
            }

            // Tauri에서도 코드를 토큰으로 교환하고 저장
            try {
                const res = await fetch(`/drive?code=${encodeURIComponent(code)}`)
                if(res.status >= 200 && res.status < 300){
                    const json:{
                        access_token:string,
                        expires_in:number,
                        refresh_token?:string
                    } = await res.json()

                    // 토큰을 데이터베이스에 저장
                    const db = getDatabase()
                    db.google.accessToken = json.access_token
                    db.google.tokenExpiresAt = Date.now() + (json.expires_in * 1000)
                    if(json.refresh_token){
                        db.google.refreshToken = json.refresh_token
                    }
                    setDatabase(db)

                    // 저장된 토큰으로 백업/로드 실행
                    if(type === 'loadtauri'){
                        await loadDrive(json.access_token, 'backup')
                    }
                    else{
                        await backupDrive(json.access_token)
                    }
                } else {
                    throw new Error(await res.text())
                }
            } catch (exchangeError) {
                console.error('Failed to exchange code for token:', exchangeError)
                alertError(`Failed to get access token: ${exchangeError}`)
            }
        } catch (error) {
            console.error(error)
            alertError(`Backup Error: ${error}`)
        }
    }
}


export async function checkDriverInit() {
    try {
        const loc = new URLSearchParams(location.search)
        const code = loc.get('code')
    
        if(code){
            const res = await fetch(`/drive?code=${encodeURIComponent(code)}`)
            if(res.status >= 200 && res.status < 300){
                const json:{
                    access_token:string,
                    expires_in:number,
                    refresh_token?:string
                } = await res.json()

                // 토큰을 데이터베이스에 저장
                const db = getDatabase()
                // access_token과 만료시간은 항상 업데이트
                db.google.accessToken = json.access_token
                db.google.tokenExpiresAt = Date.now() + (json.expires_in * 1000)
                // refresh_token은 있을 때만 업데이트 (Google은 처음 인증 시에만 제공)
                if(json.refresh_token){
                    db.google.refreshToken = json.refresh_token
                }
                setDatabase(db)

                const da = loc.get('state')
                if(da === 'save'){
                    await backupDrive(json.access_token)
                }
                else if(da === 'load'){
                    await loadDrive(json.access_token, 'backup')
                }
                else if(da === 'savetauri' || da === 'loadtauri'){
                    alertStore.set({
                        type: 'wait2',
                        msg: `Copy and paste this Auth Code: ${json.access_token}`
                    })
                }
                else if(da === 'accesstauri'){
                    alertStore.set({
                        type: 'wait2',
                        msg: JSON.stringify(json)
                    })
                }
            }
            else{
                alertError(await res.text())
                location.search = ''
            }
            return true
        }
        else{
            return false
        }   
    } catch (error) {
        console.error(error)
        alertError(`Backup Error: ${error}`)
        const currentURL = new URL(location.href)
        currentURL.search = ''
        window.history.replaceState( {} , "", currentURL.href );
        await sleep(100000)
        return false
    }
}

let lastSaved:number = parseInt(localStorage.getItem('risu_lastsaved') ?? '-1')
let BackupDb:Database = null


export async function syncDrive() {
    BackupDb = safeStructuredClone(getDatabase())
    return
}


async function backupDrive(ACCESS_TOKEN?:string) {
    // 매개변수로 토큰이 전달되지 않으면 저장된 토큰 사용 (자동 갱신)
    let token = ACCESS_TOKEN
    if (!token) {
        token = await getValidAccessToken()
        if (!token) {
            alertError('Failed to get valid access token. Please re-authenticate.')
            return
        }
    }

    alertStore.set({
        type: "wait",
        msg: "Uploading Backup..."
    })

    //check backup data is corrupted
    const corrupted = await fetch(hubURL + '/backupcheck', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(getDatabase()),
    })
    if(corrupted.status === 400){
        alertError('Failed, Backup data is corrupted')
        return
    }

    // 파일 목록 조회 전 토큰 체크 및 갱신
    token = await getValidAccessToken() || token
    const files:DriveFile[] = await getFilesInFolder(token)

    const fileNames = files.map((d) => {
        return d.name
    })

    if(isTauri){
        const assets = await readDir('assets', {baseDir: BaseDirectory.AppData})
        let i = 0;
        for(let asset of assets){
            i += 1;
            alertStore.set({
                type: "wait",
                msg: `Uploading Backup... (${i} / ${assets.length})`
            })
            const key = asset.name
            if(!key || !key.endsWith('.png')){
                continue
            }
            const formatedKey = newFormatKeys(key)
            if(!fileNames.includes(formatedKey)){
                // 각 파일 업로드 전 토큰 체크 및 갱신
                token = await getValidAccessToken() || token
                await createFileInFolder(token, formatedKey, await readFile('assets/' + asset.name, {baseDir: BaseDirectory.AppData}))
            }
        }
    }
    else{
        const keys = await forageStorage.keys()

        for(let i=0;i<keys.length;i++){
            alertStore.set({
                type: "wait",
                msg: `Uploading Backup... (${i} / ${keys.length})`
            })
            const key = keys[i]
            if(!key.endsWith('.png')){
                continue
            }
            const formatedKey = newFormatKeys(key)
            if(!fileNames.includes(formatedKey)){
                // 각 파일 업로드 전 토큰 체크 및 갱신
                token = await getValidAccessToken() || token
                await createFileInFolder(token, formatedKey, await forageStorage.getItem(key) as unknown as Uint8Array)
            }
        }
    }

    const dbData = encodeRisuSaveLegacy(getDatabase(), 'compression')

    alertStore.set({
        type: "wait",
        msg: `Uploading Backup... (Saving database)`
    })

    // 데이터베이스 업로드 전 토큰 체크 및 갱신
    token = await getValidAccessToken() || token
    await createFileInFolder(token, `${(Date.now() / 1000).toFixed(0)}-database.risudat`, dbData)


    alertNormal('Success')
}

type DriveFile = {
    mimeType:string
    name:string
    id: string
}

async function loadDrive(ACCESS_TOKEN:string|null, mode: 'backup'|'sync'):Promise<void|"noSync"> {
    // 매개변수로 토큰이 전달되지 않으면 저장된 토큰 사용 (자동 갱신)
    let token = ACCESS_TOKEN
    if (!token) {
        token = await getValidAccessToken()
        if (!token) {
            alertError('Failed to get valid access token. Please re-authenticate.')
            return
        }
    }

    if(mode === 'backup'){
        alertStore.set({
            type: "wait",
            msg: "Loading Backup..."
        })
    }

    // 파일 목록 조회 전 토큰 체크 및 갱신
    token = await getValidAccessToken() || token
    const files:DriveFile[] = await getFilesInFolder(token)
    let foragekeys:string[] = []
    let loadedForageKeys = false
    let db = getDatabase()

    async function checkImageExists(images:string) {
        if(db?.account?.useSync){
            return false
        }
        if(isTauri){
            return await exists(`assets/` + images, {baseDir: BaseDirectory.AppData})
        }
        else{
            if(!loadedForageKeys){
                foragekeys = await forageStorage.keys()
                loadedForageKeys = true
            }
            return foragekeys.includes('assets/' + images)
        }
    }
    const fileNames = files.map((d) => {
        return d.name
    })


    let dbs:[DriveFile,number][] = []
    let noSyncData = true

    if(mode === 'backup'){
        for(const f of files){
            if(f.name.endsWith("-database.risudat")){
                const tm = parseInt(f.name.split('-')[0])
                if(isNaN(tm)){
                    continue
                }
                else{
                    dbs.push([f,tm])
                }
            }
        }
        dbs.sort((a,b) => {
            return b[1] - a[1]
        })
    }
    else if(mode === 'sync'){
        for(const f of files){
            if(f.name.endsWith("-database.risudat2")){
                const tm = parseInt(f.name.split('-')[0])
                if(isNaN(tm)){
                    continue
                }
                else{
                    if(tm > lastSaved){
                        dbs.push([f,tm])
                    }
                    noSyncData = false
                }
            }
        }
        dbs.sort((a,b) => {
            return b[1] - a[1]
        })
    }

    if(noSyncData && mode === 'sync'){
        return 'noSync'
    }

    if(dbs.length !== 0){
        if(mode === 'sync'){
            alertStore.set({
                type: "wait",
                msg: "Sync Data..."
            })
        }
        async function getDbFromList(){
            let selectables:string[] = []
            for(let i=0;i<dbs.length;i++){
                selectables.push(`Backup saved in ${(new Date(dbs[i][1] * 1000)).toLocaleString()}`)
                if(selectables.length > 7){
                    break
                }
            }
            const selectedIndex = (await alertSelect([language.loadLatest, language.loadOthers]) === '0') ? 0 : parseInt(await alertSelect(selectables))
            const selectedDb = dbs[selectedIndex][0]
            // 데이터베이스 파일 다운로드 전 토큰 체크 및 갱신
            token = await getValidAccessToken() || token
            const decompressedDb:Database = await decodeRisuSave(await getFileData(token, selectedDb.id))
            return decompressedDb
        }

        // 데이터베이스 파일 다운로드 전 토큰 체크 및 갱신
        token = await getValidAccessToken() || token
        const db:Database = mode === 'backup' ? await getDbFromList() : JSON.parse(Buffer.from(await getFileData(token, dbs[0][0].id)).toString('utf-8'))
        lastSaved = Date.now()
        localStorage.setItem('risu_lastsaved', `${lastSaved}`)
        const requiredImages = (getUnpargeables(db))
        let ind = 0;
        let errorLogs:string[] = []
        for(const images of requiredImages){
            ind += 1
            for(let tries=0;tries<3;tries++){
                const formatedImage = tries === 0 ? newFormatKeys(images) : formatKeys(images)
                if(mode === 'sync'){
                    alertStore.set({
                        type: "wait",
                        msg: `Sync Files... (${ind} / ${requiredImages.length})`
                    })
                }
                else{
                    alertStore.set({
                        type: "wait",
                        msg: `Loading Backup... (${ind} / ${requiredImages.length})`
                    })
                }
                if(await checkImageExists(images)){
                    //skip process
                }
                else{
                    if(formatedImage.length >= 7){
                        if(fileNames.includes(formatedImage)){
                            for(const file of files){
                                if(file.name === formatedImage){
                                    // 각 파일 다운로드 전 토큰 체크 및 갱신
                                    token = await getValidAccessToken() || token
                                    const fData = await getFileData(token, file.id)
                                    if(isTauri){
                                        await writeFile(`assets/` + images, fData ,{baseDir: BaseDirectory.AppData})

                                    }
                                    else{
                                        await forageStorage.setItem('assets/' + images, fData)
                                    }
                                    tries = 3
                                }
                            }
                        }
                        else{
                            alertStore.set({
                                type: "wait",
                                msg: `Loading Backup... (${ind} / ${requiredImages.length}) (Error in ${formatedImage})`
                            })
                            await sleep(1000)
                        }
                    }
                }
            }
        }
        db.didFirstSetup = true
        const dbData = encodeRisuSaveLegacy(db, 'compression')

        if(isTauri){
            await writeFile('database/database.bin', dbData, {baseDir: BaseDirectory.AppData})
            relaunch()
            alertStore.set({
                type: "wait",
                msg: "Success, Refreshing your app."
            })
        }
        else{
            await forageStorage.setItem('database/database.bin', dbData)
            location.search = ''
            alertStore.set({
                type: "wait",
                msg: "Success, Refreshing your app."
            })
        }
    }
    else if(mode === 'backup'){
        location.search = ''
    }
}

function checkImageExist(image:string){

}


function formatKeys(name:string) {
    return getBasename(name).replace(/\_/g, '__').replace(/\./g,'_d').replace(/\//,'_s') + '.png'
}

function newFormatKeys(name:string) {
    let n = getBasename(name)
    const bf = Buffer.from(n).toString('hex')
    return n + '.bin'
}

async function getFilesInFolder(ACCESS_TOKEN:string, nextPageToken=''): Promise<DriveFile[]> {
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&pageSize=300` + nextPageToken;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
    
    if (response.ok) {
        const data = await response.json();
        if(data.nextPageToken){
            return (data.files as DriveFile[]).concat(await getFilesInFolder(ACCESS_TOKEN, `&pageToken=${data.nextPageToken}`))
        }
        return data.files as DriveFile[];
    } else {
        throw(`Error: ${response.status}`);
    }
}

async function createFileInFolder(accessToken:string, fileName:string, content:Uint8Array, mimeType = 'application/octet-stream') {
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: ["appDataFolder"],
    };
  
    const body = new FormData();
    body.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    body.append("file", new Blob([content], { type: mimeType }));
  
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: body,
      }
    );
  
    const result = await response.json();
  
    if (response.ok) {
      return result;
    } else {
      console.error("Error creating file:", result);
      throw new Error(result.error.message);
    }
}
  
const baseNameRegex = /\\/g
function getBasename(data:string){
    const splited = data.replace(baseNameRegex, '/').split('/')
    const lasts = splited[splited.length-1]
    return lasts
}

async function getFileData(ACCESS_TOKEN:string,fileId:string) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
    const request = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    };
  
    const response = await fetch(url, request);
  
    if (response.ok) {
      const data = new Uint8Array(await response.arrayBuffer());
      return data;
    } else {
        throw "Error in response when reading files in folder"
    }
  }