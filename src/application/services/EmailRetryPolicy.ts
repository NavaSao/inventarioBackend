export interface RetryPolicyOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
}

/**
 * Política de reintentos configurable y desacoplada (SOLID - OCP).
 * Permite tolerar fallos transitorios de red/SMTP sin tumbar transacciones de negocio.
 */
export class EmailRetryPolicy {
  public readonly maxRetries: number;
  public readonly initialDelayMs: number;
  public readonly backoffMultiplier: number;

  constructor(options: RetryPolicyOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.initialDelayMs = options.initialDelayMs ?? 50;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
  }

  async execute<T extends { status: string; sent: boolean; reason?: string }>(
    action: (attempt: number) => Promise<T>,
  ): Promise<T> {
    let lastResult: T | undefined;
    let delay = this.initialDelayMs;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await action(attempt);
        if (result.status === 'SENT' || result.status === 'SKIPPED') {
          return result;
        }
        lastResult = result;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        lastResult = {
          status: 'FAILED',
          sent: false,
          reason,
        } as T;
      }

      if (attempt < this.maxRetries && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= this.backoffMultiplier;
      }
    }

    return (
      lastResult ??
      ({
        status: 'FAILED',
        sent: false,
        reason: 'Se agotaron los reintentos de envío',
      } as T)
    );
  }
}
