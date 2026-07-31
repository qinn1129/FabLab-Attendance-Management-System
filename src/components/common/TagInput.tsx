import React, { useEffect, useRef, useState } from "react";
import { X, Plus } from "lucide-react";

/**
 * Props for the TagInput component.
 */
interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Pool of suggested tags to show while typing (already-selected tags are filtered out automatically). */
  suggestions?: string[];
  placeholder?: string;
  helperText?: string;
}

/**
 * A clickable tag/chip picker: type to search suggestions (or type a brand
 * new tag), press Enter / click "Add Tag" / click a suggestion to add it as
 * a removable chip. Modeled after the "type-ahead with suggested tags"
 * pattern — free text is always allowed, suggestions are just a shortcut.
 * @param {TagInputProps} props
 * @returns {JSX.Element}
 */
export function TagInput({ label, value, onChange, suggestions = [], placeholder = "Type to search or add a tag...", helperText }: TagInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedValue = value.map(v => v.toLowerCase());
  const filteredSuggestions = suggestions
    .filter(s => s.trim() !== "" && !normalizedValue.includes(s.toLowerCase()))
    .filter(s => query.trim() === "" || s.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (normalizedValue.includes(tag.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...value, tag]);
    setQuery("");
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(query);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      {helperText && <p className="text-xs text-muted-foreground -mt-1">{helperText}</p>}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/20"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="p-0.5 rounded-full hover:bg-emerald-500/25 transition"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {open && filteredSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border sticky top-0 bg-popover">
                Suggestions
              </p>
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={e => e.preventDefault()} // keep input focus so the click registers before blur
                  onClick={() => { addTag(s); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => addTag(query)}
          disabled={!query.trim()}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Tag
        </button>
      </div>
    </div>
  );
}