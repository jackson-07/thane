import * as vscode from 'vscode';

interface Action {
    description: string;
    timer?: number;
    commentId?: string;
    timerEndTime?: number;
    timerInterval?: NodeJS.Timeout;
}

interface Comment {
    id: string;
    description: string;
    filePath: string;
    actionDescription: string;
}

let actions: Action[] = [];
let comments: Comment[] = [];
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

    let convertToCommentCommand = vscode.commands.registerCommand('actionmanager.convertToComment', convertToComment);
    let removeCommentCommand = vscode.commands.registerCommand('actionmanager.removeComment', removeComment);

    context.subscriptions.push(addActionCommand, showActionsCommand, completeActionCommand, startTimerCommand, stopTimerCommand, convertToCommentCommand, removeCommentCommand);
}

async function addAction() {
    const actionDescription = await vscode.window.showInputBox({ prompt: 'Enter a new action' });
    if (actionDescription) {
        const action: Action = { description: actionDescription };
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
        label: `${index + 1}. ${action.commentId ? '[COMMENT] ' : ''}${action.description}`,
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
        label: `${index + 1}. ${action.commentId ? '[COMMENT] ' : ''}${action.description}`,
        description: action.timer ? `${action.timer} minutes` : '',
        action: action
    }));

    const selectedAction = await vscode.window.showQuickPick(actionItems, { canPickMany: false });
    if (selectedAction) {
        if (selectedAction.action.timerInterval) {
            clearInterval(selectedAction.action.timerInterval);
            statusBarItem.hide();
        }

        if (selectedAction.action.commentId) {
            await removeComment(selectedAction.action.commentId);
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

async function convertToComment() {
    const actionItems = actions.filter(action => !action.commentId).map((action, index) => ({
        label: `${index + 1}. ${action.description}`,
        action: action
    }));

    if (actionItems.length === 0) {
        vscode.window.showInformationMessage('No actions to convert to comment!');
        return;
    }

    const selectedAction = await vscode.window.showQuickPick(actionItems, { canPickMany: false });
    if (selectedAction) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const commentId = generateUniqueId();
            const commentText = `// TO DO: ${selectedAction.action.description} [ID: ${commentId}]`;
            
            const position = editor.selection.active;
            const edit = new vscode.WorkspaceEdit();
            edit.insert(editor.document.uri, position, `${commentText}\n`);
            await vscode.workspace.applyEdit(edit);
            
            const comment: Comment = {
                id: commentId,
                description: selectedAction.action.description,
                filePath: editor.document.uri.fsPath,
                actionDescription: selectedAction.action.description
            };
            
            comments.push(comment);
            selectedAction.action.commentId = commentId;
            
            vscode.window.showInformationMessage(`Action "${selectedAction.action.description}" converted to comment`);
        }
    }
}

async function removeComment(commentId?: string) {
    let targetComment: Comment | undefined;
    
    if (commentId) {
        targetComment = comments.find(c => c.id === commentId);
    } else {
        if (comments.length === 0) {
            vscode.window.showInformationMessage('No comments to remove.');
            return;
        }
        
        const commentItems = comments.map((comment, index) => ({
            label: `${index + 1}. ${comment.description}`,
            description: comment.filePath,
            comment: comment
        }));
        
        const selectedComment = await vscode.window.showQuickPick(commentItems, { canPickMany: false });
        if (selectedComment) {
            targetComment = selectedComment.comment;
        }
    }
    
    if (!targetComment) return;
    
    try {
        const document = await vscode.workspace.openTextDocument(targetComment.filePath);
        const edit = new vscode.WorkspaceEdit();
        
        let found = false;
        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex);
            
            if (line.text.includes(`[ID: ${targetComment.id}]`)) {
                const lineRange = document.lineAt(lineIndex).rangeIncludingLineBreak;
                edit.delete(document.uri, lineRange);
                found = true;
                break;
            }
        }
        
        if (found) {
            await vscode.workspace.applyEdit(edit);
            
            const commentIndex = comments.findIndex(c => c.id === targetComment!.id);
            if (commentIndex > -1) {
                comments.splice(commentIndex, 1);
            }
            
            const associatedAction = actions.find(a => a.commentId === targetComment!.id);
            if (associatedAction) {
                associatedAction.commentId = undefined;
            }
            
            vscode.window.showInformationMessage(`Comment removed: ${targetComment.description}`);
        } else {
            vscode.window.showWarningMessage('Comment not found in file - it may have been manually removed');
            
            const commentIndex = comments.findIndex(c => c.id === targetComment!.id);
            if (commentIndex > -1) {
                comments.splice(commentIndex, 1);
            }
        }
        
    } catch (error) {
        console.error('Error removing comment:', error);
        vscode.window.showWarningMessage('Could not access file to remove comment');
    }
}

function generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export function deactivate() {
    actions.forEach(action => {
        if (action.timerInterval) {
            clearInterval(action.timerInterval);
        }
    });
}