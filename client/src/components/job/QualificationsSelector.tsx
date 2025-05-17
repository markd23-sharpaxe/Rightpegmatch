import { useState } from "react";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface QualificationsSelectorProps {
  type: "required" | "optional";
  selectedQualifications: string[];
  onQualificationAdd: (qualification: string) => void;
  onQualificationRemove: (qualification: string) => void;
}

export default function QualificationsSelector({
  type,
  selectedQualifications,
  onQualificationAdd,
  onQualificationRemove
}: QualificationsSelectorProps) {
  
  const label = type === "required" ? "Required Qualifications" : "Optional Qualifications";
  const description = type === "required" 
    ? "Qualifications that candidates must have" 
    : "Preferred qualifications that would be beneficial";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      
      {/* Selected qualifications display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedQualifications.map(qual => (
          <div 
            key={qual} 
            className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5"
          >
            <span className="text-sm">{qual}</span>
            <button 
              type="button" 
              onClick={() => onQualificationRemove(qual)}
              className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {selectedQualifications.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No {type} qualifications added yet
          </p>
        )}
      </div>
      
      {/* Qualifications input */}
      <MultiAutocomplete
        searchEndpoint="/api/search/qualifications"
        placeholder={`Add ${type} qualifications...`}
        onItemSelect={(id, option) => {
          if (option?.isNew && option?.newValue) {
            // Create a new qualification in the database
            fetch('/api/qualifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: option.newValue })
            })
            .then(res => res.json())
            .then(newQualification => {
              // Add the qualification to the selected list
              onQualificationAdd(newQualification.name);
            })
            .catch(err => {
              console.error('Error creating new qualification:', err);
            });
          } else if (option?.name) {
            onQualificationAdd(option.name);
          }
        }}
        selectedIds={[]} // We're using strings, not IDs
      />
    </div>
  );
}