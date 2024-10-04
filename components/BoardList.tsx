import React from 'react';
import { Droppable, DroppableProvided } from 'react-beautiful-dnd';
import { Category, Todo } from '../types';
import BoardColumn from './BoardColumn';

interface BoardListProps {
    categories: Category[];
    searchTerm: string;
    openEditModal: (category: Category) => void;
    handleTodoComplete: (categoryId: string, todoId: string) => Promise<void>;
    handleTodoUpdate: (categoryId: string, todoId: string, updates: Partial<Todo>, newCategoryId?: string) => Promise<void>;
    handleTodoDelete: (categoryId: string, todoId: string) => Promise<void>;
    addTodo: (categoryId: string, content: string) => Promise<void>;
    showAlert: (message: string, type: 'success' | 'error') => void;
}

const BoardList: React.FC<BoardListProps> = ({
    categories,
    searchTerm,
    openEditModal,
    handleTodoComplete,
    handleTodoUpdate,
    handleTodoDelete,
    addTodo,
    showAlert,
}) => {
    const filteredCategories = searchTerm
        ? categories.filter(category =>
            category.todos.some(todo =>
                todo.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            )
        )
        : categories;

    return (
        <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
            {(provided: DroppableProvided) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex h-full space-x-6 p-6 overflow-x-auto"
                >
                    {filteredCategories.map((category, index) => (
                        <BoardColumn
                            key={category.id}
                            category={category}
                            allCategories={categories}
                            index={index}
                            openEditModal={openEditModal}
                            handleTodoComplete={handleTodoComplete}
                            handleTodoUpdate={handleTodoUpdate}
                            handleTodoDelete={handleTodoDelete}
                            addTodo={addTodo}
                            showAlert={showAlert}
                        />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default BoardList;
