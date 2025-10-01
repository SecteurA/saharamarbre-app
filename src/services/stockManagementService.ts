// Stock Management Service - Automatic adjustments for orders
import { companyStockService } from './companyStockServiceApi';

export interface StockAdjustment {
  product_id: number;
  company_id: number;
  quantity_change: number; // negative for reductions, positive for additions
  reason: 'order_created' | 'order_cancelled' | 'order_modified' | 'manual_adjustment' | 'return';
  reference_id?: number; // order ID, return ID, etc.
  reference_type?: 'order' | 'return' | 'manual';
}

export interface StockAvailability {
  product_id: number;
  company_id: number;
  available_quantity: number;
  reserved_quantity: number;
  total_quantity: number;
}

class StockManagementService {
  
  // Check if sufficient stock is available for an order
  async checkStockAvailability(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>
  ): Promise<{
    success: boolean;
    availability: StockAvailability[];
    insufficient_items?: Array<{ product_id: number; requested: number; available: number }>;
  }> {
    try {
      const availability: StockAvailability[] = [];
      const insufficient_items: Array<{ product_id: number; requested: number; available: number }> = [];

      for (const item of orderItems) {
        // Get current stock for this product and company
        const stockResponse = await companyStockService.getCompanyStocks({
          company_id: companyId,
          limit: 1000
        });

        if (!stockResponse.success) {
          throw new Error('Failed to fetch stock data');
        }

        // Find the specific product stock
        const productStocks = stockResponse.data.filter(stock => stock.product_id === item.product_id);
        
        const totalQuantity = productStocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
        const reservedQuantity = productStocks.reduce((sum, stock) => sum + (stock.reserved_quantity || 0), 0);
        const availableQuantity = totalQuantity - reservedQuantity;

        const stockAvailability: StockAvailability = {
          product_id: item.product_id,
          company_id: companyId,
          available_quantity: availableQuantity,
          reserved_quantity: reservedQuantity,
          total_quantity: totalQuantity
        };

        availability.push(stockAvailability);

        // Check if insufficient stock
        if (availableQuantity < item.quantity) {
          insufficient_items.push({
            product_id: item.product_id,
            requested: item.quantity,
            available: availableQuantity
          });
        }
      }

      return {
        success: insufficient_items.length === 0,
        availability,
        insufficient_items: insufficient_items.length > 0 ? insufficient_items : undefined
      };

    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw error;
    }
  }

  // Reserve stock for an order (don't reduce total, but increase reserved)
  async reserveStock(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>,
    orderId: number
  ): Promise<{ success: boolean; adjustments: StockAdjustment[] }> {
    try {
      const adjustments: StockAdjustment[] = [];

      for (const item of orderItems) {
        // Get current stock records for this product
        const stockResponse = await companyStockService.getCompanyStocks({
          company_id: companyId,
          limit: 1000
        });

        if (!stockResponse.success) {
          throw new Error('Failed to fetch stock data');
        }

        const productStocks = stockResponse.data.filter(stock => stock.product_id === item.product_id);
        
        if (productStocks.length === 0) {
          throw new Error(`No stock found for product ${item.product_id}`);
        }

        // Reserve from available stock (FIFO - First In, First Out)
        let remainingToReserve = item.quantity;
        
        for (const stock of productStocks) {
          if (remainingToReserve <= 0) break;

          const availableInThisStock = (stock.quantity || 0) - (stock.reserved_quantity || 0);
          const toReserveFromThis = Math.min(availableInThisStock, remainingToReserve);

          if (toReserveFromThis > 0) {
            // Update reserved quantity
            await companyStockService.updateCompanyStock(
              stock.stock_id,
              companyId,
              {
                reserved_quantity: (stock.reserved_quantity || 0) + toReserveFromThis
              }
            );

            adjustments.push({
              product_id: item.product_id,
              company_id: companyId,
              quantity_change: -toReserveFromThis, // negative for reservation
              reason: 'order_created',
              reference_id: orderId,
              reference_type: 'order'
            });

            remainingToReserve -= toReserveFromThis;
          }
        }

        if (remainingToReserve > 0) {
          throw new Error(`Insufficient stock for product ${item.product_id}. Missing: ${remainingToReserve}`);
        }
      }

      return { success: true, adjustments };

    } catch (error) {
      console.error('Error reserving stock:', error);
      throw error;
    }
  }

