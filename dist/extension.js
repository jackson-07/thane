/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
let actions = [];
let statusBarItem;
function activate(context) {
    console.log('thane is active');
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    context.subscriptions.push(statusBarItem);
    let addActionCommand = vscode.commands.registerCommand('actionmanager.addAction', addAction);
    let showActionsCommand = vscode.commands.registerCommand('actionmanager.showActions', showActions);
    let startTimerCommand = vscode.commands.registerCommand('actionmanager.startTimer', startTimer);
    let stopTimerCommand = vscode.commands.registerCommand('actionmanager.stopTimer', stopTimer);
    let convertToIssueCommand = vscode.commands.registerCommand('actionmanager.convertToIssue', convertToIssue);
    let addIssueCommand = vscode.commands.registerCommand('actionmanager.addIssue', addIssue);
    context.subscriptions.push(addActionCommand, showActionsCommand, startTimerCommand, stopTimerCommand, convertToIssueCommand, addIssueCommand);
}
async function addAction() {
    const actionDescription = await vscode.window.showInputBox({ prompt: 'Enter a new action' });
    if (actionDescription) {
        const action = { description: actionDescription, isIssue: false };
        actions.push(action);
        vscode.window.showInformationMessage(`Added action: ${actionDescription}`);
    }
}
async function showActions() {
    if (actions.length === 0) {
        vscode.window.showInformationMessage('No actions yet.');
        return;
    }
    const actionItems = actions.map((action, index) => ({
        label: `${index + 1}. ${action.isIssue ? '[ISSUE] ' : ''}${action.description}`,
        description: action.timer ? `${action.timer} minutes` : '',
        action: action
    }));
    const selectedAction = await vscode.window.showQuickPick(actionItems, { canPickMany: false });
    if (selectedAction) {
        vscode.window.showInformationMessage(`Selected: ${selectedAction.label}`);
    }
}
async function startTimer() {
    const actionItems = actions.map((action, index) => ({
        label: `${index + 1}. ${action.description}`,
        action: action
    }));
    const selectedAction = await vscode.window.showQuickPick(actionItems, { canPickMany: false });
    if (selectedAction) {
        const minutes = await vscode.window.showInputBox({ prompt: 'Enter timer duration in minutes' });
        if (minutes) {
            const durationInMs = parseInt(minutes) * 60 * 1000;
            selectedAction.action.timer = parseInt(minutes);
            selectedAction.action.timerEndTime = Date.now() + durationInMs;
            selectedAction.action.timerInterval = setInterval(() => {
                updateStatusBar(selectedAction.action);
                if (Date.now() >= selectedAction.action.timerEndTime) {
                    clearInterval(selectedAction.action.timerInterval);
                    vscode.window.showInformationMessage(`Timer finished for action: ${selectedAction.action.description}`);
                    statusBarItem.hide();
                }
            }, 1000);
            updateStatusBar(selectedAction.action);
            vscode.window.showInformationMessage(`Timer set for ${minutes} minutes on action: ${selectedAction.action.description}`);
        }
    }
}
function updateStatusBar(action) {
    if (action.timerEndTime) {
        const remainingTime = Math.max(0, action.timerEndTime - Date.now());
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        statusBarItem.text = `⏱️ ${action.description}: ${minutes}m ${seconds}s`;
        statusBarItem.show();
    }
}
async function stopTimer() {
    const activeTimers = actions.filter(action => action.timerInterval);
    if (activeTimers.length === 0) {
        vscode.window.showInformationMessage('No active timers');
        return;
    }
    const timerItems = activeTimers.map((action, index) => ({
        label: `${index + 1}. ${action.description}`,
        action: action
    }));
    const selectedTimer = await vscode.window.showQuickPick(timerItems, { canPickMany: false });
    if (selectedTimer) {
        clearInterval(selectedTimer.action.timerInterval);
        selectedTimer.action.timerInterval = undefined;
        selectedTimer.action.timerEndTime = undefined;
        vscode.window.showInformationMessage(`Timer stopped for action: ${selectedTimer.action.description}`);
        statusBarItem.hide();
    }
}
async function convertToIssue() {
    const actionItems = actions.filter(action => !action.isIssue).map((action, index) => ({
        label: `${index + 1}. ${action.description}`,
        action: action
    }));
    if (actionItems.length === 0) {
        vscode.window.showInformationMessage('No actions to convert to issues!');
        return;
    }
    const selectedAction = await vscode.window.showQuickPick(actionItems, { canPickMany: false });
    if (selectedAction) {
        selectedAction.action.isIssue = true;
        vscode.window.showInformationMessage(`Action "${selectedAction.action.description}" converted to an issue`);
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const position = editor.selection.active;
            const edit = new vscode.WorkspaceEdit();
            edit.insert(editor.document.uri, position, `// ISSUE: ${selectedAction.action.description}\n`);
            await vscode.workspace.applyEdit(edit);
            selectedAction.action.filePath = editor.document.uri.fsPath;
            selectedAction.action.lineNumber = position.line;
        }
    }
}
async function addIssue() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }
    const issueDescription = await vscode.window.showInputBox({ prompt: 'Enter issue description' });
    if (issueDescription) {
        const action = {
            description: issueDescription,
            isIssue: true,
            filePath: editor.document.uri.fsPath,
            lineNumber: editor.selection.active.line
        };
        actions.push(action);
        const position = editor.selection.active;
        const edit = new vscode.WorkspaceEdit();
        edit.insert(editor.document.uri, position, `// ISSUE: ${issueDescription}\n`);
        await vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage(`Added issue: ${issueDescription}`);
    }
}
function deactivate() {
    actions.forEach(action => {
        if (action.timerInterval) {
            clearInterval(action.timerInterval);
        }
    });
}


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map