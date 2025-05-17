import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AutocompleteInput, AutocompleteOption } from "./autocomplete-input";

interface MultiAutocompleteProps {
  placeholder: string;
  searchEndpoint: string;
  values?: string[];
  onChange?: (values: string[]) => void;
  selectedIds?: number[];
  onItemSelect?: (id: number | undefined, option?: AutocompleteOption) => void;
  onItemRemove?: (id: number) => void;
  getItemDisplay?: (item: any) => string;
  isLoading?: boolean;
  noResultsText?: string;
  className?: string;
  disabled?: boolean;
  maxItems?: number;
}

export function MultiAutocomplete({
  placeholder,
  searchEndpoint,
  values = [],
  onChange,
  selectedIds = [],
  onItemSelect,
  onItemRemove,
  getItemDisplay = (item: any) => item.name,
  isLoading = false,
  noResultsText = "No results found",
  className = "",
  disabled = false,
  maxItems = 20,
}: MultiAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  
  // Determine if we're using the string-based mode or ID-based mode
  const isIdMode = typeof selectedIds !== "undefined" && 
                  typeof onItemSelect !== "undefined" && 
                  typeof onItemRemove !== "undefined";
                  
  // For string-based mode                  
  const [selectedItems, setSelectedItems] = useState<string[]>(values);
  
  // Keep selected items in sync with external values if in string mode
  useEffect(() => {
    if (!isIdMode && values && JSON.stringify(values) !== JSON.stringify(selectedItems)) {
      setSelectedItems(values);
    }
  }, [values, isIdMode, selectedItems]);
  
  // Add an item in string mode
  const addItem = (value: string) => {
    if (!value.trim() || isIdMode || !onChange) return;
    
    // Check if we're at the max limit
    if (maxItems && selectedItems.length >= maxItems) {
      return;
    }
    
    // Check if the item is already selected
    if (selectedItems.includes(value)) {
      return;
    }
    
    const newItems = [...selectedItems, value];
    setSelectedItems(newItems);
    onChange(newItems);
    setInputValue("");
  };
  
  // Remove an item in string mode
  const removeItem = (index: number) => {
    if (isIdMode) return;
    
    const newItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(newItems);
    onChange?.(newItems);
  };
  
  // Handle selection from autocomplete
  const handleSelect = (option: AutocompleteOption) => {
    console.log("MultiAutocomplete handleSelect called with:", option);
    
    // Special case for isNew flag - pass to parent even without ID
    if (isIdMode && option.isNew) {
      console.log("Handling new item creation:", option);
      onItemSelect?.(undefined, option);
      // Input field clearing is now handled in the AutocompleteInput component
      return;
    }
    
    if (isIdMode && option.id !== undefined) {
      // For ID-based mode, call the provided onItemSelect callback with ID and option
      console.log("Selected existing item with ID:", option.id);
      onItemSelect?.(option.id, option);
    } else {
      // For string-based mode
      console.log("Adding string item:", option.name);
      addItem(option.name);
    }
    // Always clear the input field, regardless of whether we're selecting an existing item or adding a new one
    setInputValue("");
  };
  
  return (
    <div className={`w-full ${className}`}>
      {/* Display selected items */}
      {isIdMode ? (
        // No need to render items here in ID mode, the parent component handles display
        null
      ) : (
        // String mode showing tags for selected items
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedItems.map((item, index) => (
            <div 
              key={`${item}-${index}`} 
              className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5"
            >
              <span className="text-sm">{item}</span>
              {!disabled && (
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Input for adding new items */}
      {(!maxItems || (isIdMode ? selectedIds.length : selectedItems.length) < maxItems) && (
        <AutocompleteInput
          placeholder={placeholder}
          searchEndpoint={searchEndpoint}
          value={inputValue}
          onChange={setInputValue}
          onSelect={handleSelect}
          disabled={disabled || isLoading}
          noResultsText={noResultsText}
        />
      )}
    </div>
  );
}