import { ErrorInfo } from 'react';

export type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
};

export type AppError = {
  id: string;
  type: 'network' | 'authentication' | 'permission' | 'system';
  message: string;
  details?: string;
  timestamp: Date;
  retryable?: boolean;
};

export type ErrorContextType = {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => string;
  removeError: (id: string) => void;
  clearErrors: () => void;
};

export class CustomError extends Error {
  type: AppError['type'];
  details?: string;
  retryable?: boolean;

  constructor(
    message: string,
    opts?: {
      type?: AppError['type'];
      details?: string;
      retryable?: boolean;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'CustomError';
    this.type = opts?.type ?? 'system';
    this.details = opts?.details;
    this.retryable = opts?.retryable;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (opts?.cause) this.cause = opts.cause;
  }
}
