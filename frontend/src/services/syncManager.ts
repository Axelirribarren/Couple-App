import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface Spark {
    id: number;
    sender_id: number;
    spark_type: string;
    encrypted_payload?: string;
    created_at: string;
    unlock_at?: string;
}

export interface SyncResponse {
    partner_id?: number;
    partner_mood?: number;
    streak_count: number;
    sparks: Spark[];
}

class SyncManager {
    private lastSync: number = 0;

    // In-memory or AsyncStorage cached state
    public currentStreak: number = 0;
    public partnerMood: number | null = null;
    public localMood: number = 3;

    /**
     * Pull partner status and pending Sparks, and push local status.
     */
    async syncWithServer(): Promise<SyncResponse | null> {
        try {
            // Check Daily Streak Logic
            await this.updateStreakLogic();

            // Get local state to push
            const storedStreak = await AsyncStorage.getItem('streak_count');
            const storedMood = await AsyncStorage.getItem('local_mood');

            const payload: any = {
                streak_count: storedStreak ? parseInt(storedStreak, 10) : 0,
            };

            if (storedMood) {
                payload.current_mood = parseInt(storedMood, 10);
            }

            const response = await api.post<SyncResponse>('/sync/', payload);

            // Reconcile server streak
            // - If partner updated it, it might be higher.
            // - If partner hasn't logged in for >48h, backend breaks it (returns 1).
            if (response.data.streak_count !== this.currentStreak) {
                this.currentStreak = response.data.streak_count;
                await AsyncStorage.setItem('streak_count', this.currentStreak.toString());
            }

            this.partnerMood = response.data.partner_mood || null;

            return response.data;
        } catch (error) {
            console.error("Sync failed, falling back to local state:", error);
            // In a local-first architecture, failing to sync isn't critical.
            return null;
        }
    }

    /**
     * Internal logic to check and update daily streak
     */
    private async updateStreakLogic() {
        const lastActiveStr = await AsyncStorage.getItem('last_active_date');
        const streakStr = await AsyncStorage.getItem('streak_count');

        const now = new Date();
        // Use YYYY-MM-DD for easier comparison without time zone issues
        const todayStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;

        let currentStreak = streakStr ? parseInt(streakStr, 10) : 0;

        if (lastActiveStr) {
            if (lastActiveStr !== todayStr) {
                // Parse the stored YYYY-MM-DD
                const parts = lastActiveStr.split('-');
                const lastActiveDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

                // Create a clean "today" date at midnight
                const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                // Calculate difference in calendar days, not raw hours
                const diffTime = todayDate.getTime() - lastActiveDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Contiguous day, increase streak
                    currentStreak += 1;
                } else if (diffDays > 1) {
                    // Streak broken
                    currentStreak = 1;
                }
            }
            // If lastActiveStr === todayStr, do nothing (streak already counted for today)
        } else {
            // First time ever opening
            currentStreak = 1;
        }

        this.currentStreak = currentStreak;
        await AsyncStorage.setItem('last_active_date', todayStr);
        await AsyncStorage.setItem('streak_count', currentStreak.toString());
    }

    /**
     * Send an ephemeral Spark or Time Capsule
     */
    async sendSpark(type: 'haptic' | 'polaroid' | 'nudge' | 'time_capsule' | 'secret_signal', payload?: string, unlockAt?: string) {
        try {
            await api.post('/sync/sparks', {
                spark_type: type,
                encrypted_payload: payload, // Can be base64 photo data, haptic pattern JSON, etc.
                unlock_at: unlockAt
            });
            return true;
        } catch (error) {
            console.error("Failed to send spark:", error);
            return false;
        }
    }

    /**
     * Report a physical shake to the server to check for synchronization
     */
    async reportShake(): Promise<{synced: boolean, message: string}> {
        try {
            const res = await api.post('/sync/shake');
            return res.data;
        } catch (error) {
            console.error("Failed to report shake:", error);
            return { synced: false, message: "Error" };
        }
    }

    /**
     * Mark spark as consumed so it deletes from server
     */
    async consumeSpark(sparkId: number) {
        try {
            await api.delete(`/sync/sparks/${sparkId}`);
        } catch (error) {
            console.error(`Failed to consume spark ${sparkId}:`, error);
        }
    }

    /**
     * Utility to update local mood and immediately push
     */
    async updateLocalMood(mood: number) {
        this.localMood = mood;
        await AsyncStorage.setItem('local_mood', mood.toString());
        await this.syncWithServer();
    }
}

export const syncManager = new SyncManager();
