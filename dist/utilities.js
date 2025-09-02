"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const constants_1 = require("./constants");
class Utils {
    static generateId() {
        return Math.random().toString(36).substr(2, constants_1.CONSTANTS.LIMITS.ID_LENGTH);
    }
    static createCommentText(description) {
        const timestamp = new Date().toISOString().split('T')[0];
        return `${constants_1.CONSTANTS.FORMATS.COMMENT_PREFIX}${description} (Created: ${timestamp})`;
    }
    static validateTimerInput(input) {
        const num = parseInt(input, 10);
        if (isNaN(num) || num < constants_1.CONSTANTS.LIMITS.MIN_TIMER_MINUTES || num > constants_1.CONSTANTS.LIMITS.MAX_TIMER_MINUTES) {
            return { isValid: false };
        }
        return { isValid: true, value: num };
    }
    static formatTimerDisplay(minutes, seconds) {
        return `${minutes}m ${seconds}s`;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utilities.js.map