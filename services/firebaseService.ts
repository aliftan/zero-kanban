import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    writeBatch,
    query,
    where,
    orderBy,
    setDoc,
    runTransaction,
    DocumentReference,
    increment
} from 'firebase/firestore';
import { Category, Todo } from '../types';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
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

    getCategory: async (categoryId: string): Promise<Category | null> => {
        const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
        if (!categoryDoc.exists()) return null;

        const category = categoryDoc.data() as Category;
        category.id = categoryDoc.id;

        const todosCol = collection(db, `categories/${category.id}/todos`);
        const todoSnapshot = await getDocs(query(todosCol, orderBy('position')));
        category.todos = todoSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Todo));

        return category;
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

    updateCategoryPositions: async (categories: Category[]): Promise<void> => {
        const batch = writeBatch(db);

        categories.forEach((category, index) => {
            const categoryRef = doc(db, 'categories', category.id);
            batch.update(categoryRef, { position: index });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error updating category positions:", error);
            throw error;
        }
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

    addTodo: async (categoryId: string, todo: Omit<Todo, 'id'>): Promise<Todo> => {
        const todosCol = collection(db, `categories/${categoryId}/todos`);
        const docRef = await addDoc(todosCol, todo);
        const addedTodo = { ...todo, id: docRef.id };

        // Update the todos count in the category document
        const categoryRef = doc(db, 'categories', categoryId);
        await updateDoc(categoryRef, {
            todoCount: increment(1)
        });

        return addedTodo;
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

        await runTransaction(db, async (transaction) => {
            // Fetch the latest data from Firestore
            const sourceCategory = await firebaseService.getCategory(source.droppableId);
            const destCategory = await firebaseService.getCategory(destination.droppableId);

            if (!sourceCategory || !destCategory) {
                throw new Error("Source or destination category not found");
            }

            const movedTodo = sourceCategory.todos.find(todo => todo.id === draggableId);
            if (!movedTodo) {
                throw new Error("Moved todo not found");
            }

            if (source.droppableId !== destination.droppableId) {
                // Move between categories
                const sourceTodoRef = doc(db, `categories/${source.droppableId}/todos`, draggableId);
                const destTodoRef = doc(db, `categories/${destination.droppableId}/todos`, draggableId);

                // Remove from source category
                transaction.delete(sourceTodoRef);

                // Add to destination category
                transaction.set(destTodoRef, {
                    ...movedTodo,
                    categoryId: destination.droppableId,
                    position: destination.index
                });

                // Update positions in source category
                sourceCategory.todos = sourceCategory.todos.filter(todo => todo.id !== draggableId);
                sourceCategory.todos.forEach((todo, index) => {
                    const todoRef = doc(db, `categories/${source.droppableId}/todos`, todo.id);
                    transaction.update(todoRef, { position: index });
                });

                // Update positions in destination category
                destCategory.todos.splice(destination.index, 0, movedTodo);
                destCategory.todos.forEach((todo, index) => {
                    const todoRef = doc(db, `categories/${destination.droppableId}/todos`, todo.id);
                    transaction.update(todoRef, { position: index });
                });
            } else {
                // Move within the same category
                sourceCategory.todos = sourceCategory.todos.filter(todo => todo.id !== draggableId);
                sourceCategory.todos.splice(destination.index, 0, movedTodo);

                // Update positions of all todos in the category
                sourceCategory.todos.forEach((todo, index) => {
                    const todoRef = doc(db, `categories/${source.droppableId}/todos`, todo.id);
                    transaction.update(todoRef, { position: index });
                });
            }

            // Update category documents with new todo arrays
            const sourceCategoryRef = doc(db, 'categories', source.droppableId);
            transaction.update(sourceCategoryRef, { todos: sourceCategory.todos });

            if (source.droppableId !== destination.droppableId) {
                const destCategoryRef = doc(db, 'categories', destination.droppableId);
                transaction.update(destCategoryRef, { todos: destCategory.todos });
            }
        });
    },

    updateTodo: async (todoId: string, updates: Partial<Todo>): Promise<void> => {
        console.log('Firebase updateTodo called with:', { todoId, updates });

        await runTransaction(db, async (transaction) => {
            // Find the current category of the todo
            const categoriesSnapshot = await getDocs(collection(db, 'categories'));
            let currentCategoryId: string | null = null;
            let todoRef: DocumentReference | null = null;

            for (const categoryDoc of categoriesSnapshot.docs) {
                const todoDoc = await transaction.get(doc(db, `categories/${categoryDoc.id}/todos`, todoId));
                if (todoDoc.exists()) {
                    currentCategoryId = categoryDoc.id;
                    todoRef = todoDoc.ref;
                    break;
                }
            }

            if (!todoRef || !currentCategoryId) {
                throw new Error('Todo not found');
            }

            const currentTodoData = (await transaction.get(todoRef)).data() as Todo;

            if (updates.categoryId && updates.categoryId !== currentCategoryId) {
                console.log('Moving todo to new category', { from: currentCategoryId, to: updates.categoryId });

                // Delete from old category
                transaction.delete(todoRef);

                // Add to new category
                const newTodoRef = doc(db, `categories/${updates.categoryId}/todos`, todoId);
                transaction.set(newTodoRef, { ...currentTodoData, ...updates, id: todoId });

                // Update todo counts
                const oldCategoryRef = doc(db, 'categories', currentCategoryId);
                const newCategoryRef = doc(db, 'categories', updates.categoryId);
                transaction.update(oldCategoryRef, { todoCount: increment(-1) });
                transaction.update(newCategoryRef, { todoCount: increment(1) });
            } else {
                console.log('Updating todo in current category', { categoryId: currentCategoryId });
                // Regular update
                transaction.update(todoRef, updates);
            }
        });

        console.log('Firebase update completed');
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

export { db };
