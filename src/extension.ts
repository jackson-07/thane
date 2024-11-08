import * as vscode from 'vscode';

interface Action {
    description: string;
    isIssue: boolean;
    timer?: number;
    filePath?: string;
    lineNumber?: number;
    timerEndTime?: number;
    timerInterval?: NodeJS.Timeout;
}

let actions: Action[] = [];
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('thane is active');

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    context.subscriptions.push(statusBarItem);

    let addActionCommand = vscode.commands.registerCommand('actionmanager.addAction', addAction);
    let showActionsCommand = vscode.commands.registerCommand('actionmanager.showActions', showActions);
    let completeActionCommand = vscode.commands.registerCommand('actionmanager.completeAction', completeAction);

    let startTimerCommand = vscode.commands.registerCommand('actionmanager.startTimer', startTimer);
    let stopTimerCommand = vscode.commands.registerCommand('actionmanager.stopTimer', stopTimer);

    let convertToIssueCommand = vscode.commands.registerCommand('actionmanager.convertToIssue', convertToIssue);
    let addIssueCommand = vscode.commands.registerCommand('actionmanager.addIssue', addIssue);

    context.subscriptions.push(addActionCommand, showActionsCommand, completeActionCommand, startTimerCommand, stopTimerCommand, convertToIssueCommand, addIssueCommand);
}

async function addAction() {
    const actionDescription = await vscode.window.showInputBox({ prompt: 'Enter a new action' });
    if (actionDescription) {
        const action: Action = { description: actionDescription, isIssue: false };
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

async function completeAction() {
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
        if (selectedAction.action.timerInterval) {
            clearInterval(selectedAction.action.timerInterval);
            statusBarItem.hide();
        }

        if (selectedAction.action.isIssue && selectedAction.action.filePath && selectedAction.action.lineNumber !== undefined) {
            try {
                const document = await vscode.workspace.openTextDocument(selectedAction.action.filePath);
                const edit = new vscode.WorkspaceEdit();
                
                const line = document.lineAt(selectedAction.action.lineNumber);
                const lineRange = line.range;
                
                if (line.text.includes(`// ISSUE: ${selectedAction.action.description}`)) {
                    edit.delete(document.uri, lineRange);
                    await vscode.workspace.applyEdit(edit);
                }
            } catch (error) {
                console.error('Error removing issue comment:', error);
            }
        }

        const actionIndex = actions.findIndex(a => a === selectedAction.action);
        if (actionIndex > -1) {
            actions.splice(actionIndex, 1);
        }

    
        vscode.window.showInformationMessage(
            `Completed: ${selectedAction.action.description}`,
            'Undo'
        ).then(selection => {
            if (selection === 'Undo') {
                actions.push(selectedAction.action);
                vscode.window.showInformationMessage('Action restored');
            }
        });
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
                if (Date.now() >= selectedAction.action.timerEndTime!) {
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

function updateStatusBar(action: Action) {
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
        const action: Action = {
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

export function deactivate() {
    actions.forEach(action => {
        if (action.timerInterval) {
            clearInterval(action.timerInterval);
        }
    });
}