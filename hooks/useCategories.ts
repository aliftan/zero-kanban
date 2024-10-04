import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { firebaseService } from '../services/firebaseService';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    const fetchCategories = useCallback(async () => {
        console.log("Fetching categories...");
        try {
            const fetchedCategories = await firebaseService.getCategories();
            console.log("Fetched categories:", fetchedCategories);
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }, []);

    useEffect(() => {
        console.log("useEffect in useCategories triggered");
        fetchCategories();
    }, [fetchCategories]);

    const addCategory = async (title: string) => {
        console.log("Adding category:", title);
        try {
            const newCategoryId = await firebaseService.addCategory(title);
            console.log("New category ID:", newCategoryId);
            const newCategory: Category = {
                id: newCategoryId,
                title,
                todos: [],
                position: categories.length
            };
            setCategories(prevCategories => {
                const updatedCategories = [...prevCategories, newCategory];
                console.log("Updated categories after adding:", updatedCategories);
                return updatedCategories;
            });
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const updateCategory = async (id: string, title: string) => {
        console.log("Updating category:", id, title);
        try {
            await firebaseService.updateCategory(id, title);
            setCategories(prevCategories => {
                const updatedCategories = prevCategories.map(cat =>
                    cat.id === id ? { ...cat, title } : cat
                );
                console.log("Updated categories after updating:", updatedCategories);
                return updatedCategories;
            });
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const deleteCategory = async (id: string) => {
        console.log("Deleting category:", id);
        try {
            await firebaseService.deleteCategory(id);
            setCategories(prevCategories => {
                const updatedCategories = prevCategories.filter(cat => cat.id !== id);
                console.log("Updated categories after deleting:", updatedCategories);
                return updatedCategories;
            });
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    const updateCategoryPositions = async (updatedCategories: Category[]) => {
        console.log("Updating category positions:", updatedCategories);
        try {
            await firebaseService.updateCategoryPositions(updatedCategories);
            setCategories(updatedCategories);
            console.log("Category positions updated successfully");
        } catch (error) {
            console.error("Error updating category positions:", error);
        }
    };

    console.log("Current categories in useCategories:", categories);

    return {
        categories,
        setCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        updateCategoryPositions,
        refreshCategories: fetchCategories
    };
};
