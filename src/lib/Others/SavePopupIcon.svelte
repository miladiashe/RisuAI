<script lang="ts">
  import { AlertOctagon, SaveIcon } from "lucide-svelte";
  import { alertMd } from "src/ts/alert";
  import { saving } from "src/ts/globalApi.svelte";
  import { AccountWarning } from "src/ts/storage/accountStorage";
  import { DBState } from "src/ts/stores.svelte";

  // Calculate progress percentage for circular progress
  $: progressPercent = saving.progress.total > 0
    ? (saving.progress.current / saving.progress.total) * 100
    : 0;

  // Calculate stroke-dasharray for circular progress (circumference = 2 * PI * radius)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  $: strokeDashoffset = circumference - (progressPercent / 100) * circumference;
</script>

{#if DBState?.db?.showSavingIcon && saving.state}
  <div
    class="absolute top-3 right-3 z-10 text-white p-2 rounded bg-gradient-to-br from-blue-500 to-purple-800 saving-animation pointer-events-none opacity-15"
  >
    {#if saving.progress.total > 0}
      <!-- Show circular progress for chunked uploads -->
      <div class="relative w-6 h-6">
        <svg class="w-6 h-6 transform -rotate-90" viewBox="0 0 48 48">
          <!-- Background circle -->
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            stroke-width="4"
            fill="none"
            opacity="0.3"
          />
          <!-- Progress circle -->
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            stroke-width="4"
            fill="none"
            stroke-dasharray={circumference}
            stroke-dashoffset={strokeDashoffset}
            stroke-linecap="round"
            class="transition-all duration-300"
          />
        </svg>
        <!-- Progress text -->
        <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
          {saving.progress.current}/{saving.progress.total}
        </div>
      </div>
    {:else}
      <!-- Default save icon for non-chunked uploads -->
      <SaveIcon size={24} />
    {/if}
  </div>
{:else if $AccountWarning}
  <button class="absolute top-3 right-3 z-10 text-white bg-red-800 hover:bg-red-600 p-2 rounded" onclick={() =>{
      alertMd($AccountWarning)
      $AccountWarning = ''
  }}>
      <AlertOctagon size={24} />
  </button>
{/if}