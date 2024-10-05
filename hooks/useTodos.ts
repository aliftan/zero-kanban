import { useCallback } from 'react';
import { Category, Todo } from '../types';
import { firebaseService } from '../services/firebaseService';

export const useTodos = (categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>>) => {
    const handleTodoComplete = useCallback(async (categoryId: string, todoId: string) => {
        try {
            const category = categories.find(cat => cat.id === categoryId);
            if (category) {
                const todo = category.todos.find(t => t.id === todoId);
                if (todo) {
                    const updatedTodo = { ...todo, isCompleted: !todo.isCompleted };
                    await firebaseService.updateTodo(todoId, updatedTodo);
                    setCategories(categories.map(cat => {
                        if (cat.id === categoryId) {
                            return {
                                ...cat,
                                todos: cat.todos.map(t => t.id === todoId ? updatedTodo : t)
                            };
                        }
                        return cat;
                    }));
                }
            }
        } catch (error) {
            console.error("Error completing todo:", error);
        }
    }, [categories, setCategories]);

    const handleTodoUpdate = useCallback(async (categoryId: string, todoId: string, updates: Partial<Todo>, newCategoryId?: string) => {
        try {
            await firebaseService.updateTodo(todoId, updates);

            setCategories(prevCategories => {
                const newCategories = prevCategories.map(category => {
                    if (category.id === categoryId) {
                        const updatedTodos = category.todos.map(todo =>
                            todo.id === todoId ? { ...todo, ...updates } : todo
                        );
                        return { ...category, todos: updatedTodos };
                    }
                    if (newCategoryId && category.id === newCategoryId) {
                        const todoToMove = prevCategories
                            .find(c => c.id === categoryId)?.todos
                            .find(t => t.id === todoId);
                        if (todoToMove) {
                            return {
                                ...category,
                                todos: [...category.todos, { ...todoToMove, ...updates, categoryId: newCategoryId }]
                            };
                        }
                    }
                    return category;
                });

                if (newCategoryId && newCategoryId !== categoryId) {
                    return newCategories.map(category => {
                        if (category.id === categoryId) {
                            return {
                                ...category,
                                todos: category.todos.filter(todo => todo.id !== todoId)
                            };
                        }
                        return category;
                    });
                }

                return newCategories;
            });
        } catch (error) {
            console.error("Error updating todo:", error);
        }
    }, [setCategories]);

    const handleTodoDelete = useCallback(async (categoryId: string, todoId: string) => {
        try {
            await firebaseService.deleteTodo(categoryId, todoId);
            setCategories(categories.map(cat => {
                if (cat.id === categoryId) {
                    return {
                        ...cat,
                        todos: cat.todos.filter(todo => todo.id !== todoId)
                    };
                }
                return cat;
            }));
        } catch (error) {
            console.error("Error deleting todo:", error);
        }
    }, [categories, setCategories]);

    const addTodo = useCallback(async (categoryId: string, content: string) => {
        try {
            const category = categories.find(cat => cat.id === categoryId);
            if (!category) return;

            const newTodo: Omit<Todo, 'id'> = {
                content,
                isCompleted: false,
                categoryId: categoryId,
                position: category.todos.length,
            };
            const addedTodo = await firebaseService.addTodo(categoryId, newTodo);

            setCategories(prevCategories => prevCategories.map(cat => {
                if (cat.id === categoryId) {
                    return {
                        ...cat,
                        todos: [addedTodo, ...cat.todos],
                    };
                }
                return cat;
            }));
        } catch (error) {
            console.error("Error adding todo:", error);
        }
    }, [categories, setCategories]);

    return { handleTodoComplete, handleTodoUpdate, handleTodoDelete, addTodo };
};
