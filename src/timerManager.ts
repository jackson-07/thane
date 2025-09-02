import * as vscode from 'vscode';
import { Timer, Task } from './models';
import { Utils } from './utilities';
import { CONSTANTS } from './constants';

export class TimerManager {
    private timers: Timer[] = [];
    private statusBarItem: vscode.StatusBarItem;

    constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        context.subscriptions.push(this.statusBarItem);
    }

    async startTimer(taskId: string, durationMinutes: number): Promise<Timer> {
        this.stopTimerForTask(taskId);

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const timer: Timer = {
            id: Utils.generateId(),
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

    stopTimer(timerId: string): boolean {
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

    stopTimerForTask(taskId: string): boolean {
        const timer = this.getTimerByTaskId(taskId);
        return timer ? this.stopTimer(timer.id) : false;
    }

    getActiveTimers(): Timer[] {
        return this.timers.filter(t => t.interval);
    }

    getTimer(id: string): Timer | undefined {
        return this.timers.find(t => t.id === id);
    }

    getTimerByTaskId(taskId: string): Timer | undefined {
        return this.timers.find(t => t.taskId === taskId);
    }

    createTimerItems(tasks: Task[]): Array<{ label: string; timer: Timer }> {
        return this.getActiveTimers().map((timer, index) => {
            const task = tasks.find(t => t.id === timer.taskId);
            return {
                label: `${index + 1}. ${task?.description || 'Unknown Task'}`,
                timer
            };
        });
    }

    dispose(): void {
        this.timers.forEach(timer => {
            if (timer.interval) {
                clearInterval(timer.interval);
            }
        });
        this.timers = [];
    }

    private updateStatusBar(timer: Timer): void {
        const now = new Date();
        const remainingMs = Math.max(0, timer.endTime.getTime() - now.getTime());
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);

        this.statusBarItem.text = `${CONSTANTS.FORMATS.TIMER_STATUS}${Utils.formatTimerDisplay(minutes, seconds)}`;
        this.statusBarItem.show();
    }

    private completeTimer(timerId: string): void {
        const timer = this.getTimer(timerId);
        if (timer) {
            this.stopTimer(timerId);
            vscode.window.showInformationMessage(`Timer completed!`);
        }
    }

    private removeTimer(id: string): void {
        const index = this.timers.findIndex(t => t.id === id);
        if (index !== -1) {
            this.timers.splice(index, 1);
        }
    }
}