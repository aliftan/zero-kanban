import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import TodoItem, { Todo } from './TodoItem';
import Alert from './Alert';

interface Category {
    id: string;
    title: string;
    todos: Todo[];
}

const KanbanBoard: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newTodoContent, setNewTodoContent] = useState('');
    const [activeCategoryId, setActiveCategoryId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 3000); // Hide alert after 3 seconds
    };

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories;
        return categories.map(category => ({
            ...category,
            todos: category.todos.filter(todo =>
                todo.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                todo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        }));
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

    const handleTodoUpdate = (categoryId: string, todoId: string, updates: Partial<Todo>) => {
        setCategories(categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    todos: cat.todos.map(todo =>
                        todo.id === todoId ? { ...todo, ...updates } : todo
                    )
                };
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
                        ...cat.todos,
                        {
                            id: Date.now().toString(),
                            content: newTodoContent,
                            isCompleted: false
                        },
                    ],
                };
            }
            return cat;
        }));
        setNewTodoContent('');
        setActiveCategoryId('');
        showAlert('Todo added successfully!', 'success');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-blue-600 text-white p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Zero Kanban</h1>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search todos or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-white"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow overflow-x-auto">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full p-4 space-x-4">
                        {filteredCategories.map((category) => (
                            <Droppable key={category.id} droppableId={category.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="bg-gray-200 p-4 rounded-lg min-w-[350px] flex flex-col h-full"
                                    >
                                        <h2
                                            className="font-bold mb-4 text-lg cursor-pointer"
                                            onClick={() => openEditModal(category)}
                                        >
                                            {category.title}
                                        </h2>
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
                                        {!searchTerm && (
                                            category.id === activeCategoryId ? (
                                                <div className="mt-2">
                                                    <input
                                                        type="text"
                                                        value={newTodoContent}
                                                        onChange={(e) => setNewTodoContent(e.target.value)}
                                                        placeholder="New todo content"
                                                        className="border p-2 w-full mb-2 rounded"
                                                    />
                                                    <button onClick={() => addTodo(category.id)} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded w-full">
                                                        Add Todo
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveCategoryId(category.id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded w-full mt-2"
                                                >
                                                    + Add Todo
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        ))}
                        {!searchTerm && (
                            <button
                                onClick={openAddModal}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold p-4 rounded min-w-[300px] h-12 flex items-center justify-center self-start"
                            >
                                + Add Board
                            </button>
                        )}
                    </div>
                </DragDropContext>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">
                            {modalMode === 'add' ? 'Add New Board' : 'Edit Board'}
                        </h2>
                        <input
                            type="text"
                            value={newCategoryTitle}
                            onChange={(e) => setNewCategoryTitle(e.target.value)}
                            placeholder="Board name"
                            className="border p-2 w-full mb-4 rounded"
                        />
                        <div className="flex justify-between">
                            <button onClick={handleModalSubmit} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
                                {modalMode === 'add' ? 'Add' : 'Update'}
                            </button>
                            {modalMode === 'edit' && editingCategory && (
                                <button onClick={() => deleteCategory(editingCategory.id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded">
                                    Delete
                                </button>
                            )}
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-black p-2 rounded">
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