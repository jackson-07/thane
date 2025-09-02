"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const taskManager_1 = require("./taskManager");
const commentManager_1 = require("./commentManager");
const timerManager_1 = require("./timerManager");
const commands_1 = require("./commands");
const constants_1 = require("./constants");
let taskManager;
let commentManager;
let timerManager;
let commands;
function activate(context) {
    console.log(constants_1.CONSTANTS.MESSAGES.EXTENSION_ACTIVE);
    taskManager = new taskManager_1.TaskManager(context);
    commentManager = new commentManager_1.CommentManager();
    timerManager = new timerManager_1.TimerManager(context);
    commands = new commands_1.ExtensionCommands(taskManager, commentManager, timerManager);
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
function deactivate() {
    if (timerManager) {
        timerManager.dispose();
    }
}
//# sourceMappingURL=extension.js.map