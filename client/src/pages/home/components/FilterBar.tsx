/**
 * Search and filter controls for the Home resource list.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  typeFilter: 'note' | 'pdf' | 'link' | null;
  ownershipFilter: 'mine' | 'others' | 'all' | null;
  favoritesOnly: boolean;
  userEmail?: string | null;
  onSearchChange(value: string): void;
  onClear(): void;
  onTypeChange(value: 'note' | 'pdf' | 'link' | null): void;
  onOwnershipChange(value: 'mine' | 'others' | 'all' | null): void;
  onFavoritesToggle(value: boolean): void;
  onSignOut(): void;
}

/**
 * Search input and type filter controls for the resource list.
 */
export function FilterBar({
  searchQuery,
  typeFilter,
  ownershipFilter,
  favoritesOnly,
  userEmail,
  onSearchChange,
  onClear,
  onTypeChange,
  onOwnershipChange,
  onFavoritesToggle,
  onSignOut,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold">My Resources</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden md:inline">{userEmail}</span>
          <Button variant="outline" onClick={onSignOut} className="text-sm">Sign Out</Button>
        </div>
      </div>
      
      {/* Mobile-friendly filter layout */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 w-full"
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
        
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Type filter */}
          <select
            value={typeFilter || ''}
            onChange={(e) => onTypeChange(e.target.value as 'note' | 'pdf' | 'link' | null || null)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="">All Types</option>
            <option value="note">Notes</option>
            <option value="pdf">PDFs</option>
            <option value="link">Links</option>
          </select>
          
          {/* Ownership filter */}
          <select
            value={ownershipFilter || 'all'}
            onChange={(e) => onOwnershipChange(e.target.value as 'mine' | 'others' | 'all' | null)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="all">All Resources</option>
            <option value="mine">Created by Me</option>
            <option value="others">Created by Others</option>
          </select>
          
          {/* Favorites toggle */}
          <Button
            variant={favoritesOnly ? "default" : "outline"}
            onClick={() => onFavoritesToggle(!favoritesOnly)}
            className="text-sm w-full sm:w-auto"
          >
            {favoritesOnly ? '★ Favorites' : '☆ Favorites'}
          </Button>
        </div>
      </div>
    </div>
  );
}
