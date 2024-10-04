import React from 'react';
import { Todo, Category } from '../types';

interface ItemModalProps {
    isOpen: boolean;
    todo: Todo;
    categories: Category[];
    editContent: string;
    editDescription: string;
    editDueDate: string;
    editTags: string;
    editCategoryId: string;
    editIsCompleted: boolean;
    setEditContent: (content: string) => void;
    setEditDescription: (description: string) => void;
    setEditDueDate: (dueDate: string) => void;
    setEditTags: (tags: string) => void;
    setEditCategoryId: (categoryId: string) => void;
    setEditIsCompleted: (isCompleted: boolean) => void;
    handleUpdate: (updates: Partial<Todo>, newCategoryId: string) => void;
    handleDelete: () => void;
    closeModal: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({
    isOpen,
    todo,
    categories,
    editContent,
    editDescription,
    editDueDate,
    editTags,
    editCategoryId,
    editIsCompleted,
    setEditContent,
    setEditDescription,
    setEditDueDate,
    setEditTags,
    setEditCategoryId,
    setEditIsCompleted,
    handleUpdate,
    handleDelete,
    closeModal,
}) => {
    if (!isOpen) return null;

    const onUpdate = () => {
        const updates: Partial<Todo> = {
            content: editContent,
            description: editDescription,
            dueDate: editDueDate,
            tags: editTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            isCompleted: editIsCompleted,
        };
        handleUpdate(updates, editCategoryId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Todo</h2>
                <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="border border-gray-300 p-3 w-full mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="Todo content"
                />
                <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="border border-gray-300 p-3 w-full mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="Description"
                    rows={3}
                />
                <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="border border-gray-300 p-3 w-full mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.title}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="border border-gray-300 p-3 w-full mb-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                />
                <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="border border-gray-300 p-3 w-full mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    placeholder="Tags (comma-separated)"
                />
                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="markAsDone"
                        checked={editIsCompleted}
                        onChange={(e) => setEditIsCompleted(e.target.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="markAsDone">Mark as done</label>
                </div>
                <div className="flex justify-between">
                    <button
                        onClick={onUpdate}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
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
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors duration-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;