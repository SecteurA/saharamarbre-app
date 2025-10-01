import React, { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  LinearProgress,
  TableSortLabel,
  Toolbar,
  alpha,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import AdvancedSearch from '../AdvancedSearch';
import type { SearchFilters } from '../AdvancedSearch';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number' | 'boolean';
  filterOptions?: { value: any; label: string }[];
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  totalCount?: number;
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  selectable?: boolean;
  selectedRows?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  emptyMessage?: string;
  title: string;
  // Search and pagination props
  searchEnabled?: boolean;
  onSearch?: (filters: SearchFilters) => void;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  page?: number;
  rowsPerPage?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  // External pagination mode
  serverSide?: boolean;
  // Actions
  onRowAction?: (action: 'view' | 'edit' | 'delete', row: any) => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (row: any) => void;
    color?: 'primary' | 'secondary' | 'error';
  }>;
}

export default function DataTable({
  columns,
  rows,
  totalCount,
  loading = false,
  onEdit,
  onDelete,
  onView,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  emptyMessage = "Aucune donnée disponible",
  title,
  searchEnabled = true,
  onSearch,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  page = 0,
  rowsPerPage: initialPageSize = 25,
  sortField,
  sortDirection,
  serverSide = false,
  onRowAction,
  actions
}: DataTableProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowData, setSelectedRowData] = useState<any>(null);

  const handleSort = (columnId: string) => {
    if (!onSort) return;
    
    const isAsc = sortField === columnId && sortDirection === 'asc';
    const direction = isAsc ? 'desc' : 'asc';
    onSort(columnId, direction);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map(row => row.id);
      onSelectionChange?.(newSelected);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleRowClick = (_event: React.MouseEvent<unknown>, id: string | number) => {
    if (!selectable) return;

    const selectedIndex = selectedRows.indexOf(id);
    let newSelected: (string | number)[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRows.slice(1));
    } else if (selectedIndex === selectedRows.length - 1) {
      newSelected = newSelected.concat(selectedRows.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedRows.slice(0, selectedIndex),
        selectedRows.slice(selectedIndex + 1)
      );
    }

    onSelectionChange?.(newSelected);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRowData(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowData(null);
  };

  const handleAction = (action: 'view' | 'edit' | 'delete') => {
    if (selectedRowData) {
      if (action === 'view' && onView) {
        onView(selectedRowData.id);
      } else if (action === 'edit' && onEdit) {
        onEdit(selectedRowData.id);
      } else if (action === 'delete' && onDelete) {
        onDelete(selectedRowData.id);
      } else if (onRowAction) {
        onRowAction(action, selectedRowData);
      }
    }
    handleMenuClose();
  };

  const isSelected = (id: string | number) => selectedRows.indexOf(id) !== -1;

  const dataCount = serverSide ? (totalCount || 0) : rows.length;
  const numSelected = selectedRows.length;
  const rowCount = rows.length;

  // Generate search fields from columns
  const searchFields = columns
    .filter(col => col.searchable !== false)
    .map(col => ({
      key: col.id,
      label: col.label,
      type: col.filterType || 'text' as const,
      options: col.filterOptions
    }));

  const handleSearch = useCallback((criteria: any) => {
    if (onSearch) {
      onSearch(criteria);
    }
    // Reset to first page when searching
    if (onPageChange) {
      onPageChange(0);
    }
  }, [onSearch, onPageChange]);

  const hasDirectActions = !!(onEdit || onDelete || onView);
  const hasActions = hasDirectActions || (actions && actions.length > 0);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(numSelected > 0 && {
              bgcolor: (theme) =>
                alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
            }),
          }}
        >
          {numSelected > 0 ? (
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {numSelected} sélectionné(s)
            </Typography>
          ) : (
            <Typography
              sx={{ flex: '1 1 100%' }}
              variant="h6"
              id="tableTitle"
              component="div"
            >
              {title}
            </Typography>
          )}
        </Toolbar>

        {searchEnabled && searchFields.length > 0 && (
          <Box sx={{ p: 2, pt: 0 }}>
            <AdvancedSearch
              filterOptions={searchFields}
              onFiltersChange={handleSearch}
            />
          </Box>
        )}
        
        {loading && <LinearProgress />}
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={numSelected > 0 && numSelected < rowCount}
                      checked={rowCount > 0 && numSelected === rowCount}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    sortDirection={sortField === column.id ? sortDirection : false}
                  >
                    {column.sortable && onSort ? (
                      <TableSortLabel
                        active={sortField === column.id}
                        direction={sortField === column.id ? sortDirection : 'asc'}
                        onClick={() => handleSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell align="right">
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)}
                    align="center"
                  >
                    <Typography variant="body2" color="text.secondary" py={3}>
                      {loading ? 'Chargement...' : emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isItemSelected = isSelected(row.id);

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleRowClick(event, row.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      selected={isItemSelected}
                      sx={{ cursor: selectable ? 'pointer' : 'default' }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format ? column.format(value, row) : value}
                          </TableCell>
                        );
                      })}
                      {hasActions && (
                        <TableCell align="right">
                          {hasDirectActions ? (
                            <Box display="flex" gap={0.5} justifyContent="flex-end">
                              {onView && (
                                <Tooltip title="Voir">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onView(row.id);
                                    }}
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {onEdit && (
                                <Tooltip title="Modifier">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEdit(row.id);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {onDelete && (
                                <Tooltip title="Supprimer">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(row.id);
                                    }}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, row)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {(onPageChange && onRowsPerPageChange) && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={dataCount}
            rowsPerPage={initialPageSize}
            page={page}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            onRowsPerPageChange={(event) => {
              onRowsPerPageChange(parseInt(event.target.value, 10));
            }}
          />
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {hasDirectActions && (
          <>
            {onView && (
              <MenuItem onClick={() => handleAction('view')}>
                <ViewIcon sx={{ mr: 1 }} fontSize="small" />
                Voir
              </MenuItem>
            )}
            {onEdit && (
              <MenuItem onClick={() => handleAction('edit')}>
                <EditIcon sx={{ mr: 1 }} fontSize="small" />
                Modifier
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
                <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                Supprimer
              </MenuItem>
            )}
          </>
        )}
        {actions?.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              action.onClick(selectedRowData);
              handleMenuClose();
            }}
            sx={action.color ? { color: `${action.color}.main` } : {}}
          >
            {action.icon && <Box sx={{ mr: 1, display: 'flex' }}>{action.icon}</Box>}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}