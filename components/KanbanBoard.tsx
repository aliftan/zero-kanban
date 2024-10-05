import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Category, Todo } from '../types';
import { firebaseService } from '../services/firebaseService';
import Header from './Header';
import BoardList from './BoardList';
import CategoryModal from './CategoryModal';
import Alert from './Alert';
import { useCategories } from '../hooks/useCategories';
import { useTodos } from '../hooks/useTodos';

export const KanbanBoard: React.FC = () => {
    const [isClient, setIsClient] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const {
        categories,
        setCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        refreshCategories
    } = useCategories();
    const { handleTodoComplete, handleTodoDelete, addTodo } = useTodos(categories, setCategories);

    useEffect(() => {
        setIsClient(true);
        refreshCategories();
    }, [refreshCategories]);

    const showAlert = useCallback((message: string, type: 'success' | 'error') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 3000);
    }, []);

    const handleTodoUpdate = async (categoryId: string, todoId: string, updates: Partial<Todo>, newCategoryId?: string) => {
        console.log('handleTodoUpdate called with:', { categoryId, todoId, updates, newCategoryId });
        try {
            const updatedCategories = categories.map(category => {
                if (category.id === (newCategoryId || categoryId)) {
                    const updatedTodos = category.todos.map(todo =>
                        todo.id === todoId ? { ...todo, ...updates, categoryId: newCategoryId || categoryId } : todo
                    );
                    if (category.id === newCategoryId && !category.todos.some(todo => todo.id === todoId)) {
                        const todoToMove = categories.find(c => c.id === categoryId)?.todos.find(t => t.id === todoId);
                        if (todoToMove) {
                            updatedTodos.push({ ...todoToMove, ...updates, categoryId: newCategoryId });
                        }
                    }
                    return { ...category, todos: updatedTodos };
                } else if (category.id === categoryId && newCategoryId) {
                    return { ...category, todos: category.todos.filter(todo => todo.id !== todoId) };
                }
                return category;
            });

            console.log('Updating local state with:', updatedCategories);
            setCategories(updatedCategories);

            const firebaseUpdates = {
                ...updates,
                categoryId: newCategoryId || categoryId
            };
            console.log('Sending updates to Firebase:', firebaseUpdates);

            await firebaseService.updateTodo(todoId, firebaseUpdates);
            showAlert('Todo updated successfully', 'success');
        } catch (error) {
            console.error("Error updating todo:", error);
            showAlert('Failed to update todo', 'error');
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        // Only handle todo drag, category drag is removed
        const newCategories = [...categories];
        const sourceCategory = newCategories.find(cat => cat.id === source.droppableId);
        const destCategory = newCategories.find(cat => cat.id === destination.droppableId);

        if (!sourceCategory || !destCategory) return;

        const [movedTodo] = sourceCategory.todos.splice(source.index, 1);

        if (source.droppableId !== destination.droppableId) {
            // Move between categories
            destCategory.todos.splice(destination.index, 0, { ...movedTodo, categoryId: destination.droppableId });
        } else {
            // Move within the same category
            sourceCategory.todos.splice(destination.index, 0, movedTodo);
        }

        setCategories(newCategories);

        try {
            await firebaseService.updateTodoPosition(result, newCategories);
            showAlert('Todo position updated successfully', 'success');
        } catch (error) {
            console.error("Error updating todo position:", error);
            showAlert('Failed to update todo position', 'error');

            // Revert the local state if the database update fails
            setCategories(categories);
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setModalMode('edit');
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCategorySubmit = async (title: string) => {
        try {
            if (modalMode === 'add') {
                await addCategory(title);
                showAlert('Category added successfully', 'success');
            } else if (modalMode === 'edit' && editingCategory) {
                await updateCategory(editingCategory.id, title);
                showAlert('Category updated successfully', 'success');
            }
            setIsModalOpen(false);
            await refreshCategories(); // Refresh categories to ensure UI is up-to-date
        } catch (error) {
            console.error("Error handling category submit:", error);
            showAlert('Failed to submit category', 'error');
        }
    };

    const handleCategoryDelete = async () => {
        if (editingCategory) {
            try {
                await deleteCategory(editingCategory.id);
                showAlert('Category deleted successfully', 'success');
                setIsModalOpen(false);
                await refreshCategories(); // Refresh categories to ensure UI is up-to-date
            } catch (error) {
                console.error("Error deleting category:", error);
                showAlert('Failed to delete category', 'error');
            }
        }
    };

    if (!isClient) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
            <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <DragDropContext onDragEnd={onDragEnd}>
                <BoardList
                    categories={categories}
                    searchTerm={searchTerm}
                    openEditModal={openEditModal}
                    handleTodoComplete={handleTodoComplete}
                    handleTodoUpdate={handleTodoUpdate}
                    handleTodoDelete={handleTodoDelete}
                    addTodo={addTodo}
                    showAlert={showAlert}
                />
            </DragDropContext>

            <button onClick={openAddModal} className="fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg">
                + Add Board
            </button>

            {isModalOpen && (
                <CategoryModal
                    mode={modalMode}
                    category={editingCategory}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCategorySubmit}
                    onDelete={handleCategoryDelete}
                />
            )}
            {alert && <Alert message={alert.message} type={alert.type} />}
        </div>
    );
};
