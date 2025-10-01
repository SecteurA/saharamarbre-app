import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Menu,
  MenuList,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { debounce } from 'lodash';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: Array<{ value: string | number; label: string }>;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface SearchFilters {
  search?: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  placeholder?: string;
  filterOptions?: FilterOption[];
  sortOptions?: Array<{ key: string; label: string }>;
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  enableQuickFilters?: boolean;
  quickFilters?: Array<{ label: string; filters: Record<string, any> }>;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  placeholder = "Search...",
  filterOptions = [],
  sortOptions = [],
  onFiltersChange,
  initialFilters = { filters: {} },
  enableQuickFilters = false,
  quickFilters = []
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [activeFilters, setActiveFilters] = useState(initialFilters.filters || {});
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialFilters.sortDirection || 'asc');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((term: string, filters: Record<string, any>, sort?: string, direction?: 'asc' | 'desc') => {
      onFiltersChange({
        search: term,
        filters,
        sortBy: sort,
        sortDirection: direction
      });
    }, 300),
    [onFiltersChange]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    debouncedSearch(term, activeFilters, sortBy, sortDirection);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters };
    
    if (value === '' || value === null || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    setActiveFilters(newFilters);
    debouncedSearch(searchTerm, newFilters, sortBy, sortDirection);
  };

  const handleSortChange = (key: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (sortBy === key) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortBy(key);
    setSortDirection(newDirection);
    setSortMenuAnchor(null);
    debouncedSearch(searchTerm, activeFilters, key, newDirection);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveFilters({});
    setSortBy('');
    setSortDirection('asc');
    onFiltersChange({
      search: '',
      filters: {}
    });
  };

  const applyQuickFilter = (filters: Record<string, any>) => {
    setActiveFilters({ ...activeFilters, ...filters });
    debouncedSearch(searchTerm, { ...activeFilters, ...filters }, sortBy, sortDirection);
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length + (searchTerm ? 1 : 0);
  };

  const renderFilterOption = (option: FilterOption) => {
    const value = activeFilters[option.key] || '';

    switch (option.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{option.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFilterChange(option.key, e.target.value)}
              label={option.label}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {option.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            fullWidth
            size="small"
            type="date"
            label={option.label}
            value={value}
            onChange={(e) => handleFilterChange(option.key, e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            label={option.label}
            value={value}
            onChange={(e) => handleFilterChange(option.key, e.target.value)}
            sx={{ minWidth: 120 }}
          />
        );

      case 'boolean':
        return (
          <FormControl fullWidth size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{option.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFilterChange(option.key, e.target.value)}
              label={option.label}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
            fullWidth
            size="small"
            label={option.label}
            value={value}
            onChange={(e) => handleFilterChange(option.key, e.target.value)}
            sx={{ minWidth: 150 }}
          />
        );
    }
  };

  return (
    <Box>
      {/* Main Search Bar */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    debouncedSearch('', activeFilters, sortBy, sortDirection);
                  }}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {/* Filter Button */}
        <IconButton
          onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          color={getActiveFilterCount() > 0 ? 'primary' : 'default'}
        >
          <FilterIcon />
          {getActiveFilterCount() > 0 && (
            <Chip
              label={getActiveFilterCount()}
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 20,
                height: 20,
                fontSize: '0.75rem'
              }}
            />
          )}
        </IconButton>

        {/* Sort Button */}
        {sortOptions.length > 0 && (
          <IconButton
            onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            color={sortBy ? 'primary' : 'default'}
          >
            <SortIcon />
            {sortBy && (
              sortDirection === 'asc' ? <ArrowUpward sx={{ ml: 0.5, fontSize: 16 }} /> : <ArrowDownward sx={{ ml: 0.5, fontSize: 16 }} />
            )}
          </IconButton>
        )}

        {/* Clear All Button */}
        {getActiveFilterCount() > 0 && (
          <IconButton onClick={clearAllFilters} color="error" size="small">
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      {/* Quick Filters */}
      {enableQuickFilters && quickFilters.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
            Quick filters:
          </Typography>
          {quickFilters.map((filter, index) => (
            <Chip
              key={index}
              label={filter.label}
              onClick={() => applyQuickFilter(filter.filters)}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}

      {/* Active Filters Display */}
      {Object.keys(activeFilters).length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
            Active filters:
          </Typography>
          {Object.entries(activeFilters).map(([key, value]) => {
            const option = filterOptions.find(opt => opt.key === key);
            const displayValue = option?.options?.find(opt => opt.value === value)?.label || value;
            
            return (
              <Chip
                key={key}
                label={`${option?.label || key}: ${displayValue}`}
                onDelete={() => handleFilterChange(key, null)}
                size="small"
                color="primary"
                variant="filled"
              />
            );
          })}
        </Box>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 300, maxWidth: 500 } }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filterOptions.map((option) => (
              <Box key={option.key}>
                {renderFilterOption(option)}
              </Box>
            ))}
          </Box>
        </Paper>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuList>
          {sortOptions.map((option) => (
            <MenuItem
              key={option.key}
              onClick={() => handleSortChange(option.key)}
              selected={sortBy === option.key}
            >
              <ListItemIcon>
                {sortBy === option.key && (
                  sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />
                )}
              </ListItemIcon>
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
          {sortBy && (
            <>
              <Divider />
              <MenuItem
                onClick={() => {
                  setSortBy('');
                  setSortDirection('asc');
                  setSortMenuAnchor(null);
                  debouncedSearch(searchTerm, activeFilters);
                }}
              >
                <ListItemIcon>
                  <ClearIcon />
                </ListItemIcon>
                <ListItemText primary="Clear Sort" />
              </MenuItem>
            </>
          )}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default AdvancedSearch;