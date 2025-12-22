<script lang="ts">
  import toastLib from 'svelte-french-toast';
  import { CircleCheck, CircleX, TriangleAlert } from 'lucide-svelte';

  export let message: string | undefined = undefined;
  export let type: 'success' | 'error' | 'warning' | undefined = undefined;
  export let toast: any = {};
  
  // Fallback for props passed via `toast(Comp, { data: { ... } })`
  $: resolvedMessage = message || toast?.data?.message || '';
  $: resolvedType = type || toast?.data?.type || 'success';
</script>

<div 
  class="flex items-center gap-3 max-w-sm cursor-pointer"
  on:click={() => toastLib.dismiss(toast.id)}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && toastLib.dismiss(toast.id)}
>
  <!-- Icon Section -->
  <div class="flex-shrink-0">
    {#if resolvedType === 'success'}
      <CircleCheck class="w-5 h-5 text-green-500" />
    {:else if resolvedType === 'warning'}
      <TriangleAlert class="w-5 h-5 text-yellow-500" />
    {:else}
      <CircleX class="w-5 h-5 text-red-500" />
    {/if}
  </div>

  <span class="flex-1 text-sm font-medium text-gray-700 select-none">{resolvedMessage}</span>
</div>
