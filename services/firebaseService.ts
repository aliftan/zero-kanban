import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, writeBatch, query, where, orderBy, setDoc } from 'firebase/firestore';
import { Category, Todo } from '../types';

const firebaseConfig = {
    apiKey: "AIzaSyBYJaEn0p-FZWICr8GEwNY3XEwsxG5rX_8",
    authDomain: "zero-kanban.firebaseapp.com",
    projectId: "zero-kanban",
    storageBucket: "zero-kanban.appspot.com",
    messagingSenderId: "666567612805",
    appId: "1:666567612805:web:2c5426b0c610bb54474cec",
    measurementId: "G-SFQK88YMTW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const firebaseService = {
    getCategories: async (): Promise<Category[]> => {
        if (!db) throw new Error('Firestore is not initialized');
        const categoriesCol = collection(db, 'categories');
        const categorySnapshot = await getDocs(query(categoriesCol, orderBy('position')));
        const categories: Category[] = [];

        for (const categoryDoc of categorySnapshot.docs) {
            const category = categoryDoc.data() as Category;
            category.id = categoryDoc.id;

            const todosCol = collection(db, `categories/${category.id}/todos`);
            const todoSnapshot = await getDocs(query(todosCol, orderBy('position')));
            category.todos = todoSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Todo));

            categories.push(category);
        }

        return categories;
    },

    addCategory: async (title: string): Promise<string> => {
        if (!db) throw new Error('Firestore is not initialized');
        const categoriesCol = collection(db, 'categories');
        const categorySnapshot = await getDocs(categoriesCol);
        const position = categorySnapshot.size;
        const docRef = await addDoc(categoriesCol, { title, position, todos: [] });
        return docRef.id;
    },

    updateCategory: async (categoryId: string, title: string): Promise<void> => {
        await updateDoc(doc(db, 'categories', categoryId), { title });
    },

    deleteCategory: async (categoryId: string): Promise<void> => {
        const batch = writeBatch(db);
        const categoryRef = doc(db, 'categories', categoryId);
        batch.delete(categoryRef);

        const todosCol = collection(db, `categories/${categoryId}/todos`);
        const todoSnapshot = await getDocs(todosCol);
        todoSnapshot.docs.forEach((todoDoc) => {
            batch.delete(todoDoc.ref);
        });

        // Update positions of remaining categories
        const categoriesCol = collection(db, 'categories');
        const categorySnapshot = await getDocs(query(categoriesCol, orderBy('position')));
        categorySnapshot.docs.forEach((catDoc, index) => {
            if (catDoc.id !== categoryId) {
                batch.update(catDoc.ref, { position: index });
            }
        });

        await batch.commit();
    },

    addTodo: async (categoryId: string, todo: Omit<Todo, 'id' | 'position'>): Promise<string> => {
        const todosCol = collection(db, `categories/${categoryId}/todos`);
        const todoSnapshot = await getDocs(todosCol);
        const position = todoSnapshot.size;
        const docRef = await addDoc(todosCol, { ...todo, position, categoryId });
        return docRef.id;
    },

    deleteTodo: async (categoryId: string, todoId: string): Promise<void> => {
        const batch = writeBatch(db);
        const todoRef = doc(db, `categories/${categoryId}/todos`, todoId);
        batch.delete(todoRef);

        // Update positions of remaining todos in the category
        const todosCol = collection(db, `categories/${categoryId}/todos`);
        const todoSnapshot = await getDocs(query(todosCol, orderBy('position')));
        todoSnapshot.docs.forEach((doc, index) => {
            if (doc.id !== todoId) {
                batch.update(doc.ref, { position: index });
            }
        });

        await batch.commit();
    },

    updateTodoPosition: async (result: any, newCategories: Category[]): Promise<void> => {
        const { source, destination, draggableId } = result;
        const batch = writeBatch(db);

        // Find the todo that was moved
        const sourceCategory = newCategories.find(cat => cat.id === source.droppableId);
        if (!sourceCategory) {
            console.error("Source category not found", { source, newCategories });
            return;
        }

        const movedTodo = sourceCategory.todos.find(todo => todo.id === draggableId);
        if (!movedTodo) {
            console.error("Moved todo not found", { draggableId, sourceTodos: sourceCategory.todos });
            return;
        }

        const destCategory = newCategories.find(cat => cat.id === destination.droppableId);
        if (!destCategory) {
            console.error("Destination category not found", { destination, newCategories });
            return;
        }

        if (source.droppableId !== destination.droppableId) {
            // Move between categories
            const sourceTodoRef = doc(db, `categories/${source.droppableId}/todos`, draggableId);
            const destTodoRef = doc(db, `categories/${destination.droppableId}/todos`, draggableId);

            // Delete from source category
            batch.delete(sourceTodoRef);

            // Add to destination category
            batch.set(destTodoRef, {
                ...movedTodo,
                categoryId: destination.droppableId,
                position: destination.index
            });
        }

        // Update positions for all affected todos
        newCategories.forEach((category) => {
            category.todos.forEach((todo, index) => {
                if (todo.position !== index || todo.categoryId !== category.id) {
                    const todoRef = doc(db, `categories/${category.id}/todos`, todo.id);
                    batch.update(todoRef, { position: index, categoryId: category.id });
                }
            });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error in batch commit:", error);
            throw error;
        }
    },

    updateTodo: async (todoId: string, updates: Partial<Todo>): Promise<void> => {
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        let todoRef;
        let oldCategoryId;

        for (const categoryDoc of categoriesSnapshot.docs) {
            const todoDoc = await getDoc(doc(db, `categories/${categoryDoc.id}/todos`, todoId));
            if (todoDoc.exists()) {
                todoRef = todoDoc.ref;
                oldCategoryId = categoryDoc.id;
                break;
            }
        }

        if (!todoRef) {
            throw new Error('Todo not found');
        }

        if (updates.categoryId && updates.categoryId !== oldCategoryId) {
            // Todo is being moved to a new category
            const batch = writeBatch(db);

            // Delete from old category
            batch.delete(todoRef);

            // Add to new category
            const newTodoRef = doc(db, `categories/${updates.categoryId}/todos`, todoId);
            batch.set(newTodoRef, { ...updates, id: todoId });

            await batch.commit();
        } else {
            // Regular update
            await updateDoc(todoRef, updates);
        }
    },

    searchTodos: async (searchTerm: string): Promise<Category[]> => {
        const categories = await firebaseService.getCategories();
        return categories.map(category => ({
            ...category,
            todos: category.todos.filter(todo =>
                todo.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            )
        })).filter(category => category.todos.length > 0);
    }
};