import React, { useState } from 'react';
import { Droppable, DroppableProvided, Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Category, Todo } from '../types';
import TodoItem from './TodoItem';

interface BoardColumnProps {
    category: Category;
    allCategories: Category[];
    openEditModal: (category: Category) => void;
    handleTodoComplete: (categoryId: string, todoId: string) => Promise<void>;
    handleTodoUpdate: (categoryId: string, todoId: string, updates: Partial<Todo>) => Promise<void>;
    handleTodoDelete: (categoryId: string, todoId: string) => Promise<void>;
    addTodo: (categoryId: string, content: string) => Promise<void>;
    showAlert: (message: string, type: 'success' | 'error') => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
    category,
    allCategories,
    openEditModal,
    handleTodoComplete,
    handleTodoUpdate,
    handleTodoDelete,
    addTodo,
    showAlert,
}) => {
    const [newTodoContent, setNewTodoContent] = useState('');
    const [isAddingTodo, setIsAddingTodo] = useState(false);

    const handleAddTodo = async () => {
        if (newTodoContent.trim()) {
            try {
                await addTodo(category.id, newTodoContent);
                setNewTodoContent('');
                setIsAddingTodo(false);
                showAlert('Todo added successfully', 'success');
            } catch (error) {
                console.error("Error adding todo:", error);
                showAlert('Failed to add todo', 'error');
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 min-w-[350px] flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2
                    className="font-semibold text-xl text-gray-800 cursor-pointer"
                    onClick={() => openEditModal(category)}
                >
                    {category.title}
                </h2>
                <button
                    onClick={() => setIsAddingTodo(!isAddingTodo)}
                    className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {isAddingTodo && (
                <div className="mb-4">
                    <input
                        type="text"
                        value={newTodoContent}
                        onChange={(e) => setNewTodoContent(e.target.value)}
                        placeholder="New todo content"
                        className="border border-gray-300 p-2 w-full mb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAddTodo();
                            }
                        }}
                    />
                    <div className="flex justify-between space-x-2">
                        <button
                            onClick={() => setIsAddingTodo(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition duration-300 ease-in-out flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddTodo}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out flex-1"
                        >
                            Add Todo
                        </button>
                    </div>
                </div>
            )}

            <Droppable droppableId={category.id} type="TODO" mode="standard" direction="vertical">
                {(droppableProvided: DroppableProvided, droppableSnapshot) => (
                    <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                        className={`flex-grow overflow-y-auto ${
                            droppableSnapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                    >
                        {category.todos && category.todos.length > 0 ? (
                            category.todos.map((todo, todoIndex) => (
                                <Draggable key={todo.id} draggableId={todo.id} index={todoIndex}>
                                    {(draggableProvided: DraggableProvided, draggableSnapshot: DraggableStateSnapshot) => (
                                        <TodoItem
                                            todo={todo}
                                            categories={allCategories}
                                            onComplete={() => handleTodoComplete(category.id, todo.id)}
                                            onUpdate={(updates: Partial<Todo>) => handleTodoUpdate(category.id, todo.id, updates)}
                                            onCategoryChange={(newCategoryId: string) =>
                                                handleTodoUpdate(category.id, todo.id, { categoryId: newCategoryId })}
                                            onDelete={() => handleTodoDelete(category.id, todo.id)}
                                            showAlert={showAlert}
                                            provided={draggableProvided}
                                            isDragging={draggableSnapshot.isDragging}
                                        />
                                    )}
                                </Draggable>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center">No todos in this category</p>
                        )}
                        {droppableProvided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default BoardColumn;
