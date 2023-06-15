export class AppError extends Error{
  private statusCode: number;
  private status: string;
  private isOperational: boolean;

  constructor(massage, statusCode) {
    super(massage)

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }


}