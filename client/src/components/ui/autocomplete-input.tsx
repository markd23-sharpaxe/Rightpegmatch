import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export interface AutocompleteOption {
  id?: number;
  name: string;
  code?: string;
  [key: string]: any;
}

interface AutocompleteInputProps {
  placeholder: string;
  searchEndpoint?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  className?: string;
  disabled?: boolean;
  noResultsText?: string;
  options?: AutocompleteOption[];
  allowCustomValue?: boolean;
}

export function AutocompleteInput({
  placeholder,
  searchEndpoint,
  value,
  onChange,
  onSelect,
  className = "",
  disabled = false,
  noResultsText = "No results found",
  options: providedOptions,
  allowCustomValue = false,
}: AutocompleteInputProps) {
  const [query, setQuery] = useState(value || "");
  const [options, setOptions] = useState<AutocompleteOption[]>(providedOptions || []);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  
  // Filter provided options based on query or fetch from API
  useEffect(() => {
    // If we have provided options, just filter them locally
    if (providedOptions) {
      if (!query || !query.trim()) {
        setOptions(providedOptions);
      } else {
        const filtered = providedOptions.filter(option => 
          option.name.toLowerCase().includes(query.toLowerCase())
        );
        setOptions(filtered);
      }
      return;
    }
    
    // Otherwise, if we have a searchEndpoint, fetch from API
    if (!searchEndpoint || query === value) return;
    
    const handler = setTimeout(async () => {
      if (!query || !query.trim()) {
        setOptions([]);
        return;
      }
      
      setLoading(true);
      try {
        // Use the correct query parameter format based on the endpoint
        const endpoint = searchEndpoint; // Copying to variable to avoid undefined check issues
        const queryParam = endpoint.includes('/api/search/') ? 'q' : 'query';
        const res = await apiRequest("GET", `${endpoint}?${queryParam}=${encodeURIComponent(query)}`);
        
        if (!res.ok) {
          throw new Error(`API responded with status ${res.status}`);
        }
        
        const data = await res.json();
        setOptions(data);
      } catch (error) {
        console.error("Error fetching autocomplete options:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(handler);
  }, [query, searchEndpoint, value, providedOptions]);
  
  // Handle arrow key navigation and Enter selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showOptions) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          selectOption(options[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowOptions(false);
        break;
    }
  };
  
  // Select an option
  const selectOption = (option: AutocompleteOption) => {
    // For both new and existing items, we want to immediately notify the parent component
    if (onSelect) onSelect(option);
    
    // Clear the input field immediately after selection in all cases
    // This gives a better UX, especially when adding multiple items in sequence
    setQuery("");
    onChange("");
    
    // In all cases, close the dropdown and reset highlight
    setShowOptions(false);
    setHighlightedIndex(-1);
  };
  
  // Update internal state when value changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        optionsRef.current && 
        !optionsRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowOptions(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setShowOptions(true)}
        onKeyDown={handleKeyDown}
        className={className}
        disabled={disabled}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {showOptions && (
        <div 
          ref={optionsRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {options.length > 0 ? (
            <>
              {options.map((option, index) => (
                <div
                  key={option.id || option.code || option.name}
                  onClick={() => selectOption(option)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                    index === highlightedIndex ? "bg-gray-100" : ""
                  }`}
                >
                  {option.name}
                </div>
              ))}
              
              {/* Show "Add as new item" option when applicable */}
              {query.trim() !== "" && (
                (searchEndpoint === "/api/search/job-roles" && (
                  <div 
                    onClick={() => selectOption({ name: query.trim(), isNew: true, newValue: query.trim() })}
                    className="px-3 py-2 cursor-pointer hover:bg-primary/10 border-t flex items-center gap-1.5 text-primary"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add "{query.trim()}" as new job role</span>
                  </div>
                )) ||
                (searchEndpoint === "/api/search/skills" && (
                  <div 
                    onClick={() => selectOption({ name: query.trim(), isNew: true, newValue: query.trim() })}
                    className="px-3 py-2 cursor-pointer hover:bg-primary/10 border-t flex items-center gap-1.5 text-primary"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add "{query.trim()}" as new skill</span>
                  </div>
                )) ||
                (searchEndpoint === "/api/search/qualifications" && (
                  <div 
                    onClick={() => selectOption({ id: -1, name: `Create new: ${query.trim()}`, isNew: true, newValue: query.trim() })}
                    className="px-3 py-2 cursor-pointer hover:bg-primary/10 border-t flex items-center gap-1.5 text-primary"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add "{query.trim()}" as new qualification</span>
                  </div>
                ))
              )}
            </>
          ) : (
            query.trim() !== "" && !loading && (
              <>
                <div className="px-3 py-2 text-muted-foreground text-sm">
                  {noResultsText}
                </div>
                {(searchEndpoint === "/api/search/job-roles" && (
                  <div 
                    onClick={() => selectOption({ name: query.trim(), isNew: true, newValue: query.trim() })}
                    className="px-3 py-2 cursor-pointer hover:bg-primary/10 border-t flex items-center gap-1.5 text-primary"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add "{query.trim()}" as new job role</span>
                  </div>
                )) || 
                (searchEndpoint === "/api/search/skills" && (
                  <div 
                    onClick={() => selectOption({ name: query.trim(), isNew: true, newValue: query.trim() })}
                    className="px-3 py-2 cursor-pointer hover:bg-primary/10 border-t flex items-center gap-1.5 text-primary"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add "{query.trim()}" as new skill</span>
                  </div>
                )) ||
                (searchEndpoint === "/api/search/qualifications" && (
                  <div 
                    onClick={() => selectOption({ id: -1, name: `Create new: ${query.trim()}`, isNew: true, newValue: query.trim() })}
                    className="px-3 py-2 cursor-pointer hover:bg-primary/10 border-t flex items-center gap-1.5 text-primary"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add "{query.trim()}" as new qualification</span>
                  </div>
                ))}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}