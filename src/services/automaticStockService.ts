// Automatic Stock Management Service - Works with existing company_stocks table
import { config } from '../config';

export interface StockAvailabilityCheck {
  product_id: number;
  requested: number;
  available: number;
}

export interface StockAvailabilityResponse {
  success: boolean;
  availability: Array<{
    product_id: number;
    company_id: number;
    total_quantity: number;
    available_quantity: number;
  }>;
  insufficient_items?: StockAvailabilityCheck[];
}

class AutomaticStockService {
  private baseURL = `${config.api.baseUrl}/stock-management`;

  // Check if enough stock is available for an order
  async checkStockAvailability(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>
  ): Promise<StockAvailabilityResponse> {
    try {
      const response = await fetch(`${this.baseURL}/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          items: orderItems
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking stock availability:', error);
      throw error;
    }
  }

  // Reduce stock when order is shipped/delivered
  async reduceStock(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>,
    orderId: number,
    reason: string = 'order_shipped'
  ): Promise<{ success: boolean; adjustments: any[] }> {
    try {
      const response = await fetch(`${this.baseURL}/reduce-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          items: orderItems,
          order_id: orderId,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error reducing stock:', error);
      throw error;
    }
  }

  // Add stock back (for returns, new inventory)
  async addStock(
    companyId: number,
    productId: number,
    quantity: number,
    reason: string = 'return'
  ): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseURL}/add-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          product_id: productId,
          quantity,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding stock:', error);
      throw error;
    }
  }

  // Bulk increase stock (for returns, receptions)
  async increaseStock(
    companyId: number,
    items: Array<{ product_id: number; quantity: number }>,
    referenceId: number,
    reason: 'return_received' | 'reception_confirmed' | 'manual_adjustment' = 'manual_adjustment'
  ): Promise<{ success: boolean; adjustments: any[] }> {
    try {
      const response = await fetch(`${this.baseURL}/increase-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          items,
          reference_id: referenceId,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error increasing stock:', error);
      throw error;
    }
  }
}

// Integration hooks for your existing order system
export class OrderStockIntegration {
  private stockService = new AutomaticStockService();

  // Call this BEFORE creating an order to check availability
  async validateOrderStock(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>
  ): Promise<{ canProceed: boolean; warnings: string[] }> {
    try {
      const availabilityCheck = await this.stockService.checkStockAvailability(companyId, orderItems);
      
      if (availabilityCheck.success) {
        return { canProceed: true, warnings: [] };
      }

      const warnings = availabilityCheck.insufficient_items?.map(item => 
        `Product ${item.product_id}: Requested ${item.requested}, Available ${item.available}`
      ) || [];

      return { canProceed: false, warnings };
    } catch (error) {
      console.error('Error validating order stock:', error);
      return { canProceed: false, warnings: ['Error checking stock availability'] };
    }
  }

  // Call this when order status changes to "shipped" or "delivered"
  async processOrderShipment(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>,
    orderId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.stockService.reduceStock(companyId, orderItems, orderId, 'order_shipped');
      return { success: true, message: 'Stock automatically reduced for shipped order' };
    } catch (error) {
      console.error('Error processing order shipment:', error);
      return { success: false, message: `Error reducing stock: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Call this when order is returned
  async processOrderReturn(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>
  ): Promise<{ success: boolean; message: string }> {
    try {
      for (const item of orderItems) {
        await this.stockService.addStock(companyId, item.product_id, item.quantity, 'order_return');
      }
      return { success: true, message: 'Stock automatically added back from return' };
    } catch (error) {
      console.error('Error processing order return:', error);
      return { success: false, message: `Error adding returned stock: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Call this when order status changes to "delivered" (same as processOrderShipment)
  async processDeliveredOrder(
    companyId: number,
    orderItems: Array<{ product_id: number; quantity: number }>,
    orderId: number
  ): Promise<{ success: boolean; message: string }> {
    return this.processOrderShipment(companyId, orderItems, orderId);
  }

  // Call this when issue slip is marked as delivered/issued
  async processIssueSlipDelivery(
    companyId: number,
    items: Array<{ product_id: number; quantity: number }>,
    issueSlipId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.stockService.reduceStock(companyId, items, issueSlipId, 'issue_slip_delivered');
      return { success: true, message: 'Stock automatically reduced for issued items' };
    } catch (error) {
      console.error('Error processing issue slip delivery:', error);
      return { success: false, message: `Error reducing stock: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Call this when return slip is processed/confirmed
  async processReturnSlipConfirmation(
    companyId: number,
    items: Array<{ product_id: number; quantity: number }>,
    returnSlipId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.stockService.increaseStock(companyId, items, returnSlipId, 'return_received');
      return { success: true, message: 'Stock automatically increased from returned items' };
    } catch (error) {
      console.error('Error processing return slip confirmation:', error);
      return { success: false, message: `Error increasing stock: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Call this when reception slip is confirmed/received
  async processReceptionSlipConfirmation(
    companyId: number,
    items: Array<{ product_id: number; quantity: number }>,
    receptionSlipId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.stockService.increaseStock(companyId, items, receptionSlipId, 'reception_confirmed');
      return { success: true, message: 'Stock automatically increased from received items' };
    } catch (error) {
      console.error('Error processing reception slip confirmation:', error);
      return { success: false, message: `Error increasing stock: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}

export const automaticStockService = new AutomaticStockService();
export const orderStockIntegration = new OrderStockIntegration();
export default AutomaticStockService;