import { Task, TaskItem } from "./models";
import { Utils } from "./utilities";
import { CONSTANTS } from "./constants";
import * as vscode from "vscode";

export class TaskManager {
    private tasks: Task[] = [];
    private readonly storageKey = 'tasks';

    constructor(private context: vscode.ExtensionContext) {
        this.loadTasks();
    }

    async addTask(description: string): Promise<Task> {
        if (!description?.trim()) {
            throw new Error('Task description cannot be empty');
        }

        const task: Task = {
            id: Utils.generateId(),
            description: description.trim(),
            createdAt: new Date()
        };

        this.tasks.push(task);
        await this.saveTasks();
        return task;
    }

    getTasks(): Task[] {
        return [...this.tasks];
    }

    getTask(id: string): Task | undefined {
        return this.tasks.find(t => t.id === id);
    }

    async removeTask(id: string): Promise<boolean> {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) {
            return false;
        }
        
        this.tasks.splice(index, 1);
        await this.saveTasks();
        return true;
    }

    async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
        const task = this.getTask(id);
        if (!task) {
            return false;
        }

        Object.assign(task, updates);
        await this.saveTasks();
        return true;
    }

    async restoreTask(task: Task): Promise<void> {
        this.tasks.push(task);
        await this.saveTasks();
    }

    createTaskItems(): TaskItem[] {
        return this.tasks.map((task, index) => ({
            label: `${index + 1}. ${task.description}`,
            description: task.timerId ? CONSTANTS.FORMATS.TIMER_STATUS : '',
            task
        }));
    }

    private loadTasks(): void {
        const saved = this.context.workspaceState.get<Task[]>(this.storageKey, []);
        this.tasks = saved.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt)
        }));
    }

    private async saveTasks(): Promise<void> {
        await this.context.workspaceState.update(this.storageKey, this.tasks);
    }
}