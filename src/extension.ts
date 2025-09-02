import * as vscode from 'vscode';
import { TaskManager } from './taskManager';
import { CommentManager } from './commentManager';
import { TimerManager } from './timerManager';
import { ExtensionCommands } from './commands';
import { CONSTANTS } from './constants';

let taskManager: TaskManager;
let commentManager: CommentManager;
let timerManager: TimerManager;
let commands: ExtensionCommands;

export function activate(context: vscode.ExtensionContext) {
    console.log(CONSTANTS.MESSAGES.EXTENSION_ACTIVE);

    taskManager = new TaskManager(context);
    commentManager = new CommentManager();
    timerManager = new TimerManager(context);
    commands = new ExtensionCommands(taskManager, commentManager, timerManager);

    const commandRegistrations = [
        vscode.commands.registerCommand('thane.addTask', () => commands.addTask()),
        vscode.commands.registerCommand('thane.showTasks', () => commands.showTasks()),
        vscode.commands.registerCommand('thane.completeTask', () => commands.completeTask()),
        vscode.commands.registerCommand('thane.startTimer', () => commands.startTimer()),
        vscode.commands.registerCommand('thane.stopTimer', () => commands.stopTimer()),
        vscode.commands.registerCommand('thane.convertToComment', () => commands.convertToComment())
    ];

    context.subscriptions.push(...commandRegistrations);
}

export function deactivate() {
    if (timerManager) {
        timerManager.dispose();
    }
}