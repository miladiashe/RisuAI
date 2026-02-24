<script lang="ts">
  import { OctagonAlert } from "@lucide/svelte";
  import { alertMd } from "src/ts/alert";
  import { saving } from "src/ts/globalApi.svelte";
  import { AccountWarning } from "src/ts/storage/accountStorage";
  import { DBState } from "src/ts/stores.svelte";

  function formatSize(bytes: number): string {
    if (bytes === 0) return "...";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
</script>

{#if DBState?.db?.showSavingIcon && saving.state}
  <div
    class="absolute top-3 right-3 z-10 text-white px-3 py-2 rounded-sm bg-linear-to-br from-blue-500 to-purple-800 saving-animation pointer-events-none min-w-24"
  >
    <div class="flex items-center justify-between gap-2 text-xs font-mono">
      <span>{formatSize(saving.fileSize)}</span>
      <span>{saving.progress}%</span>
    </div>
    <div class="mt-1 h-1 bg-white/30 rounded-full overflow-hidden">
      <div
        class="h-full bg-white rounded-full transition-all duration-300"
        style="width: {saving.progress}%"
      ></div>
    </div>
  </div>
{:else if $AccountWarning}
  <button class="absolute top-3 right-3 z-10 text-white bg-red-800 hover:bg-red-600 p-2 rounded-sm" onclick={() =>{
      alertMd($AccountWarning)
      $AccountWarning = ''
  }}>
      <OctagonAlert size={24} />
  </button>
{/if}
