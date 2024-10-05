import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { firebaseService } from '../services/firebaseService';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    const fetchCategories = useCallback(async () => {
        try {
            const fetchedCategories = await firebaseService.getCategories();
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const addCategory = async (title: string) => {
        try {
            const newCategoryId = await firebaseService.addCategory(title);
            const newCategory: Category = {
                id: newCategoryId,
                title,
                todos: []
            };
            setCategories(prevCategories => [...prevCategories, newCategory]);
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const updateCategory = async (id: string, title: string) => {
        try {
            await firebaseService.updateCategory(id, title);
            setCategories(prevCategories => 
                prevCategories.map(cat => cat.id === id ? { ...cat, title } : cat)
            );
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            await firebaseService.deleteCategory(id);
            setCategories(prevCategories => prevCategories.filter(cat => cat.id !== id));
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    return {
        categories,
        setCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        refreshCategories: fetchCategories
    };
};
