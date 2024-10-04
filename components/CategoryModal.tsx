import React, { useState, useEffect } from 'react';
import { Category } from '../types';

interface CategoryModalProps {
    mode: 'add' | 'edit';
    category: Category | null;
    onClose: () => void;
    onSubmit: (title: string) => void;
    onDelete: (id: string) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ mode, category, onClose, onSubmit, onDelete }) => {
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (mode === 'edit' && category) {
            setTitle(category.title);
        }
    }, [mode, category]);

    const handleSubmit = () => {
        if (title.trim()) {
            onSubmit(title);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-96 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    {mode === 'add' ? 'Add New Board' : 'Edit Board'}
                </h2>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Board name"
                    className="border border-gray-300 p-3 w-full mb-6 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
                />
                <div className="flex justify-between">
                    <button
                        onClick={handleSubmit}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out"
                    >
                        {mode === 'add' ? 'Add' : 'Update'}
                    </button>
                    {mode === 'edit' && category && (
                        <button
                            onClick={() => onDelete(category.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition duration-300 ease-in-out"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;