export const normalizeCategory = (category: string | null | undefined): string => {
    if (!category) return "others"; // Default fallback if absolutely needed, or keep it empty if allowed. 
    // User requested: "When syncing... you may leave category empty (null) if scraper does not provide it."
    // But for manual entry, it's required. 
    // Let's return the input if it's not in the map, but trimmed and lowercased.

    const c = category.toLowerCase().trim();
    if (!c) return "others";

    const map: Record<string, string> = {
        "array": "arrays",
        "arrays": "arrays",
        "linked list": "linked-lists",
        "linked-list": "linked-lists",
        "linked lists": "linked-lists",
        "tree": "trees",
        "trees": "trees",
        "binary tree": "trees",
        "string": "strings",
        "strings": "strings",
        "graph": "graphs",
        "graphs": "graphs",
        "dp": "dynamic-programming",
        "dynamic programming": "dynamic-programming",
        "stack": "stacks",
        "stacks": "stacks",
        "queue": "queues",
        "queues": "queues",
        "heap": "heaps",
        "heaps": "heaps",
        "hash table": "hash-tables",
        "hash map": "hash-tables",
        "sorting": "sorting",
        "searching": "searching",
        "recursion": "recursion",
        "backtracking": "backtracking",
        "greedy": "greedy",
        "bit manipulation": "bit-manipulation",
        "math": "math",
        "geometry": "geometry",
        "design": "design",
        "trie": "tries",
        "union find": "union-find",
        "sliding window": "sliding-window",
        "two pointers": "two-pointers",
    };

    return map[c] ?? c;
};
