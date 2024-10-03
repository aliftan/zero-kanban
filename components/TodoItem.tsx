import React, { useState } from 'react';
import Alert from './Alert';

interface TodoItemProps {
    id: string;
    content: string;
    isCompleted: boolean;
    description?: string;
    dueDate?: string;
    tags?: string[];
    onComplete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Todo>) => void;
    onDelete: (id: string) => void;
    showAlert: (message: string, type: 'success' | 'error') => void;
}

export interface Todo {
    id: string;
    content: string;
    isCompleted: boolean;
    description?: string;
    dueDate?: string;
    tags?: string[];
}

const TodoItem: React.FC<TodoItemProps> = ({
    id, content, isCompleted, description, dueDate, tags, onComplete, onUpdate, onDelete, showAlert
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [editDescription, setEditDescription] = useState(description || '');
    const [editDueDate, setEditDueDate] = useState(dueDate || '');
    const [editTags, setEditTags] = useState(tags?.join(', ') || '');

    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onComplete(id);
        showAlert(`Todo marked as ${isCompleted ? 'incomplete' : 'complete'}`, 'success');
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleUpdate = () => {
        onUpdate(id, {
            content: editContent,
            description: editDescription,
            dueDate: editDueDate,
            tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        });
        closeModal();
        showAlert('Todo updated successfully', 'success');
    };

    const handleDelete = () => {
        onDelete(id);
        closeModal();
        showAlert('Todo deleted successfully', 'success');
    };

    return (
        <>
            <div
                className={`bg-white p-4 mb-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer ${isCompleted ? 'bg-green-50' : ''}`}
                onClick={openModal}
            >
                <div className="flex items-center mb-2">
                    <div
                        className={`w-6 h-6 border-2 rounded-full mr-3 flex items-center justify-center cursor-pointer ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                        onClick={handleComplete}
                    >
                        {isCompleted && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className={`text-lg ${isCompleted ? 'line-through text-gray-500' : ''}`}>{content}</span>
                </div>
                {(description || dueDate || tags?.length) && (
                    <div className="ml-9 text-sm text-gray-600">
                        {description && <p className="mb-1">{description}</p>}
                        {dueDate && <p className="mb-1">Due: {new Date(dueDate).toLocaleDateString()}</p>}
                        {tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {tags.map((tag, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Edit Todo</h2>
                        <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="border border-gray-300 p-2 w-full mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Todo content"
                        />
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="border border-gray-300 p-2 w-full mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Description"
                            rows={3}
                        />
                        <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="border border-gray-300 p-2 w-full mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            className="border border-gray-300 p-2 w-full mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tags (comma-separated)"
                        />
                        <div className="flex justify-between">
                            <button 
                                onClick={handleUpdate} 
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                Update
                            </button>
                            <button 
                                onClick={handleDelete} 
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                Delete
                            </button>
                            <button 
                                onClick={closeModal} 
                                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TodoItem;