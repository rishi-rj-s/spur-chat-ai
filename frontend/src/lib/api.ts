import { env } from '$env/dynamic/public';
import toast from 'svelte-french-toast';

const BASE_URL = env.PUBLIC_API_BASE_URL || 'http://localhost:3000';

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
        // Network errors or other crashes
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            toast.error('Unable to connect to the server. Is it running?');
            throw new Error('Network Error');
        }

        // API Errors (400/500)
        if (error instanceof ApiError) {
            // If the backend sends { error: "Message" } use that, else default
            const msg = error.details?.error || 'Something went wrong';
            toast.error(msg);
            throw error;
        }

        console.error(error);
        toast.error('An unexpected error occurred');
        throw error;
    }
}

export const api = {
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
};