  // Confirm stock reduction (when order is shipped/delivered)
  async confirmStockReduction(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>,
    orderId: number
  ): Promise<{ success: boolean; adjustments: StockAdjustment[] }> {
    try {
      const adjustments: StockAdjustment[] = [];

      for (const item of orderItems) {
        // Get current stock records for this product
        const stockResponse = await companyStockService.getCompanyStocks({
          company_id: companyId,
          limit: 1000
        });

        if (!stockResponse.success) {
          throw new Error('Failed to fetch stock data');
        }

        const productStocks = stockResponse.data.filter(stock => stock.product_id === item.product_id);
        
        // Reduce both total quantity and reserved quantity
        let remainingToReduce = item.quantity;
        
        for (const stock of productStocks) {
          if (remainingToReduce <= 0) break;

          const reservedInThisStock = Math.min(stock.reserved_quantity || 0, remainingToReduce);
          const toReduceFromThis = Math.min(stock.quantity || 0, remainingToReduce);

          if (toReduceFromThis > 0) {
            // Reduce both total and reserved quantities
            await companyStockService.updateCompanyStock(
              stock.stock_id,
              companyId,
              {
                quantity: (stock.quantity || 0) - toReduceFromThis,
                reserved_quantity: Math.max(0, (stock.reserved_quantity || 0) - reservedInThisStock)
              }
            );

            adjustments.push({
              product_id: item.product_id,
              company_id: companyId,
              quantity_change: -toReduceFromThis,
              reason: 'order_created',
              reference_id: orderId,
              reference_type: 'order'
            });

            remainingToReduce -= toReduceFromThis;
          }
        }
      }

      return { success: true, adjustments };

    } catch (error) {
      console.error('Error confirming stock reduction:', error);
      throw error;
    }
  }

  // Cancel stock reservation (when order is cancelled)
  async cancelStockReservation(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>,
    orderId: number
  ): Promise<{ success: boolean; adjustments: StockAdjustment[] }> {
    try {
      const adjustments: StockAdjustment[] = [];

      for (const item of orderItems) {
        // Get current stock records for this product
        const stockResponse = await companyStockService.getCompanyStocks({
          company_id: companyId,
          limit: 1000
        });

        if (!stockResponse.success) {
          throw new Error('Failed to fetch stock data');
        }

        const productStocks = stockResponse.data.filter(stock => stock.product_id === item.product_id);
        
        // Release reserved quantities
        let remainingToRelease = item.quantity;
        
        for (const stock of productStocks) {
          if (remainingToRelease <= 0) break;

          const reservedInThisStock = Math.min(stock.reserved_quantity || 0, remainingToRelease);

          if (reservedInThisStock > 0) {
            // Reduce reserved quantity (make stock available again)
            await companyStockService.updateCompanyStock(
              stock.stock_id,
              companyId,
              {
                reserved_quantity: (stock.reserved_quantity || 0) - reservedInThisStock
              }
            );

            adjustments.push({
              product_id: item.product_id,
              company_id: companyId,
              quantity_change: reservedInThisStock, // positive for release
              reason: 'order_cancelled',
              reference_id: orderId,
              reference_type: 'order'
            });

            remainingToRelease -= reservedInThisStock;
          }
        }
      }

      return { success: true, adjustments };

    } catch (error) {
      console.error('Error cancelling stock reservation:', error);
      throw error;
    }
  }

  // Add stock (for returns, new inventory, etc.)
  async addStock(
    companyId: number,
    productId: number,
    quantity: number,
    reason: StockAdjustment['reason'],
    referenceId?: number
  ): Promise<{ success: boolean }> {
    try {
      // Get existing stock for this product and company
      const stockResponse = await companyStockService.getCompanyStocks({
        company_id: companyId,
        limit: 1000
      });

      if (!stockResponse.success) {
        throw new Error('Failed to fetch stock data');
      }

      const productStocks = stockResponse.data.filter(stock => stock.product_id === productId);
      
      if (productStocks.length > 0) {
        // Add to existing stock
        const firstStock = productStocks[0];
        await companyStockService.updateCompanyStock(
          firstStock.stock_id,
          companyId,
          {
            quantity: (firstStock.quantity || 0) + quantity
          }
        );
      } else {
        // Create new stock record
        await companyStockService.createCompanyStock({
          company_id: companyId,
          product_id: productId,
          quantity: quantity
        });
      }

      return { success: true };

    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  }
}

export const stockManagementService = new StockManagementService();
export default StockManagementService;