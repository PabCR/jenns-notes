/**
 * Search and filter controls for the Home resource list.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  typeFilter: 'note' | 'pdf' | 'link' | null;
  userEmail?: string | null;
  onSearchChange(value: string): void;
  onClear(): void;
  onTypeChange(value: 'note' | 'pdf' | 'link' | null): void;
  onSignOut(): void;
}

/**
 * Search input and type filter controls for the resource list.
 */
export function FilterBar({
  searchQuery,
  typeFilter,
  userEmail,
  onSearchChange,
  onClear,
  onTypeChange,
  onSignOut,
}: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
      <h1 className="text-3xl font-bold">My Resources</h1>
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="relative flex-1 md:flex-initial md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={onClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={typeFilter || ''}
          onChange={(e) => onTypeChange(e.target.value as 'note' | 'pdf' | 'link' | null || null)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="note">Notes</option>
          <option value="pdf">PDFs</option>
          <option value="link">Links</option>
        </select>
        <span className="text-sm text-gray-600 hidden md:inline">{userEmail}</span>
        <Button variant="outline" onClick={onSignOut}>Sign Out</Button>
      </div>
    </div>
  );
}
