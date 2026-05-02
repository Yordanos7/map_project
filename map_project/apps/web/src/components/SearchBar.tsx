import { useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);

    return (
        <div className={`relative transition-all ${focused ? "w-80" : "w-64"}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search places, coordinates, admin units..."
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-card/90 backdrop-blur-md border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
            {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
