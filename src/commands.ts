import * as vscode from "vscode";
import { TaskManager } from "./taskManager";
import { CommentManager } from "./commentManager";
import { TimerManager } from "./timerManager";
import { CONSTANTS } from "./constants";
import { Utils } from "./utilities";  


export class ExtensionCommands {
    constructor(
        private taskManager: TaskManager,
        private commentManager: CommentManager,
        private timerManager: TimerManager
    ) {}

    async addTask(): Promise<void> {
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
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add task: ${error}`);
        }
    }

    async showTasks(): Promise<void> {  
        const tasks = this.taskManager.getTasks();  
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(CONSTANTS.MESSAGES.NO_TASKS);  
            return;
        }

        const items = this.taskManager.createTaskItems(); 
        const selected = await vscode.window.showQuickPick(items, { canPickMany: false });
        
        if (selected) {
            vscode.window.showInformationMessage(`Selected: ${selected.label}`);
        }
    }

    async completeTask(): Promise<void> { 
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(CONSTANTS.MESSAGES.NO_TASKS);
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

                const result = await vscode.window.showInformationMessage(
                    `Completed: ${task.description}`,
                    'Undo'
                );

                if (result === 'Undo') {
                    await this.taskManager.restoreTask(task);
                    vscode.window.showInformationMessage('Task restored');
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to complete task: ${error}`);
        }
    }

    async startTimer(): Promise<void> {
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(CONSTANTS.MESSAGES.NO_TASKS);
            return;
        }

        try {
            const items = this.taskManager.createTaskItems();
            const selectedTask = await vscode.window.showQuickPick(items, { canPickMany: false });

            if (selectedTask) {
                const minutesInput = await vscode.window.showInputBox({ 
                    prompt: 'Enter timer duration in minutes (1-1440)',
                    validateInput: (value) => {
                        const validation = Utils.validateTimerInput(value || '');
                        return validation.isValid ? null : CONSTANTS.MESSAGES.INVALID_TIMER;
                    }
                });

                if (minutesInput) {
                    const validation = Utils.validateTimerInput(minutesInput);
                    if (validation.isValid && validation.value) {
                        const timer = await this.timerManager.startTimer(selectedTask.task.id, validation.value);
                        await this.taskManager.updateTask(selectedTask.task.id, { timerId: timer.id });
                        vscode.window.showInformationMessage(
                            `Timer set for ${validation.value} minutes on: ${selectedTask.task.description}`
                        );
                    }
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start timer: ${error}`);
        }
    }

    async stopTimer(): Promise<void> {
        const tasks = this.taskManager.getTasks();
        const activeTimers = this.timerManager.getActiveTimers();
        
        if (activeTimers.length === 0) {
            vscode.window.showInformationMessage(CONSTANTS.MESSAGES.NO_ACTIVE_TIMERS);
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
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stop timer: ${error}`);
        }
    }

async convertToComment(): Promise<void> {
        const tasks = this.taskManager.getTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage(CONSTANTS.MESSAGES.NO_TASKS);
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
                vscode.window.showInformationMessage(
                    `Task converted to comment: ${selected.task.description}`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to convert to comment: ${error}`);
        }
    }

}