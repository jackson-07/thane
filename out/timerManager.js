"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerManager = void 0;
const vscode = require("vscode");
const utilities_1 = require("./utilities");
const constants_1 = require("./constants");
class TimerManager {
    constructor(context) {
        this.context = context;
        this.timers = [];
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        context.subscriptions.push(this.statusBarItem);
    }
    async startTimer(taskId, durationMinutes) {
        this.stopTimerForTask(taskId);
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
        const timer = {
            id: utilities_1.Utils.generateId(),
            taskId,
            startTime,
            endTime,
        };
        timer.interval = setInterval(() => {
            this.updateStatusBar(timer);
            if (new Date() >= timer.endTime) {
                this.completeTimer(timer.id);
            }
        }, 1000);
        this.timers.push(timer);
        this.updateStatusBar(timer);
        return timer;
    }
    stopTimer(timerId) {
        const timer = this.getTimer(timerId);
        if (!timer) {
            return false;
        }
        if (timer.interval) {
            clearInterval(timer.interval);
        }
        this.removeTimer(timerId);
        this.statusBarItem.hide();
        return true;
    }
    stopTimerForTask(taskId) {
        const timer = this.getTimerByTaskId(taskId);
        return timer ? this.stopTimer(timer.id) : false;
    }
    getActiveTimers() {
        return this.timers.filter(t => t.interval);
    }
    getTimer(id) {
        return this.timers.find(t => t.id === id);
    }
    getTimerByTaskId(taskId) {
        return this.timers.find(t => t.taskId === taskId);
    }
    createTimerItems(tasks) {
        return this.getActiveTimers().map((timer, index) => {
            const task = tasks.find(t => t.id === timer.taskId);
            return {
                label: `${index + 1}. ${task?.description || 'Unknown Task'}`,
                timer
            };
        });
    }
    dispose() {
        this.timers.forEach(timer => {
            if (timer.interval) {
                clearInterval(timer.interval);
            }
        });
        this.timers = [];
    }
    updateStatusBar(timer) {
        const now = new Date();
        const remainingMs = Math.max(0, timer.endTime.getTime() - now.getTime());
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        this.statusBarItem.text = `${constants_1.CONSTANTS.FORMATS.TIMER_STATUS}${utilities_1.Utils.formatTimerDisplay(minutes, seconds)}`;
        this.statusBarItem.show();
    }
    completeTimer(timerId) {
        const timer = this.getTimer(timerId);
        if (timer) {
            this.stopTimer(timerId);
            vscode.window.showInformationMessage(`Timer completed!`);
        }
    }
    removeTimer(id) {
        const index = this.timers.findIndex(t => t.id === id);
        if (index !== -1) {
            this.timers.splice(index, 1);
        }
    }
}
exports.TimerManager = TimerManager;
//# sourceMappingURL=timerManager.js.map