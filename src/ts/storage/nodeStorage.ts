import { language } from "src/lang"
import { alertInput } from "../alert"

let auth:string = null
let authChecked = false

export class NodeStorage{
    async setItem(key:string, value:Uint8Array) {
        await this.checkAuth()

        const CHUNK_THRESHOLD = 100 * 1024 * 1024; // 100MB
        const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk
        const MAX_RETRIES = 3; // Maximum retry attempts per chunk

        // If file is larger than 100MB, use chunked upload
        if (value.byteLength > CHUNK_THRESHOLD) {
            const totalChunks = Math.ceil(value.byteLength / CHUNK_SIZE);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, value.byteLength);
                const chunk = value.slice(start, end);

                // Retry logic for each chunk
                let trys = 0;
                while (true) {
                    try {
                        const da = await fetch('/api/write', {
                            method: "POST",
                            body: chunk,
                            headers: {
                                'content-type': 'application/octet-stream',
                                'file-path': Buffer.from(key, 'utf-8').toString('hex'),
                                'chunk-index': i.toString(),
                                'total-chunks': totalChunks.toString(),
                                'risu-auth': auth
                            }
                        });

                        if(da.status >= 200 && da.status < 300){
                            const data = await da.json()
                            if(!data.error){
                                break; // Success, move to next chunk
                            }
                        }

                        // Failed, check if we should retry
                        trys += 1;
                        if (trys > MAX_RETRIES) {
                            throw "setItem Error (chunk " + i + " failed after " + MAX_RETRIES + " retries)"
                        }

                        // Wait before retry (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, 1000 * trys));
                    } catch (error) {
                        trys += 1;
                        if (trys > MAX_RETRIES) {
                            throw "setItem Error (chunk " + i + "): " + error
                        }
                        // Wait before retry (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, 1000 * trys));
                    }
                }
            }
        } else {
            // Regular single upload for files under 100MB with retry logic
            let trys = 0;
            while (true) {
                try {
                    const da = await fetch('/api/write', {
                        method: "POST",
                        body: value,
                        headers: {
                            'content-type': 'application/octet-stream',
                            'file-path': Buffer.from(key, 'utf-8').toString('hex'),
                            'risu-auth': auth
                        }
                    })

                    if(da.status >= 200 && da.status < 300){
                        const data = await da.json()
                        if(!data.error){
                            return; // Success
                        }
                    }

                    // Failed, check if we should retry
                    trys += 1;
                    if (trys > MAX_RETRIES) {
                        throw "setItem Error (failed after " + MAX_RETRIES + " retries)"
                    }

                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * trys));
                } catch (error) {
                    trys += 1;
                    if (trys > MAX_RETRIES) {
                        throw "setItem Error: " + error
                    }
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * trys));
                }
            }
        }
    }
    async getItem(key:string):Promise<Buffer> {
        await this.checkAuth()
        const da = await fetch('/api/read', {
            method: "GET",
            headers: {
                'file-path': Buffer.from(key, 'utf-8').toString('hex'),
                'risu-auth': auth
            }
        })
        if(da.status < 200 || da.status >= 300){
            throw "getItem Error"
        }

        const data = Buffer.from(await da.arrayBuffer())
        if (data.length == 0){
            return null
        }
        return data
    }
    async keys():Promise<string[]>{
        await this.checkAuth()
        const da = await fetch('/api/list', {
            method: "GET",
            headers:{
                'risu-auth': auth
            }
        })
        const data = await da.json()
        if(da.status < 200 || da.status >= 300){
            throw "listItem Error"
        }
        if(data.error){
            throw data.error
        }
        return data.content
    }
    async removeItem(key:string){
        await this.checkAuth()
        const da = await fetch('/api/remove', {
            method: "GET",
            headers: {
                'file-path': Buffer.from(key, 'utf-8').toString('hex'),
                'risu-auth': auth
            }
        })
        if(da.status < 200 || da.status >= 300){
            throw "removeItem Error"
        }
        const data = await da.json()
        if(data.error){
            throw data.error
        }
    }

    private async checkAuth(){
        if(!auth){
            auth = localStorage.getItem('risuauth')
        }

        if(!authChecked){
            const data = await (await fetch('/api/password',{
                headers: {
                    'risu-auth': auth ?? ''
                }
            })).json()

            if(data.status === 'unset'){
                const input = await digestPassword(await alertInput(language.setNodePassword))
                await fetch('/api/set_password',{
                    method: "POST",
                    body:JSON.stringify({
                        password: input 
                    }),
                    headers: {
                        'content-type': 'application/json'
                    }
                })
                auth = input
                localStorage.setItem('risuauth', auth)
            }
            else if(data.status === 'incorrect'){
                while(true){
                    const input = await digestPassword(await alertInput(language.inputNodePassword))
                    const data = await (await fetch('/api/password',{
                        headers: {
                            'risu-auth': input ?? ''
                        }
                    })).json()
                    if(data.status !== 'unset'){
                        auth = input
                        localStorage.setItem('risuauth', auth)
                        await this.checkAuth()
                        break
                    }
                }
            }
            else{
                authChecked = true
            }
        }
    }


    listItem = this.keys
}

async function digestPassword(message:string) {
    const crypt = await (await fetch('/api/crypto', {
        body: JSON.stringify({
            data: message
        }),
        headers: {
            'content-type': 'application/json'
        },
        method: "POST"
    })).text()
    
    return crypt;
}