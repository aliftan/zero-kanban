import React, { useState } from "react";

interface TodoItemProps {
    id: string;
    content: string;
    isCompleted: boolean;
    description?: string;
    dueDate?: string;
    tags?: string[];
    categoryId: string;
    categories: { id: string; title: string }[];
    onComplete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Todo>) => void;
    onDelete: (id: string) => void;
    showAlert: (message: string, type: "success" | "error") => void;
}

export interface Todo {
    id: string;
    content: string;
    isCompleted: boolean;
    description?: string;
    dueDate?: string;
    tags?: string[];
    categoryId: string;
}

const TodoItem: React.FC<TodoItemProps> = ({
    id,
    content,
    isCompleted,
    description,
    dueDate,
    tags,
    categoryId,
    categories,
    onComplete,
    onUpdate,
    onDelete,
    showAlert,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [editDescription, setEditDescription] = useState(description || "");
    const [editDueDate, setEditDueDate] = useState(dueDate || "");
    const [editTags, setEditTags] = useState(tags?.join(", ") || "");
    const [editCategoryId, setEditCategoryId] = useState(categoryId);
    const [editIsCompleted, setEditIsCompleted] = useState(isCompleted);

    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onComplete(id);
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
            tags: editTags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag !== ""),
            categoryId: editCategoryId,
            isCompleted: editIsCompleted,
        });
        closeModal();
    };

    const handleDelete = () => {
        onDelete(id);
        closeModal();
    };

    return (
        <>
            <div
                className={`
                p-4 
                mb-3 
                rounded-lg 
                border
                shadow-sm 
                hover:shadow-md 
                transition-all 
                duration-200 
                cursor-pointer 
                ${isCompleted
                        ? "bg-green-100 border-green-300 hover:border-green-400"
                        : "bg-white border-slate-200 hover:border-indigo-200"
                    }
            `}
                onClick={openModal}
            >
                <div className="flex items-center mb-2">
                    <div
                        className={`w-6 h-6 border-2 rounded-full mr-3 flex items-center justify-center cursor-pointer transition-colors duration-200 ${isCompleted
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300 hover:border-indigo-500"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(e);
                        }}
                    >
                        {isCompleted && (
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
                        className={`text-lg ${isCompleted ? "line-through text-gray-500" : "text-gray-700"
                            }`}
                    >
                        {content}
                    </span>
                </div>
                {(description || dueDate || (tags && tags.length > 0)) && (
                    <div className="ml-9 text-sm text-gray-600">
                        {description && <p className="mb-1 line-clamp-2">{description}</p>}
                        {dueDate && (
                            <p className="mb-1 flex items-center">
                                <svg
                                    className="w-4 h-4 mr-1"
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
                                {new Date(dueDate).toLocaleDateString()}
                            </p>
                        )}
                        {tags && tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className={`px-2 py-1 rounded-full text-xs ${isCompleted
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

            {isModalOpen && (
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
                                onClick={handleUpdate}
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
            )}
        </>
    );
};

export default TodoItem;