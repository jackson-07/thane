import * as vscode from 'vscode';
import { Task } from './models';
import { Utils } from './utilities';
import { CONSTANTS } from './constants';

export class CommentManager {
    async insertTaskComment(task: Task): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error(CONSTANTS.MESSAGES.NO_EDITOR);
        }

        const commentText = Utils.createCommentText(task.description);
        const position = editor.selection.active;
        const edit = new vscode.WorkspaceEdit();
        
        edit.insert(editor.document.uri, position, `${commentText}\n`);
        await vscode.workspace.applyEdit(edit);
    }
}