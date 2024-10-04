export interface Todo {
    id: string;
    content: string;
    isCompleted: boolean;
    description?: string;
    dueDate?: string;
    tags?: string[];
    categoryId: string;
    position: number;
}

export interface Category {
    id: string;
    title: string;
    todos: Todo[];
    position: number;
}