-- MIGRATION SCRIPT: Shared Products + Company-Specific Stocks
-- This script safely migrates from current structure to new structure

-- Step 1: Create new company_stocks table
CREATE TABLE IF NOT EXISTS company_stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    product_id INT NOT NULL,
    
    -- Stock-specific fields
    quantity DECIMAL(10,2) DEFAULT 0,
    reserved_quantity DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    
    -- Stock details (company-specific)
    state VARCHAR(100),
    splicer VARCHAR(100),
    width DECIMAL(8,2),
    length DECIMAL(8,2),
    location VARCHAR(100),
    supplier VARCHAR(100),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign key constraints
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Unique constraint: one stock record per company-product combination
    UNIQUE KEY unique_company_product (company_id, product_id, deleted_at)
);

-- Step 2: Ensure products table has all unique products from stocks
INSERT IGNORE INTO products (name, type, created_at, updated_at)
SELECT DISTINCT 
    product as name,
    COALESCE(type, 'Marbre') as type,
    NOW() as created_at,
    NOW() as updated_at
FROM stocks 
WHERE product IS NOT NULL 
  AND product != ''
  AND product NOT IN (SELECT name FROM products WHERE deleted_at IS NULL);

-- Step 3: Migrate data from stocks to company_stocks
INSERT INTO company_stocks (
    company_id, 
    product_id, 
    quantity, 
    state, 
    splicer, 
    width, 
    length, 
    created_at, 
    updated_at
)
SELECT 
    COALESCE(c.id, 1) as company_id,  -- Default to company ID 1 if not found
    p.id as product_id,
    COALESCE(s.quantity, s.total_quantity, 0) as quantity,
    s.state,
    s.splicer,
    s.width,
    s.length,
    COALESCE(s.created_at, NOW()) as created_at,
    COALESCE(s.updated_at, NOW()) as updated_at
FROM stocks s
LEFT JOIN companies c ON c.name = s.company
LEFT JOIN products p ON p.name = s.product
WHERE p.id IS NOT NULL
ON DUPLICATE KEY UPDATE
    quantity = quantity + VALUES(quantity),  -- Sum quantities if duplicate
    updated_at = NOW();

-- Step 4: Create the view for easy querying
CREATE OR REPLACE VIEW v_company_product_inventory AS
SELECT 
    cs.id as stock_id,
    cs.company_id,
    c.name as company_name,
    p.id as product_id,
    p.name as product_name,
    p.type as product_type,
    p.description as product_description,
    p.category as product_category,
    p.unit as product_unit,
    cs.quantity,
    cs.reserved_quantity,
    cs.unit_cost,
    cs.selling_price,
    cs.state,
    cs.splicer,
    cs.width,
    cs.length,
    cs.location,
    cs.supplier,
    cs.created_at as stock_created_at,
    cs.updated_at as stock_updated_at
FROM company_stocks cs
JOIN products p ON cs.product_id = p.id
JOIN companies c ON cs.company_id = c.id
WHERE cs.deleted_at IS NULL 
  AND p.deleted_at IS NULL 
  AND c.deleted_at IS NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_stocks_company ON company_stocks(company_id);
CREATE INDEX IF NOT EXISTS idx_company_stocks_product ON company_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_company_stocks_company_product ON company_stocks(company_id, product_id);

-- Step 6: Rename old stocks table (don't drop yet, keep as backup)
-- RENAME TABLE stocks TO stocks_backup_old;

-- Verification queries to run after migration:
-- SELECT COUNT(*) FROM stocks;  -- Original count
-- SELECT COUNT(*) FROM company_stocks;  -- New count should be similar
-- SELECT * FROM v_company_product_inventory LIMIT 10;  -- Test the view
-- SELECT company_id, COUNT(*) FROM company_stocks GROUP BY company_id;  -- Stock distribution per company