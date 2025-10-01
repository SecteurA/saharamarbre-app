-- New Database Schema for Shared Products + Company-Specific Stocks

-- PRODUCTS TABLE (Shared Catalog)
-- This remains mostly the same but will be the master product catalog
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL UNIQUE,
    type ENUM('Marbre', 'Service') NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'Unité',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- COMPANY_STOCKS TABLE (Company-Specific Inventory)
-- This replaces the current stocks table with proper relationships
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

-- MIGRATION PLAN:
-- 1. Create new company_stocks table
-- 2. Migrate data from old stocks table to company_stocks
-- 3. Map company names to company_id
-- 4. Map product names to product_id
-- 5. Drop old stocks table after verification

-- INDEXES for performance
CREATE INDEX idx_company_stocks_company ON company_stocks(company_id);
CREATE INDEX idx_company_stocks_product ON company_stocks(product_id);
CREATE INDEX idx_company_stocks_company_product ON company_stocks(company_id, product_id);

-- VIEW for easy querying (combines products + company stocks)
CREATE VIEW v_company_product_inventory AS
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

-- BENEFITS:
-- 1. Shared product catalog (products table)
-- 2. Company-isolated stock data (company_stocks table)
-- 3. Proper foreign key relationships
-- 4. Referential integrity
-- 5. Easy querying with the view
-- 6. Scalable and maintainable structure