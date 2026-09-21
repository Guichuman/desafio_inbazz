import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '@shared/domain/DomainError';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    this.logger.warn(
      `[${exception.codigo}] ${exception.message} (${request.method} ${request.url})`,
    );

    response.status(exception.httpStatus).json({
      statusCode: exception.httpStatus,
      codigo: exception.codigo,
      mensagem: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
