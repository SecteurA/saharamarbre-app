// Form validation utilities for the management system
import * as Yup from 'yup';

// Common validation rules
export const commonValidations = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must be no more than ${max} characters`,
  positiveNumber: (field: string) => `${field} must be a positive number`,
  decimal: (field: string) => `${field} must be a valid decimal number`,
};

// Company validation schema
export const companyValidationSchema = Yup.object({
  name: Yup.string()
    .required(commonValidations.required('Company name'))
    .min(2, commonValidations.minLength('Company name', 2))
    .max(255, commonValidations.maxLength('Company name', 255)),
  
  email: Yup.string()
    .email(commonValidations.email)
    .max(255, commonValidations.maxLength('Email', 255))
    .nullable(),
    
  phone: Yup.string()
    .matches(/^[\+]?[\d\s\-\(\)]+$/, commonValidations.phone)
    .max(20, commonValidations.maxLength('Phone', 20))
    .nullable(),
    
  address: Yup.string()
    .max(500, commonValidations.maxLength('Address', 500))
    .nullable(),
    
  company_type: Yup.string()
    .required(commonValidations.required('Company type'))
    .oneOf(['Client', 'Supplier', 'Both', 'Other'], 'Invalid company type'),
    
  nrc: Yup.string()
    .max(50, commonValidations.maxLength('NRC', 50))
    .nullable(),
    
  nif: Yup.string()
    .max(50, commonValidations.maxLength('NIF', 50))
    .nullable(),
});

// Client validation schema
export const clientValidationSchema = Yup.object({
  name: Yup.string()
    .required(commonValidations.required('Client name'))
    .min(2, commonValidations.minLength('Client name', 2))
    .max(255, commonValidations.maxLength('Client name', 255)),
    
  email: Yup.string()
    .email(commonValidations.email)
    .max(255, commonValidations.maxLength('Email', 255))
    .nullable(),
    
  phone: Yup.string()
    .matches(/^[\+]?[\d\s\-\(\)]+$/, commonValidations.phone)
    .max(20, commonValidations.maxLength('Phone', 20))
    .nullable(),
    
  address: Yup.string()
    .max(500, commonValidations.maxLength('Address', 500))
    .nullable(),
    
  company: Yup.string()
    .max(255, commonValidations.maxLength('Company', 255))
    .nullable(),
    
  bin: Yup.string()
    .max(50, commonValidations.maxLength('BIN', 50))
    .nullable(),
    
  patent: Yup.string()
    .max(50, commonValidations.maxLength('Patent', 50))
    .nullable(),
});

// Product validation schema
export const productValidationSchema = Yup.object({
  name: Yup.string()
    .required(commonValidations.required('Product name'))
    .min(2, commonValidations.minLength('Product name', 2))
    .max(255, commonValidations.maxLength('Product name', 255)),
    
  reference: Yup.string()
    .max(100, commonValidations.maxLength('Reference', 100))
    .nullable(),
    
  unit: Yup.string()
    .max(50, commonValidations.maxLength('Unit', 50))
    .nullable(),
    
  price: Yup.number()
    .positive(commonValidations.positiveNumber('Price'))
    .max(999999.99, 'Price cannot exceed 999,999.99')
    .nullable(),
    
  type_id: Yup.number()
    .integer('Type ID must be an integer')
    .positive('Type ID must be positive')
    .nullable(),
});

// Order validation schema
export const orderValidationSchema = Yup.object({
  client_id: Yup.number()
    .integer('Client ID must be an integer')
    .positive('Client ID must be positive')
    .nullable()
    .transform((value, originalValue) => originalValue === '' || originalValue === 0 ? null : value),
    
  company_id: Yup.number()
    .required(commonValidations.required('Company'))
    .integer('Company ID must be an integer')
    .positive('Company ID must be positive'),
    
  type: Yup.string()
    .max(100, commonValidations.maxLength('Type', 100))
    .nullable(),
    
  driver: Yup.string()
    .max(255, commonValidations.maxLength('Driver', 255))
    .nullable(),
    
  plate: Yup.string()
    .max(50, commonValidations.maxLength('Plate', 50))
    .nullable(),
    
  worksite: Yup.string()
    .max(255, commonValidations.maxLength('Worksite', 255))
    .nullable(),
    
  order_ref: Yup.string()
    .max(100, commonValidations.maxLength('Order Reference', 100))
    .nullable(),
    
  status: Yup.string()
    .oneOf(['draft', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 'Invalid status')
    .nullable(),
    
  total_amount: Yup.number()
    .min(0, 'Total amount cannot be negative')
    .max(999999999.99, 'Total amount is too large')
    .nullable(),
    
  taxable_amount: Yup.number()
    .min(0, 'Taxable amount cannot be negative')
    .max(999999999.99, 'Taxable amount is too large')
    .nullable(),
    
  tax_rate: Yup.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .integer('Tax rate must be an integer')
    .nullable(),
    
  total_taxes: Yup.number()
    .min(0, 'Total taxes cannot be negative')
    .max(999999999.99, 'Total taxes is too large')
    .nullable(),
    
  remaining_amount: Yup.number()
    .min(0, 'Remaining amount cannot be negative')
    .max(999999999.99, 'Remaining amount is too large')
    .nullable(),
});

// User validation schema
export const userValidationSchema = Yup.object({
  name: Yup.string()
    .required(commonValidations.required('Name'))
    .min(2, commonValidations.minLength('Name', 2))
    .max(255, commonValidations.maxLength('Name', 255)),
    
  email: Yup.string()
    .required(commonValidations.required('Email'))
    .email(commonValidations.email)
    .max(255, commonValidations.maxLength('Email', 255)),
    
  password: Yup.string()
    .min(8, commonValidations.minLength('Password', 8))
    .max(255, commonValidations.maxLength('Password', 255))
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match'),
    
  phone: Yup.string()
    .matches(/^[\+]?[\d\s\-\(\)]+$/, commonValidations.phone)
    .max(20, commonValidations.maxLength('Phone', 20))
    .nullable(),
    
  role_name: Yup.string()
    .max(100, commonValidations.maxLength('Role', 100))
    .nullable(),
    
  company_id: Yup.number()
    .integer('Company ID must be an integer')
    .positive('Company ID must be positive')
    .nullable(),
});

// Payment validation schema
export const paymentValidationSchema = Yup.object({
  order_id: Yup.number()
    .required(commonValidations.required('Order'))
    .integer('Order ID must be an integer')
    .positive('Order ID must be positive'),
    
  amount: Yup.number()
    .required(commonValidations.required('Amount'))
    .positive(commonValidations.positiveNumber('Amount'))
    .max(999999999.99, 'Amount is too large'),
    
  payment_method: Yup.string()
    .required(commonValidations.required('Payment method'))
    .oneOf(['Cash', 'Check', 'Transfer', 'Card'], 'Invalid payment method'),
    
  payment_date: Yup.date()
    .required(commonValidations.required('Payment date'))
    .max(new Date(), 'Payment date cannot be in the future'),
    
  notes: Yup.string()
    .max(1000, commonValidations.maxLength('Notes', 1000))
    .nullable(),
});

// Cheque validation schema
export const chequeValidationSchema = Yup.object({
  order_id: Yup.number()
    .required(commonValidations.required('Order'))
    .integer('Order ID must be an integer')
    .positive('Order ID must be positive'),
    
  cheque_number: Yup.string()
    .required(commonValidations.required('Cheque number'))
    .max(50, commonValidations.maxLength('Cheque number', 50)),
    
  bank_name: Yup.string()
    .required(commonValidations.required('Bank name'))
    .max(255, commonValidations.maxLength('Bank name', 255)),
    
  amount: Yup.number()
    .required(commonValidations.required('Amount'))
    .positive(commonValidations.positiveNumber('Amount'))
    .max(999999999.99, 'Amount is too large'),
    
  issue_date: Yup.date()
    .required(commonValidations.required('Issue date'))
    .max(new Date(), 'Issue date cannot be in the future'),
    
  due_date: Yup.date()
    .required(commonValidations.required('Due date'))
    .min(Yup.ref('issue_date'), 'Due date must be after issue date'),
    
  status: Yup.string()
    .required(commonValidations.required('Status'))
    .oneOf(['Pending', 'Cleared', 'Bounced', 'Cancelled'], 'Invalid status'),
    
  drawer_name: Yup.string()
    .required(commonValidations.required('Drawer name'))
    .max(255, commonValidations.maxLength('Drawer name', 255)),
    
  notes: Yup.string()
    .max(1000, commonValidations.maxLength('Notes', 1000))
    .nullable(),
});

// Expense validation schema
export const expenseValidationSchema = Yup.object({
  name: Yup.string()
    .required(commonValidations.required('Expense name'))
    .min(2, commonValidations.minLength('Expense name', 2))
    .max(255, commonValidations.maxLength('Expense name', 255)),
    
  amount: Yup.number()
    .required(commonValidations.required('Amount'))
    .positive(commonValidations.positiveNumber('Amount'))
    .max(999999999.99, 'Amount is too large'),
    
  company_id: Yup.number()
    .required(commonValidations.required('Company'))
    .integer('Company ID must be an integer')
    .positive('Company ID must be positive'),
    
  user_id: Yup.number()
    .required(commonValidations.required('User'))
    .integer('User ID must be an integer')
    .positive('User ID must be positive'),
});

// Driver validation schema
export const driverValidationSchema = Yup.object({
  name: Yup.string()
    .required(commonValidations.required('Driver name'))
    .min(2, commonValidations.minLength('Driver name', 2))
    .max(255, commonValidations.maxLength('Driver name', 255)),
    
  phone: Yup.string()
    .matches(/^[\+]?[\d\s\-\(\)]+$/, commonValidations.phone)
    .max(20, commonValidations.maxLength('Phone', 20))
    .nullable(),
    
  cin: Yup.string()
    .max(50, commonValidations.maxLength('CIN', 50))
    .nullable(),
});

// Bank Account validation schema
export const bankAccountValidationSchema = Yup.object({
  name: Yup.string()
    .required(commonValidations.required('Account name'))
    .min(2, commonValidations.minLength('Account name', 2))
    .max(255, commonValidations.maxLength('Account name', 255)),
    
  rib: Yup.string()
    .required(commonValidations.required('RIB'))
    .max(50, commonValidations.maxLength('RIB', 50)),
    
  type: Yup.string()
    .required(commonValidations.required('Account type'))
    .oneOf(['Checking', 'Savings', 'Business', 'Other'], 'Invalid account type'),
    
  company_id: Yup.number()
    .required(commonValidations.required('Company'))
    .integer('Company ID must be an integer')
    .positive('Company ID must be positive'),
});

// Quote validation schema
export const quoteValidationSchema = Yup.object({
  client_id: Yup.number()
    .required(commonValidations.required('Client'))
    .integer('Client ID must be an integer')
    .positive('Client ID must be positive'),
    
  company_id: Yup.number()
    .required(commonValidations.required('Company'))
    .integer('Company ID must be an integer')
    .positive('Company ID must be positive'),
    
  quote_date: Yup.date()
    .required(commonValidations.required('Quote date'))
    .max(new Date(), 'Quote date cannot be in the future'),
    
  expiry_date: Yup.date()
    .required(commonValidations.required('Expiry date'))
    .min(new Date(), 'Expiry date cannot be in the past'),
    
  status: Yup.string()
    .required(commonValidations.required('Status'))
    .oneOf(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'], 'Invalid status'),
    
  notes: Yup.string()
    .max(1000, commonValidations.maxLength('Notes', 1000))
    .nullable(),
});

// Export all validation schemas
export const validationSchemas = {
  company: companyValidationSchema,
  client: clientValidationSchema,
  product: productValidationSchema,
  order: orderValidationSchema,
  quote: quoteValidationSchema,
  user: userValidationSchema,
  payment: paymentValidationSchema,
  cheque: chequeValidationSchema,
  expense: expenseValidationSchema,
  driver: driverValidationSchema,
  bankAccount: bankAccountValidationSchema,
};

// Validation helper functions
export const validateField = async (schema: Yup.AnyObject, fieldName: string, value: any): Promise<string | null> => {
  try {
    await schema.validateAt(fieldName, { [fieldName]: value });
    return null;
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return error.message;
    }
    return 'Validation error';
  }
};

export const validateForm = async (schema: Yup.AnyObject, values: any): Promise<Record<string, string>> => {
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err: Yup.ValidationError) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return errors;
    }
    return { general: 'Validation error' };
  }
};

export default validationSchemas;