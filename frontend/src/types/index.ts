export interface User {
    id: number;
    email: string;
    partner_id: number | null;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface DailyEntry {
    id: number;
    user_id: number;
    text: string;
    mood: number;
    date: string;
}

export interface Photo {
    id: number;
    user_id: number;
    file_path: string;
    created_at: string;
}
