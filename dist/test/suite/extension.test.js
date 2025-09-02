"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
const taskManager_1 = require("../../taskManager");
const timerManager_1 = require("../../timerManager");
const commentManager_1 = require("../../commentManager");
suite('Thane Extension Tests', () => {
    let taskManager;
    let timerManager;
    let commentManager;
    setup(async () => {
        const extension = vscode.extensions.getExtension('your.thane');
        await extension?.activate();
        const context = (extension?.exports).getContext();
        taskManager = new taskManager_1.TaskManager(context);
        timerManager = new timerManager_1.TimerManager(context);
        commentManager = new commentManager_1.CommentManager();
    });
    teardown(() => {
        if (timerManager) {
            timerManager.dispose();
        }
    });
    test('Add Task', async () => {
        const description = 'Test task';
        const task = await taskManager.addTask(description);
        assert.strictEqual(task.description, description);
        assert.ok(task.id);
        assert.ok(task.createdAt instanceof Date);
    });
});
//# sourceMappingURL=extension.test.js.map