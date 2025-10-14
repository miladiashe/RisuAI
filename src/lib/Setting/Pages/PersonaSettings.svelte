<script lang="ts">
    import { language } from "src/lang";
    import BaseRoundedButton from "src/lib/UI/BaseRoundedButton.svelte";
    import Button from "src/lib/UI/GUI/Button.svelte";
    import Check from "src/lib/UI/GUI/CheckInput.svelte";
    import TextAreaInput from "src/lib/UI/GUI/TextAreaInput.svelte";
    import TextInput from "src/lib/UI/GUI/TextInput.svelte";
    import { alertConfirm, alertSelect } from "src/ts/alert";
    import { getCharImage } from "src/ts/characters";
    import { changeUserPersona, exportUserPersona, importUserPersona, saveUserPersona, selectUserImg } from "src/ts/persona";
    import { setDatabase, saveImage } from "src/ts/storage/database.svelte";
    import { selectSingleFile } from "src/ts/util";
    import { DBState } from 'src/ts/stores.svelte';
    import { getPersonaIndexObject } from "src/ts/util";
    import { checkPersonaOrder } from "src/ts/globalApi.svelte";
    import { get } from "svelte/store";
    import { v4 } from "uuid"
    import { isEqual } from "lodash";

    let ele: HTMLDivElement = $state()

    // Drag & Drop zone ratios
    const DROP_ZONE_LEFT_THRESHOLD = 0.25  // 좌측 25%: 왼쪽에 삽입
    const DROP_ZONE_RIGHT_THRESHOLD = 0.75 // 우측 25%: 오른쪽에 삽입
    // 중간 50%: 폴더 생성

    type personaTypeNormal = { type:'normal', icon: string, index: number, name:string }
    type personaType = personaTypeNormal | {type:'folder', folder:personaTypeNormal[], id:string, name:string, color:string, icon?:string}
    let personaImages: personaType[] = $state([])

    type DragData = {
        index:number,
        folder?:string
    }
    type DragEv = DragEvent & {
        currentTarget: EventTarget & HTMLDivElement;
    }
    let currentDrag: DragData = $state(null)
    let dragHoverIndex: number = $state(-1)
    let dragHoverZone: 'left' | 'center' | 'right' | null = $state(null)
    let selectedFolder: string | null = $state(null)
    let openFolderPopover: {id: string, left: number, y: number, above?: boolean} | null = $state(null)
    let popoverElement: HTMLDivElement | null = $state(null)

    const getDropZone = (relativeX: number): 'left' | 'center' | 'right' => {
        if(relativeX < DROP_ZONE_LEFT_THRESHOLD) return 'left'
        if(relativeX > DROP_ZONE_RIGHT_THRESHOLD) return 'right'
        return 'center'
    }

    const personaDragStart = (ind:DragData, e:DragEv) => {
        e.dataTransfer.setData('text/plain', '');
        currentDrag = ind
        const avatar = e.currentTarget.querySelector('[role="button"]')
        if(avatar){
            e.dataTransfer.setDragImage(avatar, 10, 10);
        }
    }

    const personaDragOver = (ind:DragData, e:DragEv) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'

        const rect = e.currentTarget.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const relativeX = mouseX / rect.width

        dragHoverIndex = ind.index
        dragHoverZone = getDropZone(relativeX)
    }

    const personaDragLeave = () => {
        dragHoverIndex = -1
        dragHoverZone = null
    }

    const personaDrop = (ind:DragData, e:DragEv) => {
        e.preventDefault()
        dragHoverIndex = -1
        dragHoverZone = null
        try {
            if(currentDrag){
                const rect = e.currentTarget.getBoundingClientRect()
                const mouseX = e.clientX - rect.left
                const relativeX = mouseX / rect.width
                const zone = getDropZone(relativeX)

                if(zone === 'left'){
                    // 좌측: 왼쪽에 삽입
                    inserter(currentDrag, {index: ind.index})
                }
                else if(zone === 'right'){
                    // 우측: 오른쪽에 삽입
                    inserter(currentDrag, {index: ind.index + 1})
                }
                else{
                    // 중간: 폴더 생성
                    createFolder(currentDrag, {index: ind.index})
                }
            }
        } catch (error) {}
    }

    const preventAll = (e:Event) => {
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    function getFolderIndex(id:string){
        for(let i=0;i<DBState.db.personaOrder.length;i++){
            const data = DBState.db.personaOrder[i]
            if(typeof(data) !== 'string' && data.id === id){
                return i
            }
        }
        return -1
    }

    const createFolder = (mainIndex:DragData, targetIndex:DragData) => {
        if(mainIndex.index === targetIndex.index && mainIndex.folder === targetIndex.folder){
            return
        }
        let db = DBState.db
        let mainFolderIndex = mainIndex.folder ? getFolderIndex(mainIndex.folder) : null
        let mainFolder = db.personaOrder[mainFolderIndex] as any
        if(targetIndex.folder){
            return // 폴더 내부에는 폴더를 만들 수 없음
        }
        const main = mainIndex.folder ? mainFolder.data[mainIndex.index] : db.personaOrder[mainIndex.index]
        const target = db.personaOrder[targetIndex.index]
        if(typeof(main) !== 'string'){
            return // 폴더는 폴더와 합칠 수 없음
        }
        if(typeof(target) === 'string'){
            // 두 개의 페르소나를 합쳐서 새 폴더 생성
            const newFolder:any = {
                name: "New Folder",
                data: [main, target],
                color: "",
                id: v4()
            }
            db.personaOrder[targetIndex.index] = newFolder
            if(mainIndex.folder){
                mainFolder.data.splice(mainIndex.index, 1)
                db.personaOrder[mainFolderIndex] = mainFolder
            }
            else{
                db.personaOrder.splice(mainIndex.index, 1)
            }
        }
        else{
            // 페르소나를 기존 폴더에 추가
            target.data.push(main)
            if(mainIndex.folder){
                mainFolder.data.splice(mainIndex.index, 1)
                db.personaOrder[mainFolderIndex] = mainFolder
            }
            else{
                db.personaOrder.splice(mainIndex.index, 1)
            }
        }
        DBState.db.personaOrder = db.personaOrder
        checkPersonaOrder()
    }

    const inserter = (mainIndex:DragData, targetIndex:DragData) => {
        if(mainIndex.index === targetIndex.index && mainIndex.folder === targetIndex.folder){
            return
        }
        let db = DBState.db
        let mainFolderIndex = mainIndex.folder ? getFolderIndex(mainIndex.folder) : null
        let targetFolderIndex = targetIndex.folder ? getFolderIndex(targetIndex.folder) : null
        let mainFolderId = mainIndex.folder ? (db.personaOrder[mainFolderIndex] as any).id : ''
        let movingFolder:any|false = false
        let mainId = ''
        if(mainIndex.folder){
            mainId = (db.personaOrder[mainFolderIndex] as any).data[mainIndex.index]
        }
        else{
            const da = db.personaOrder[mainIndex.index]
            if(typeof(da) !== 'string'){
                mainId = da.id
                movingFolder = safeStructuredClone($state.snapshot(da))
                if(targetIndex.folder){
                    return
                }
            }
            else{
                mainId = da
            }
        }
        if(targetIndex.folder){
            const folder = db.personaOrder[targetFolderIndex] as any
            folder.data.splice(targetIndex.index,0,mainId)
            db.personaOrder[targetFolderIndex] = folder
        }
        else if(movingFolder){
            db.personaOrder.splice(targetIndex.index,0,movingFolder)
        }
        else{
            db.personaOrder.splice(targetIndex.index,0,mainId)
        }
        if(mainIndex.folder){
            mainFolderIndex = -1
            for(let i=0;i<db.personaOrder.length;i++){
                const a =db.personaOrder[i]
                if(typeof(a) !== 'string'){
                    if(a.id === mainFolderId){
                        mainFolderIndex = i
                        break
                    }
                }
            }
            if(mainFolderIndex !== -1){
                const folder:any = db.personaOrder[mainFolderIndex] as any
                const ind = mainIndex.index > targetIndex.index ? folder.data.lastIndexOf(mainId) : folder.data.indexOf(mainId)
                if(ind !== -1){
                    folder.data.splice(ind, 1)
                }
                db.personaOrder[mainFolderIndex] = folder
            }
            else{
                console.log('folder not found')
            }
        }
        else if(movingFolder){
            let idList:string[] = []
            for(const ord of db.personaOrder){
                idList.push(typeof(ord) === 'string' ? ord : ord.id)
            }
            const ind = mainIndex.index > targetIndex.index ? idList.lastIndexOf(mainId) : idList.indexOf(mainId)
            if(ind !== -1){
                db.personaOrder.splice(ind, 1)
            }
        }
        else{
            const ind = mainIndex.index > targetIndex.index ? db.personaOrder.lastIndexOf(mainId) : db.personaOrder.indexOf(mainId)
            if(ind !== -1){
                db.personaOrder.splice(ind, 1)
            }
        }

        DBState.db.personaOrder = db.personaOrder
        checkPersonaOrder()
    }

    // 폴더 이미지 선택 함수
    async function selectFolderImg(folderId: string) {
        const selected = await selectSingleFile(['png'])
        if (!selected) return

        const img = selected.data
        const imgp = await saveImage(img)

        const folderIndex = getFolderIndex(folderId)
        if (folderIndex === -1) return

        const folder = DBState.db.personaOrder[folderIndex] as any
        folder.img = imgp
        DBState.db.personaOrder[folderIndex] = folder
        DBState.db.personaOrder = [...DBState.db.personaOrder]
    }

    // 폴더 삭제 함수 (페르소나들은 바깥으로)
    async function deleteFolder(folderId: string) {
        const folderIndex = getFolderIndex(folderId)
        if (folderIndex === -1) return

        const folder = DBState.db.personaOrder[folderIndex] as any
        const d = await alertConfirm(`Delete folder "${folder.name}"? Personas inside will be moved out.`)
        if (!d) return

        // 폴더 안의 페르소나들을 폴더 위치에 삽입
        const personasInFolder = folder.data
        DBState.db.personaOrder.splice(folderIndex, 1, ...personasInFolder)

        selectedFolder = null
        openFolderPopover = null
    }

    // 폴더 이름 업데이트 함수
    function updateFolderName(folderId: string, newName: string) {
        const folderIndex = getFolderIndex(folderId)
        if (folderIndex === -1) return

        const folder = DBState.db.personaOrder[folderIndex] as any
        folder.name = newName
        DBState.db.personaOrder[folderIndex] = folder
        DBState.db.personaOrder = [...DBState.db.personaOrder]
    }

    // 그리드 컨테이너에 드롭 (빈 공간에 드롭 시 맨 끝에 추가)
    const containerDrop = (e: DragEvent) => {
        e.preventDefault()
        dragHoverIndex = -1
        dragHoverZone = null

        // 폴더에서 드래그한 페르소나만 처리 (빈 공간에 드롭)
        if (currentDrag && currentDrag.folder) {
            // 맨 끝에 추가
            inserter(currentDrag, {index: personaImages.length})
        }
    }

    const containerDragOver = (e: DragEvent) => {
        // 폴더에서 드래그한 경우만 허용
        if (currentDrag && currentDrag.folder) {
            e.preventDefault()
            e.dataTransfer!.dropEffect = 'move'
        }
    }

    // 팝오버 위치 재조정 (실제 렌더링된 너비 기준)
    $effect(() => {
        if (!openFolderPopover) {
            popoverElement = null
            return
        }

        if (popoverElement && openFolderPopover) {
            const rect = popoverElement.getBoundingClientRect()
            const actualWidth = rect.width
            const PADDING = 16

            // 팝오버를 연 폴더의 위치를 찾아야 함
            const folderData = personaImages.find(p => p.type === 'folder' && p.id === openFolderPopover.id)
            if (folderData) {
                const folderIndex = personaImages.indexOf(folderData)
                const folderElements = document.querySelectorAll('[role="listitem"]')
                const folderElement = folderElements[folderIndex] as HTMLElement
                if (folderElement) {
                    const folderRect = folderElement.getBoundingClientRect()

                    // 폴더 중심에서 팝오버 절반만큼 왼쪽으로
                    let left = folderRect.left + folderRect.width / 2 - actualWidth / 2

                    // 화면 경계 체크
                    const maxLeft = window.innerWidth - actualWidth - PADDING
                    left = Math.max(PADDING, Math.min(left, maxLeft))

                    // 위치가 달라졌으면 업데이트
                    if (Math.abs(left - openFolderPopover.left) > 1) {
                        openFolderPopover = {
                            ...openFolderPopover,
                            left: left
                        }
                    }
                }
            }
        }
    })

    $effect(() => {
        let newPersonaImages: personaType[] = [];
        const idObject = getPersonaIndexObject()
        for (const id of DBState.db.personaOrder) {
          if(typeof(id) === 'string'){
            const index = idObject[id] ?? -1
            if(index !== -1){
              const persona = DBState.db.personas[index]
              newPersonaImages.push({
                icon:persona.icon ?? "",
                index:index,
                type: "normal",
                name: persona.name
              });
            }
          }
          else{
            const folder = id
            let folderPersonaImages: personaTypeNormal[] = []
            for(const id of folder.data){
              const index = idObject[id] ?? -1
              if(index !== -1){
                const persona = DBState.db.personas[index]
                folderPersonaImages.push({
                  icon:persona.icon ?? "",
                  index:index,
                  type: "normal",
                  name: persona.name
                });
              }
            }
            newPersonaImages.push({
              folder: folderPersonaImages,
              type: "folder",
              id: folder.id,
              name: folder.name,
              color: folder.color,
              icon: folder.img,
            });
          }
        }
        if (!isEqual(personaImages, newPersonaImages)) {
          personaImages = newPersonaImages;
        }
    })
</script>
<h2 class="mb-2 text-2xl font-bold mt-2">{language.persona}</h2>

<div class="p-4 rounded-md border-darkborderc border mb-2 flex-wrap flex gap-2 w-full max-w-full min-w-0" bind:this={ele}
    ondragover={containerDragOver}
    ondrop={containerDrop}>
    {#each personaImages as persona, ind}
        <!-- Persona container with drag -->
        <div role="listitem"
            class="relative cursor-grab active:cursor-grabbing select-none"
            draggable="true"
            ondragstart={(e) => {personaDragStart({index:ind}, e)}}
            ondragover={(e) => {personaDragOver({index:ind}, e)}}
            ondrop={(e) => {personaDrop({index:ind}, e)}}
            ondragenter={preventAll}
            ondragleave={personaDragLeave}
        >
            {#if persona.type === 'normal'}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div role="button" tabindex="0" onclick={() => {
                    selectedFolder = null
                    changeUserPersona(persona.index)
                }} onkeydown={(e) => {
                    if (e.key === "Enter") {
                        selectedFolder = null
                        changeUserPersona(persona.index)
                    }
                }}>
                    {#if persona.icon === ''}
                        <div class="rounded-md h-20 w-20 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500" class:ring={persona.index === DBState.db.selectedPersona}
                            style:box-shadow={dragHoverIndex === ind && dragHoverZone === 'left' ? 'inset 4px 0 0 0 rgb(34 197 94)' :
                                              dragHoverIndex === ind && dragHoverZone === 'right' ? 'inset -4px 0 0 0 rgb(34 197 94)' :
                                              dragHoverIndex === ind && dragHoverZone === 'center' ? 'inset 0 0 0 4px rgb(59 130 246)' : undefined}></div>
                    {:else}
                        {#await getCharImage(persona.icon, 'css')}
                            <div class="rounded-md h-20 w-20 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500" class:ring={persona.index === DBState.db.selectedPersona}
                                style:box-shadow={dragHoverIndex === ind && dragHoverZone === 'left' ? 'inset 4px 0 0 0 rgb(34 197 94)' :
                                                  dragHoverIndex === ind && dragHoverZone === 'right' ? 'inset -4px 0 0 0 rgb(34 197 94)' :
                                                  dragHoverIndex === ind && dragHoverZone === 'center' ? 'inset 0 0 0 4px rgb(59 130 246)' : undefined}></div>
                        {:then im}
                            <div class="rounded-md h-20 w-20 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500" style={im} class:ring={persona.index === DBState.db.selectedPersona}
                                style:box-shadow={dragHoverIndex === ind && dragHoverZone === 'left' ? 'inset 4px 0 0 0 rgb(34 197 94)' :
                                                  dragHoverIndex === ind && dragHoverZone === 'right' ? 'inset -4px 0 0 0 rgb(34 197 94)' :
                                                  dragHoverIndex === ind && dragHoverZone === 'center' ? 'inset 0 0 0 4px rgb(59 130 246)' : undefined}></div>
                        {/await}
                    {/if}
                </div>
            {:else if persona.type === 'folder'}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div role="button" tabindex="0" onclick={(e) => {
                    selectedFolder = persona.id
                    const rect = e.currentTarget.getBoundingClientRect()
                    const spaceBelow = window.innerHeight - rect.bottom
                    const estimatedPopoverHeight = 200
                    const PADDING = 16
                    // max-w-md = 28rem = 448px, max-w-[calc(100vw-32px)]
                    const estimatedPopoverWidth = Math.min(448, window.innerWidth - 32)

                    // 폴더 중심에서 팝오버 절반만큼 왼쪽으로 이동
                    let left = rect.left + rect.width / 2 - estimatedPopoverWidth / 2
                    // 화면 경계 체크 (최대값이 최소값보다 작을 수 있으므로 Math.max로 보정)
                    const maxLeft = Math.max(PADDING, window.innerWidth - estimatedPopoverWidth - PADDING)
                    left = Math.max(PADDING, Math.min(left, maxLeft))

                    openFolderPopover = {
                        id: persona.id,
                        left: left,
                        y: spaceBelow > estimatedPopoverHeight ? rect.bottom + 8 : rect.top - 8,
                        above: spaceBelow <= estimatedPopoverHeight
                    }
                }} onkeydown={(e) => {
                    if (e.key === "Enter") {
                        selectedFolder = persona.id
                        const rect = e.currentTarget.getBoundingClientRect()
                        const spaceBelow = window.innerHeight - rect.bottom
                        const estimatedPopoverHeight = 200
                        const PADDING = 16
                        const estimatedPopoverWidth = Math.min(448, window.innerWidth - 32)

                        let left = rect.left + rect.width / 2 - estimatedPopoverWidth / 2
                        const maxLeft = Math.max(PADDING, window.innerWidth - estimatedPopoverWidth - PADDING)
                        left = Math.max(PADDING, Math.min(left, maxLeft))

                        openFolderPopover = {
                            id: persona.id,
                            left: left,
                            y: spaceBelow > estimatedPopoverHeight ? rect.bottom + 8 : rect.top - 8,
                            above: spaceBelow <= estimatedPopoverHeight
                        }
                    }
                }} class="rounded-md h-20 w-20 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500 flex items-center justify-center"
                    style:box-shadow={dragHoverIndex === ind && dragHoverZone === 'left' ? 'inset 4px 0 0 0 rgb(34 197 94)' :
                                      dragHoverIndex === ind && dragHoverZone === 'right' ? 'inset -4px 0 0 0 rgb(34 197 94)' :
                                      dragHoverIndex === ind && dragHoverZone === 'center' ? 'inset 0 0 0 4px rgb(59 130 246)' : undefined}>
                    <svg viewBox="0 0 24 24" width="2em" height="2em">
                        <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                </div>
            {/if}
        </div>
    {/each}
    <div class="flex justify-center items-center ml-2 mr-2">
        <BaseRoundedButton
            onClick={async () => {
                const sel = parseInt(await alertSelect([language.createfromScratch, language.importCharacter]))
                if(sel === 0){
                    const newId = v4()
                    DBState.db.personas.push({
                        name: 'New Persona',
                        icon: '',
                        personaPrompt: '',
                        note: '',
                        id: newId
                    })
                    DBState.db.personaOrder.push(newId)
                    changeUserPersona(DBState.db.personas.length - 1)
                } else if(sel === 1){
                    await importUserPersona()
                }
            }}
            ><svg viewBox="0 0 24 24" width="1.2em" height="1.2em"
                ><path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                /></svg
            >
        </BaseRoundedButton>
    </div>
</div>

<!-- Folder Popover -->
{#if openFolderPopover}
    <!-- svelte-ignore a11y_click_events_have_key_keys a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-40 pointer-events-none"></div>
    {@const folderData = personaImages.find(p => p.type === 'folder' && p.id === openFolderPopover.id)}
    {#if folderData && folderData.type === 'folder'}
        <!-- svelte-ignore a11y_click_events_have_key_keys a11y_no_static_element_interactions -->
        <div class="fixed inset-0 z-40" onclick={(e) => {
            if(e.target === e.currentTarget) {
                openFolderPopover = null
            }
        }}></div>
        <div
            bind:this={popoverElement}
            class="fixed z-50 bg-darkbg border border-selected rounded-lg shadow-xl p-3 flex flex-wrap gap-2 max-w-[min(448px,calc(100vw-32px))] pointer-events-auto"
            style:left={`${openFolderPopover.left}px`}
            style:top={`${openFolderPopover.y}px`}
            style:transform={openFolderPopover.above ? "translateY(-100%)" : "none"}>
            {#each folderData.folder as persona, folderInd}
                <div
                    class="relative cursor-grab active:cursor-grabbing select-none"
                    draggable="true"
                    ondragstart={(e) => {
                        personaDragStart({index: folderInd, folder: openFolderPopover.id}, e)
                        // 드래그 시작 시 팝오버를 닫아서 드롭이 가능하게 함
                        setTimeout(() => {
                            openFolderPopover = null
                        }, 0)
                    }}
                >
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div role="button" tabindex="0" onclick={() => {
                        selectedFolder = null
                        openFolderPopover = null
                        changeUserPersona(persona.index)
                    }} onkeydown={(e) => {
                        if (e.key === "Enter") {
                            selectedFolder = null
                            openFolderPopover = null
                            changeUserPersona(persona.index)
                        }
                    }}>
                        {#if persona.icon === ''}
                            <div class="rounded-md h-16 w-16 shadow-lg bg-textcolor2 cursor-pointer hover:ring hover:ring-green-500" class:ring={persona.index === DBState.db.selectedPersona}></div>
                        {:else}
                            {#await getCharImage(persona.icon, 'css')}
                                <div class="rounded-md h-16 w-16 shadow-lg bg-textcolor2 cursor-pointer hover:ring hover:ring-green-500" class:ring={persona.index === DBState.db.selectedPersona}></div>
                            {:then im}
                                <div class="rounded-md h-16 w-16 shadow-lg bg-textcolor2 cursor-pointer hover:ring hover:ring-green-500" style={im} class:ring={persona.index === DBState.db.selectedPersona}></div>
                            {/await}
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
{/if}

{#if selectedFolder}
    <!-- Folder Settings UI -->
    {@const folderData = personaImages.find(p => p.type === 'folder' && p.id === selectedFolder)}
    {@const folderIndex = getFolderIndex(selectedFolder)}
    {@const folderObj = folderIndex !== -1 ? DBState.db.personaOrder[folderIndex] : null}
    {#if folderData && folderData.type === 'folder' && folderObj && typeof folderObj !== 'string'}
        <div class="flex w-full items-starts rounded-md border-darkborderc border p-4 max-w-full flex-wrap">
            <div class="flex flex-col mt-4 mr-4">
                <button onclick={() => {selectFolderImg(selectedFolder)}}>
                    {#if !folderData.icon}
                        <div class="rounded-md h-28 w-28 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" width="3em" height="3em">
                                <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                            </svg>
                        </div>
                    {:else}
                        {#await getCharImage(folderData.icon, 'css')}
                            <div class="rounded-md h-28 w-28 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500"></div>
                        {:then im}
                            <div class="rounded-md h-28 w-28 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500" style={im}></div>
                        {/await}
                    {/if}
                </button>
            </div>
            <div class="flex flex-grow flex-col p-2 max-w-full">
                <span class="text-sm text-textcolor2">{language.name}</span>
                <TextInput marginBottom size="lg" placeholder="Folder Name" value={folderObj.name} onchange={(e) => updateFolderName(selectedFolder, e.currentTarget.value)}/>
                <div class="flex gap-2 mt-4 max-w-full flex-wrap">
                    <Button styled="danger" onclick={() => deleteFolder(selectedFolder)}>{language.remove}</Button>
                </div>
            </div>
        </div>
    {/if}
{:else}
    <!-- Persona Settings UI -->
    <div class="flex w-full items-starts rounded-md border-darkborderc border p-4 max-w-full flex-wrap">
        <div class="flex flex-col mt-4 mr-4">
            <button onclick={() => {selectUserImg()}}>
                {#if DBState.db.userIcon === ''}
                    <div class="rounded-md h-28 w-28 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500"></div>
                {:else}
                    {#await getCharImage(DBState.db.userIcon, DBState.db.personas[DBState.db.selectedPersona].largePortrait ? 'lgcss' : 'css')}
                        <div class="rounded-md h-28 w-28 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500"></div>
                    {:then im}
                        <div class="rounded-md h-28 w-28 shadow-lg bg-textcolor2 cursor-pointer hover:text-green-500" style={im}></div>
                    {/await}
                {/if}
            </button>
        </div>
        <div class="flex flex-grow flex-col p-2 max-w-full">
            <span class="text-sm text-textcolor2">{language.name}</span>
            <TextInput marginBottom size="lg" placeholder="User" bind:value={DBState.db.username}/>
            <span class="text-sm text-textcolor2">{language.note}</span>
            {#if DBState.db.personaNote}
                <TextInput marginBottom size="lg" bind:value={DBState.db.userNote} placeholder={`Put a unique identifier for this persona here.\nExample: [Alternate Hunters persona]`} />
            {/if}
            <span class="text-sm text-textcolor2">{language.description}</span>
            <TextAreaInput autocomplete="off" bind:value={DBState.db.personaPrompt} placeholder={`Put the description of this persona here.\nExample: [<user> is a 20 year old girl.]`} />
            <div class="flex gap-2 mt-4 max-w-full flex-wrap">
                <Button onclick={exportUserPersona}>{language.export}</Button>
                <Button onclick={importUserPersona}>{language.import}</Button>

                <Button styled="danger" onclick={async () => {
                    if(DBState.db.personas.length === 1){
                        return
                    }
                    const d = await alertConfirm(`${language.removeConfirm}${DBState.db.personas[DBState.db.selectedPersona].name}`)
                    if(d){
                        saveUserPersona()
                        const personaId = DBState.db.personas[DBState.db.selectedPersona].id
                        let personas = DBState.db.personas
                        personas.splice(DBState.db.selectedPersona, 1)
                        DBState.db.personas = personas

                        // Remove from personaOrder
                        DBState.db.personaOrder = DBState.db.personaOrder.filter(item => {
                            if(typeof item === 'string'){
                                return item !== personaId
                            }
                            // If it's a folder, remove the persona from the folder's data array
                            if(item.data){
                                item.data = item.data.filter(id => id !== personaId)
                                return item.data.length > 0 // Remove empty folders
                            }
                            return true
                        })

                        changeUserPersona(0, 'noSave')
                    }
                }}>{language.remove}</Button>
                <Check bind:check={DBState.db.personas[DBState.db.selectedPersona].largePortrait}>{language.largePortrait}</Check>
            </div>
        </div>
    </div>
{/if}