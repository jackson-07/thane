"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionCommands = void 0;
const vscode = require("vscode");
const constants_1 = require("./constants");
const utilities_1 = require("./utilities");
class ExtensionCommands {
    constructor(taskManager, commentManager, timerManager) {
        this.taskManager = taskManager;
        this.commentManager = commentManager;
        this.timerManager = timerManager;
    }
    async addTask() {
        try {
            const description = await vscode.window.showInputBox({
                prompt: 'Enter a new task',
                validateInput: (value) => {
                    if (!value?.trim()) {
                        return 'Task description cannot be empty';
                    }
                    return null;
                }
            });
            if (description) {
                const task = await this.taskManager.addTask(description);
                vscode.window.showInformationMessage(`Added task: ${task.description}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to add task: ${error}`);
        }
    }
    async showTasks() {
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(constants_1.CONSTANTS.MESSAGES.NO_TASKS);
            return;
        }
        const items = this.taskManager.createTaskItems();
        const selected = await vscode.window.showQuickPick(items, { canPickMany: false });
        if (selected) {
            vscode.window.showInformationMessage(`Selected: ${selected.label}`);
        }
    }
    async completeTask() {
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(constants_1.CONSTANTS.MESSAGES.NO_TASKS);
            return;
        }
        try {
            const items = this.taskManager.createTaskItems();
            const selected = await vscode.window.showQuickPick(items, { canPickMany: false });
            if (selected) {
                const task = selected.task;
                if (task.timerId) {
                    this.timerManager.stopTimerForTask(task.id);
                }
                await this.taskManager.removeTask(task.id);
                const result = await vscode.window.showInformationMessage(`Completed: ${task.description}`, 'Undo');
                if (result === 'Undo') {
                    await this.taskManager.restoreTask(task);
                    vscode.window.showInformationMessage('Task restored');
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to complete task: ${error}`);
        }
    }
    async startTimer() {
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(constants_1.CONSTANTS.MESSAGES.NO_TASKS);
            return;
        }
        try {
            const items = this.taskManager.createTaskItems();
            const selectedTask = await vscode.window.showQuickPick(items, { canPickMany: false });
            if (selectedTask) {
                const minutesInput = await vscode.window.showInputBox({
                    prompt: 'Enter timer duration in minutes (1-1440)',
                    validateInput: (value) => {
                        const validation = utilities_1.Utils.validateTimerInput(value || '');
                        return validation.isValid ? null : constants_1.CONSTANTS.MESSAGES.INVALID_TIMER;
                    }
                });
                if (minutesInput) {
                    const validation = utilities_1.Utils.validateTimerInput(minutesInput);
                    if (validation.isValid && validation.value) {
                        const timer = await this.timerManager.startTimer(selectedTask.task.id, validation.value);
                        await this.taskManager.updateTask(selectedTask.task.id, { timerId: timer.id });
                        vscode.window.showInformationMessage(`Timer set for ${validation.value} minutes on: ${selectedTask.task.description}`);
                    }
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start timer: ${error}`);
        }
    }
    async stopTimer() {
        const tasks = this.taskManager.getTasks();
        const activeTimers = this.timerManager.getActiveTimers();
        if (activeTimers.length === 0) {
            vscode.window.showInformationMessage(constants_1.CONSTANTS.MESSAGES.NO_ACTIVE_TIMERS);
            return;
        }
        try {
            const items = this.timerManager.createTimerItems(tasks);
            const selected = await vscode.window.showQuickPick(items, { canPickMany: false });
            if (selected) {
                this.timerManager.stopTimer(selected.timer.id);
                await this.taskManager.updateTask(selected.timer.taskId, { timerId: undefined });
                vscode.window.showInformationMessage(`Timer stopped`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to stop timer: ${error}`);
        }
    }
    async convertToComment() {
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(constants_1.CONSTANTS.MESSAGES.NO_TASKS);
            return;
        }
        try {
            const items = this.taskManager.createTaskItems();
            const selected = await vscode.window.showQuickPick(items, {
                canPickMany: false,
                placeHolder: 'Select a task to convert to comment'
            });
            if (selected) {
                await this.commentManager.insertTaskComment(selected.task);
                vscode.window.showInformationMessage(`Task converted to comment: ${selected.task.description}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to convert to comment: ${error}`);
        }
    }
}
exports.ExtensionCommands = ExtensionCommands;
//# sourceMappingURL=commands.js.map