import toast from 'svelte-french-toast';
import ToastMessage from '$lib/components/ToastMessage.svelte';

export function showToast(message: string, type: 'success' | 'error' = 'success') {
    // Clear previous toasts
    toast.dismiss();

    toast(
        ToastMessage,
        {
            // Pass props via both methods for compatibility
            componentProps: { message, type },
            data: { message, type },
            style: "background: #fff; color: #333; padding: 12px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);",
        } as any
    );
}
