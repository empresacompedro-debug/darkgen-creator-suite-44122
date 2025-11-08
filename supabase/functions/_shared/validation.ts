// Shared validation utilities for edge functions using Zod
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

export { z };

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

// Convert Zod errors to ValidationError format
export function zodToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
}

// String validators
export function validateString(
  value: any,
  field: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (options.required && (!value || typeof value !== 'string' || value.trim() === '')) {
    errors.push({ field, message: `${field} is required` });
    return errors;
  }

  if (value && typeof value !== 'string') {
    errors.push({ field, message: `${field} must be a string` });
    return errors;
  }

  if (!value) return errors;

  const str = value.trim();

  if (options.minLength && str.length < options.minLength) {
    errors.push({ field, message: `${field} must be at least ${options.minLength} characters` });
  }

  if (options.maxLength && str.length > options.maxLength) {
    errors.push({ field, message: `${field} must be at most ${options.maxLength} characters` });
  }

  if (options.pattern && !options.pattern.test(str)) {
    errors.push({ field, message: `${field} has invalid format` });
  }

  return errors;
}

// Number validators
export function validateNumber(
  value: any,
  field: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (options.required && (value === undefined || value === null)) {
    errors.push({ field, message: `${field} is required` });
    return errors;
  }

  if (value === undefined || value === null) return errors;

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({ field, message: `${field} must be a number` });
    return errors;
  }

  if (options.min !== undefined && value < options.min) {
    errors.push({ field, message: `${field} must be at least ${options.min}` });
  }

  if (options.max !== undefined && value > options.max) {
    errors.push({ field, message: `${field} must be at most ${options.max}` });
  }

  if (options.integer && !Number.isInteger(value)) {
    errors.push({ field, message: `${field} must be an integer` });
  }

  return errors;
}

// URL validator
export function validateUrl(value: any, field: string, required: boolean = false): ValidationError[] {
  const errors: ValidationError[] = [];

  if (required && !value) {
    errors.push({ field, message: `${field} is required` });
    return errors;
  }

  if (!value) return errors;

  if (typeof value !== 'string') {
    errors.push({ field, message: `${field} must be a valid URL` });
    return errors;
  }

  try {
    new URL(value);
  } catch {
    errors.push({ field, message: `${field} must be a valid URL` });
  }

  return errors;
}

// Array validator
export function validateArray(
  value: any,
  field: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (options.required && (!value || !Array.isArray(value))) {
    errors.push({ field, message: `${field} is required` });
    return errors;
  }

  if (!value) return errors;

  if (!Array.isArray(value)) {
    errors.push({ field, message: `${field} must be an array` });
    return errors;
  }

  if (options.minLength && value.length < options.minLength) {
    errors.push({ field, message: `${field} must have at least ${options.minLength} items` });
  }

  if (options.maxLength && value.length > options.maxLength) {
    errors.push({ field, message: `${field} must have at most ${options.maxLength} items` });
  }

  return errors;
}

// Sanitize string to prevent XSS and injection
export function sanitizeString(value: string): string {
  if (!value) return '';
  
  // Remove any potential HTML/script tags
  let sanitized = value.replace(/<[^>]*>/g, '');
  
  // Limit length as additional safety
  if (sanitized.length > 1000000) {
    sanitized = sanitized.substring(0, 1000000);
  }
  
  return sanitized.trim();
}

// Validate and throw if errors
export function validateOrThrow(errors: ValidationError[]): void {
  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
}
