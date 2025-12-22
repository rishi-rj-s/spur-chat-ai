import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { showToast } from '$lib/utils/toast';

const BASE_URL = PUBLIC_API_BASE_URL;

export class ApiError extends Error {
    constructor(public status: number, public details: any) {
        super(`API Error: ${status}`);
    }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(response.status, data);
        }

        return data as T;
    } catch (error) {
        // Network errors
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            showToast('Unable to connect to the server. ', 'error');
            throw new Error('Network Error');
        }

        // API Errors (400/500)
        if (error instanceof ApiError) {
            if (error.status === 429) {
                showToast(error.details?.message || 'You are typing too fast! Take a breather.', 'warning');
                throw error;
            }

            // Use backend error message if available
            const msg = error.details?.error || 'Something went wrong';
            showToast(msg, 'error');
            throw error;
        }

        console.error(error);
        showToast('An unexpected error occurred', 'error');
        throw error;
    }
}

export const api = {
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
};
