<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { api, ApiError } from '$lib/api';
  import toast, { Toaster } from 'svelte-french-toast';
  import { Send, Bot, User, Loader2, Palette } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';
  import { theme, themes } from '$lib/theme.svelte';

  let messages: { id: string; role: 'user' | 'ai'; content: string }[] = [];
  let input = '';
  let loading = false;
  let sessionId = '';
  let viewport: HTMLDivElement;
  let inputElement: HTMLInputElement;
  let showThemes = false;

  $: currentTheme = themes[$theme];

  onMount(async () => {
    let stored = sessionStorage.getItem('spur_session_id');
    if (!stored) {
      stored = crypto.randomUUID();
      sessionStorage.setItem('spur_session_id', stored);
    }
    sessionId = stored;

   // Persist theme (localStorage preference)
   const storedTheme = localStorage.getItem('spur_theme');
   if (storedTheme && Object.keys(themes).includes(storedTheme)) {
       theme.set(storedTheme as any);
   }

   theme.subscribe(v => localStorage.setItem('spur_theme', v));

   // Load History
   try {
       const res = await api.get<{ messages: any[] }>('/chat/history/' + sessionId);
       if (res.messages && res.messages.length > 0) {
           // API returns newest first, reverse for display
           messages = res.messages.reverse().map(m => ({
               id: m.id,
               role: m.role === 'model' ? 'ai' : m.role, // normalize role
               content: m.content
           }));
           scrollToBottom();
       }
   } catch (err) {
       console.error("Failed to load history", err);
   }

   // Auto-focus input on load
   if (inputElement) inputElement.focus();
  });

  async function scrollToBottom() {
    await tick();
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || input.length > 250) return;

    const text = input.trim();
    input = '';
    
    // Optimistic UI
    const userMsgId = crypto.randomUUID();
    messages = [...messages, { id: userMsgId, role: 'user', content: text }];
    scrollToBottom();

    loading = true;

    try {
      const res = await api.post<{ reply: string }>('/chat/message', {
        message: text,
        sessionId
      });

      messages = [...messages, { 
        id: crypto.randomUUID(), 
        role: 'ai', 
        content: res.reply 
      }];

    } catch (err) {
       // If limit reached, we could show a special message in chat?
       // For now, toast handles it.
        if (err instanceof ApiError && err.status === 403) {
            // Optional: disable input
        }
    } finally {
      loading = false;
      scrollToBottom();
      // Keep focus on input
      await tick(); 
      if (inputElement) inputElement.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<Toaster position="top-center" />

<div class="flex flex-col h-screen font-sans transition-colors duration-300 {currentTheme.bg} {currentTheme.text}">
  <!-- Header -->
  <header class="{currentTheme.header} relative z-50 px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-500">
    <div class="flex items-center gap-3">
        <div class="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Bot class="w-6 h-6 text-white" />
        </div>
        <div>
            <h1 class="font-bold text-lg tracking-tight">Spur Support</h1>
            <div class="flex items-center gap-1.5 opacity-60">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <p class="text-xs font-medium">Online</p>
            </div>
        </div>
    </div>
    
    <div class="relative">
        <button 
            type="button"
            class="p-2.5 rounded-xl hover:bg-black/5 active:scale-95 transition-all duration-200"
            on:click={() => showThemes = !showThemes}
            aria-label="Change Theme"
        >
            <Palette class="w-5 h-5 opacity-80" />
        </button>

        {#if showThemes}
            <!-- Backdrop -->
            <button 
                type="button"
                class="fixed inset-0 z-40 cursor-default"
                on:click={() => showThemes = false}
                aria-label="Close themes"
                tabindex="-1"
            ></button>

            <!-- Dropdown -->
            <div 
                transition:fly={{ y: 10, duration: 200 }} 
                class="absolute right-0 top-full mt-3 w-64 p-2 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl z-50 ring-1 ring-black/5"
            >
                <div class="px-2 py-1.5 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Select Theme
                </div>
                <div class="grid grid-cols-1 gap-1">
                {#each Object.entries(themes) as [key, t]}
                    <button 
                        type="button"
                        class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group
                        {$theme === key ? 'bg-indigo-50/80 text-indigo-900 ring-1 ring-indigo-500/20' : 'hover:bg-black/5 text-gray-700'}"
                        on:click={() => { theme.set(key as any); showThemes = false; }}
                    >
                        <span class="capitalize">{t.name || key}</span>
                        
                        <!-- Theme Preview Swatch -->
                        <div class="flex items-center gap-1">
                            <div class="w-4 h-4 rounded-full border border-black/10 shadow-sm" style="background: {key.includes('dark') ? '#1e293b' : '#f8fafc'}"></div>
                            <div class="w-4 h-4 rounded-full border border-black/10 shadow-sm -ml-2" 
                                 style="background: {key.includes('glass') ? 'linear-gradient(135deg, #e0e7ff, #f3e8ff)' : (key.includes('dark') ? '#000' : '#fff')}"></div>
                        </div>
                    </button>
                {/each}
                </div>
            </div>
        {/if}
    </div>
  </header>

  <!-- Chat Area -->
  <div bind:this={viewport} class="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
    {#if messages.length === 0}
      <div class="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
        <Bot class="w-16 h-16" />
        <p>Ask me anything about shipping, returns, or products!</p>
      </div>
    {/if}

    {#each messages as msg (msg.id)}
      <div 
        in:fly={{ y: 20, duration: 300 }}
        class="flex gap-4 {msg.role === 'user' ? 'flex-row-reverse' : ''}"
      >
        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
           {msg.role === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}">
          {#if msg.role === 'ai'} <Bot class="w-5 h-5" /> {:else} <User class="w-5 h-5" /> {/if}
        </div>

        <div class="max-w-[80%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed whitespace-pre-wrap
          {msg.role === 'ai' ? currentTheme.bubbleAi : currentTheme.bubbleUser}">
          {msg.content}
        </div>
      </div>
    {/each}

    {#if loading}
      <div class="flex gap-4" in:fade>
        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <Bot class="w-5 h-5 text-indigo-600" />
        </div>
        <div class="{currentTheme.bubbleAi} rounded-2xl px-4 py-3 flex gap-1 items-center shadow-sm">
          <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="p-4 {currentTheme.inputArea} transition-colors duration-300">
    <div class="max-w-4xl mx-auto relative flex gap-2">
      <div class="relative flex-1">
          <input
            bind:this={inputElement}
            bind:value={input}
            on:keydown={handleKeydown}
            disabled={loading}
            type="text"
            placeholder="Type a message..."
            maxlength="250"
            class="w-full {currentTheme.input} transition-colors border-0 rounded-xl px-4 py-3 pr-16 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <!-- Counter -->
          <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] 
            {input.length > 200 ? 'text-orange-500 font-bold' : 'text-gray-400'}">
              {input.length}/250
          </div>
      </div>

      <button
        on:click={sendMessage}
        disabled={!input.trim() || loading}
        class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl px-4 flex items-center justify-center transition-all disabled:cursor-not-allowed shadow-md"
      >
        {#if loading} <Loader2 class="w-5 h-5 animate-spin" /> {:else} <Send class="w-5 h-5" /> {/if}
      </button>
    </div>
    <div class="text-center mt-2">
        <span class="text-[10px] opacity-60">AI can make mistakes. Please check important info.</span>
    </div>
  </div>
</div>
