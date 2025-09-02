import { CONSTANTS } from './constants';

export class Utils {
    static generateId(): string {
        return Math.random().toString(36).substr(2, CONSTANTS.LIMITS.ID_LENGTH);
    }

    static createCommentText(description: string): string {
        const timestamp = new Date().toISOString().split('T')[0];
        return `${CONSTANTS.FORMATS.COMMENT_PREFIX}${description} (Created: ${timestamp})`;
    }

    static validateTimerInput(input: string): { isValid: boolean; value?: number } {
        const num = parseInt(input, 10);
        if (isNaN(num) || num < CONSTANTS.LIMITS.MIN_TIMER_MINUTES || num > CONSTANTS.LIMITS.MAX_TIMER_MINUTES) {
            return { isValid: false };
        }
        return { isValid: true, value: num };
    }

    static formatTimerDisplay(minutes: number, seconds: number): string {
        return `${minutes}m ${seconds}s`;
    }
}