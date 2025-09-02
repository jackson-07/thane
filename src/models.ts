export interface Task {
    id: string;
    description: string;
    createdAt: Date;
    timerId?: string;
}

export interface Timer {
    id: string;
    taskId: string;
    startTime: Date;
    endTime: Date;
    interval?: NodeJS.Timeout;
}

export interface TaskItem {
    label: string;
    task: Task;
}