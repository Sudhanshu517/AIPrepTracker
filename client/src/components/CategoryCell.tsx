import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface CategoryCellProps {
    problemId: number;
    initialCategory: string | null;
}

export function CategoryCell({ problemId, initialCategory }: CategoryCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialCategory || "");
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        setValue(initialCategory || "");
    }, [initialCategory]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const mutation = useMutation({
        mutationFn: async (newCategory: string) => {
            const res = await apiRequest("PATCH", `/api/problems/${problemId}/category`, {
                category: newCategory,
            });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/recent-activity"] });
            setIsEditing(false);
            toast({
                title: "Category updated",
                description: "The category has been updated successfully.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update category.",
                variant: "destructive",
            });
            setIsEditing(false);
            setValue(initialCategory || "");
        },
    });

    const handleSubmit = () => {
        if (!value.trim()) {
            setIsEditing(false);
            setValue(initialCategory || "");
            return;
        }

        if (value.trim() !== initialCategory) {
            mutation.mutate(value.trim());
        } else {
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setValue(initialCategory || "");
        }
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={handleKeyDown}
                className="h-8 w-32"
                placeholder="Add category tags"
            />
        );
    }

    if (!initialCategory) {
        return (
            <div
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary cursor-pointer transition-colors"
            >
                <Plus className="w-3 h-3" />
                <span>Add Category</span>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
        >
            <span className="text-gray-600 dark:text-gray-400 capitalize">
                {initialCategory}
            </span>
        </div>
    );
}
