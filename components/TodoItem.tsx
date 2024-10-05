import React, { useState } from "react";
import { Todo, Category } from '../types';
import ItemModal from './ItemModal';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';

interface TodoItemProps {
    todo: Todo;
    categories: Category[];
    onComplete: (categoryId: string, todoId: string) => Promise<void>;
    onUpdate: (updates: Partial<Todo>) => Promise<void>;
    onCategoryChange: (newCategoryId: string) => Promise<void>;
    onDelete: (categoryId: string, todoId: string) => Promise<void>;
    showAlert: (message: string, type: 'success' | 'error') => void;
    provided: DraggableProvided;
    isDragging: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({
    todo,
    categories,
    onComplete,
    onUpdate,
    onCategoryChange,
    onDelete,
    showAlert,
    provided,
    isDragging,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editContent, setEditContent] = useState(todo.content);
    const [editDescription, setEditDescription] = useState(todo.description || '');
    const [editDueDate, setEditDueDate] = useState(todo.dueDate || '');
    const [editTags, setEditTags] = useState(todo.tags?.join(', ') || '');
    const [editCategoryId, setEditCategoryId] = useState(todo.categoryId);
    const [editIsCompleted, setEditIsCompleted] = useState(todo.isCompleted);

    const handleComplete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await onComplete(todo.categoryId, todo.id);
            showAlert("Todo status updated successfully", "success");
        } catch (error) {
            console.error('Failed to update todo status:', error);
            showAlert("Failed to update todo status", "error");
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleUpdate = async (updates: Partial<Todo>) => {
        try {
            if (updates.categoryId && updates.categoryId !== todo.categoryId) {
                await onCategoryChange(updates.categoryId);
            }
            await onUpdate(updates);
            setIsModalOpen(false);
            showAlert("Todo updated successfully", "success");
        } catch (error) {
            console.error('Failed to update todo:', error);
            showAlert("Failed to update todo", "error");
        }
    };

    const handleDelete = async () => {
        try {
            await onDelete(todo.categoryId, todo.id);
            setIsModalOpen(false);
            showAlert("Todo deleted successfully", "success");
        } catch (error) {
            console.error('Failed to delete todo:', error);
            showAlert("Failed to delete todo", "error");
        }
    };

    return (
        <>
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`
                    w-[350px]
                    p-4 
                    mb-3 
                    rounded-lg 
                    border
                    shadow-sm 
                    hover:shadow-md 
                    transition-all 
                    duration-200 
                    cursor-pointer 
                    ${isDragging ? 'opacity-50' : 'opacity-100'}
                    ${todo.isCompleted
                        ? "bg-green-100 border-green-300 hover:border-green-400"
                        : "bg-white border-slate-200 hover:border-indigo-200"
                    }
                `}
                onClick={openModal}
            >
                <div className="flex items-center mb-2">
                    <div
                        className={`flex-shrink-0 w-6 h-6 border-2 rounded-full mr-3 flex items-center justify-center cursor-pointer transition-colors duration-200 ${todo.isCompleted
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-indigo-500"
                            }`}
                        onClick={handleComplete}
                    >
                        {todo.isCompleted && (
                            <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        )}
                    </div>
                    <span
                        className={`text-lg truncate ${todo.isCompleted ? "line-through text-gray-500" : "text-gray-700"
                            }`}
                    >
                        {todo.content}
                    </span>
                </div>
                {(todo.description || todo.dueDate || (todo.tags && todo.tags.length > 0)) && (
                    <div className="ml-9 text-sm text-gray-600">
                        {todo.description && (
                            <p className="mb-1 line-clamp-2 overflow-hidden">
                                {todo.description}
                            </p>
                        )}
                        {todo.dueDate && (
                            <p className="mb-1 flex items-center">
                                <svg
                                    className="w-4 h-4 mr-1 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="truncate">{new Date(todo.dueDate).toLocaleDateString()}</span>
                            </p>
                        )}
                        {todo.tags && todo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {todo.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className={`px-2 py-1 rounded-full text-xs ${todo.isCompleted
                                            ? "bg-green-200 text-green-800"
                                            : "bg-indigo-100 text-indigo-800"
                                            }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ItemModal
                isOpen={isModalOpen}
                todo={todo}
                categories={categories}
                editContent={editContent}
                editDescription={editDescription}
                editDueDate={editDueDate}
                editTags={editTags}
                editCategoryId={editCategoryId}
                editIsCompleted={editIsCompleted}
                setEditContent={setEditContent}
                setEditDescription={setEditDescription}
                setEditDueDate={setEditDueDate}
                setEditTags={setEditTags}
                setEditCategoryId={setEditCategoryId}
                setEditIsCompleted={setEditIsCompleted}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                closeModal={closeModal}
            />
        </>
    );
};

export default TodoItem;
