import React, { useState, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Alert from './Alert';
import TodoItem, { Todo } from './TodoItem';

interface Category {
    id: string;
    title: string;
    todos: Todo[];
}


const KanbanBoard: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newTodoContent, setNewTodoContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddTodo, setShowAddTodo] = useState<{ [key: string]: boolean }>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const toggleAddTodo = (categoryId: string) => {
        setShowAddTodo(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
    };

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 3000);
    };

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories;
        return categories.map(category => ({
            ...category,
            todos: category.todos.filter(todo =>
                todo.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            )
        })).filter(category => category.todos.length > 0);
    }, [categories, searchTerm]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;

        if (source.droppableId !== destination.droppableId) {
            const sourceCategory = categories.find(cat => cat.id === source.droppableId);
            const destCategory = categories.find(cat => cat.id === destination.droppableId);
            if (sourceCategory && destCategory) {
                const sourceTodos = [...sourceCategory.todos];
                const destTodos = [...destCategory.todos];
                const [removed] = sourceTodos.splice(source.index, 1);
                destTodos.splice(destination.index, 0, removed);

                setCategories(
                    categories.map(cat => {
                        if (cat.id === source.droppableId) {
                            return { ...cat, todos: sourceTodos };
                        }
                        if (cat.id === destination.droppableId) {
                            return { ...cat, todos: destTodos };
                        }
                        return cat;
                    })
                );
            }
        } else {
            const category = categories.find(cat => cat.id === source.droppableId);
            if (category) {
                const copiedTodos = [...category.todos];
                const [removed] = copiedTodos.splice(source.index, 1);
                copiedTodos.splice(destination.index, 0, removed);

                setCategories(
                    categories.map(cat => {
                        if (cat.id === source.droppableId) {
                            return { ...cat, todos: copiedTodos };
                        }
                        return cat;
                    })
                );
            }
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setNewCategoryTitle('');
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setModalMode('edit');
        setEditingCategory(category);
        setNewCategoryTitle(category.title);
        setIsModalOpen(true);
    };

    const handleModalSubmit = () => {
        if (newCategoryTitle.trim() === '') return;

        if (modalMode === 'add') {
            setCategories([
                ...categories,
                { id: Date.now().toString(), title: newCategoryTitle, todos: [] },
            ]);
            showAlert('Board created successfully!', 'success');
        } else if (editingCategory) {
            setCategories(categories.map(cat =>
                cat.id === editingCategory.id ? { ...cat, title: newCategoryTitle } : cat
            ));
            showAlert('Board updated successfully!', 'success');
        }

        setIsModalOpen(false);
        setNewCategoryTitle('');
        setEditingCategory(null);
    };

    const deleteCategory = (categoryId: string) => {
        setCategories(categories.filter(cat => cat.id !== categoryId));
        setIsModalOpen(false);
        setEditingCategory(null);
        showAlert('Board deleted successfully!', 'success');
    };

    const handleTodoComplete = (categoryId: string, todoId: string) => {
        setCategories(categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    todos: cat.todos.map(todo =>
                        todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo
                    )
                };
            }
            return cat;
        }));
    };

    const handleTodoUpdate = (currentCategoryId: string, todoId: string, updates: Partial<Todo>) => {
        setCategories(categories.map(cat => {
            if (cat.id === currentCategoryId) {
                const updatedTodos = cat.todos.map(todo =>
                    todo.id === todoId ? { ...todo, ...updates } : todo
                );

                if (updates.categoryId && updates.categoryId !== currentCategoryId) {
                    // Remove the todo from the current category
                    return { ...cat, todos: updatedTodos.filter(todo => todo.id !== todoId) };
                }

                return { ...cat, todos: updatedTodos };
            } else if (updates.categoryId && updates.categoryId === cat.id) {
                // Add the todo to the new category
                const movedTodo = categories
                    .find(c => c.id === currentCategoryId)?.todos
                    .find(t => t.id === todoId);
                if (movedTodo) {
                    return { ...cat, todos: [...cat.todos, { ...movedTodo, ...updates }] };
                }
            }
            return cat;
        }));
    };

    const handleTodoDelete = (categoryId: string, todoId: string) => {
        setCategories(categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    todos: cat.todos.filter(todo => todo.id !== todoId)
                };
            }
            return cat;
        }));
    };

    const addTodo = (categoryId: string) => {
        if (newTodoContent.trim() === '') return;

        setCategories(categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    todos: [
                        {
                            id: Date.now().toString(),
                            content: newTodoContent,
                            isCompleted: false,
                            categoryId: categoryId,
                        },
                        ...cat.todos,
                    ],
                };
            }
            return cat;
        }));
        setNewTodoContent('');
        setShowAddTodo(prev => ({ ...prev, [categoryId]: false }));
        showAlert('Todo added successfully!', 'success');
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
            <header className="bg-indigo-600 text-white p-4 shadow-lg">
                <div className="mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Zero Kanban</h1>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search todos or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 rounded-full text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white transition duration-300 ease-in-out w-64"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-grow overflow-x-auto p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full space-x-6">
                        {filteredCategories.map((category) => (
                            <Droppable key={category.id} droppableId={category.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="bg-white rounded-lg shadow-md p-4 min-w-[350px] flex flex-col h-full"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="font-semibold text-xl text-gray-800">{category.title}</h2>
                                            <button
                                                onClick={() => toggleAddTodo(category.id)}
                                                className="w-6 h-6 border border-indigo-600 rounded flex items-center justify-center text-indigo-600 hover:bg-indigo-100 focus:outline-none transition-colors duration-200"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>

                                        {showAddTodo[category.id] && (
                                            <div className="mb-4">
                                                <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={newTodoContent}
                                                    onChange={(e) => setNewTodoContent(e.target.value)}
                                                    placeholder="New todo content"
                                                    className="border border-gray-300 p-2 w-full mb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addTodo(category.id);
                                                        }
                                                    }}
                                                />
                                                <div className="flex justify-between space-x-2">
                                                    <button
                                                        onClick={() => toggleAddTodo(category.id)}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition duration-300 ease-in-out flex-1"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => addTodo(category.id)}
                                                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out flex-1"
                                                    >
                                                        Add Todo
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex-grow overflow-y-auto">
                                            {category.todos.map((todo, index) => (
                                                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <TodoItem
                                                                {...todo}
                                                                categoryId={category.id}
                                                                categories={categories}
                                                                onComplete={() => handleTodoComplete(category.id, todo.id)}
                                                                onUpdate={(id, updates) => handleTodoUpdate(category.id, id, updates)}
                                                                onDelete={(id) => handleTodoDelete(category.id, id)}
                                                                showAlert={showAlert}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        </div>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        ))}
                        <button
                            onClick={openAddModal}
                            className="bg-white hover:bg-gray-50 text-indigo-600 font-semibold p-4 rounded-lg min-w-[300px] h-16 flex items-center justify-center self-start shadow-md transition duration-300 ease-in-out"
                        >
                            + Add Board
                        </button>
                    </div>
                </DragDropContext>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-96 shadow-xl">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {modalMode === 'add' ? 'Add New Board' : 'Edit Board'}
                        </h2>
                        <input
                            type="text"
                            value={newCategoryTitle}
                            onChange={(e) => setNewCategoryTitle(e.target.value)}
                            placeholder="Board name"
                            className="border border-gray-300 p-3 w-full mb-6 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
                        />
                        <div className="flex justify-between">
                            <button
                                onClick={handleModalSubmit}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out"
                            >
                                {modalMode === 'add' ? 'Add' : 'Update'}
                            </button>
                            {modalMode === 'edit' && editingCategory && (
                                <button
                                    onClick={() => deleteCategory(editingCategory.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out"
                                >
                                    Delete
                                </button>
                            )}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition duration-300 ease-in-out"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {alert && <Alert message={alert.message} type={alert.type} />}
        </div>
    );
};

export default KanbanBoard;