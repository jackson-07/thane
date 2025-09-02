"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const utilities_1 = require("./utilities");
const constants_1 = require("./constants");
class TaskManager {
    constructor(context) {
        this.context = context;
        this.tasks = [];
        this.storageKey = 'tasks';
        this.loadTasks();
    }
    async addTask(description) {
        if (!description?.trim()) {
            throw new Error('Task description cannot be empty');
        }
        const task = {
            id: utilities_1.Utils.generateId(),
            description: description.trim(),
            createdAt: new Date()
        };
        this.tasks.push(task);
        await this.saveTasks();
        return task;
    }
    getTasks() {
        return [...this.tasks];
    }
    getTask(id) {
        return this.tasks.find(t => t.id === id);
    }
    async removeTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) {
            return false;
        }
        this.tasks.splice(index, 1);
        await this.saveTasks();
        return true;
    }
    async updateTask(id, updates) {
        const task = this.getTask(id);
        if (!task) {
            return false;
        }
        Object.assign(task, updates);
        await this.saveTasks();
        return true;
    }
    async restoreTask(task) {
        this.tasks.push(task);
        await this.saveTasks();
    }
    createTaskItems() {
        return this.tasks.map((task, index) => ({
            label: `${index + 1}. ${task.description}`,
            description: task.timerId ? constants_1.CONSTANTS.FORMATS.TIMER_STATUS : '',
            task
        }));
    }
    loadTasks() {
        const saved = this.context.workspaceState.get(this.storageKey, []);
        this.tasks = saved.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt)
        }));
    }
    async saveTasks() {
        await this.context.workspaceState.update(this.storageKey, this.tasks);
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=taskManager.js.map