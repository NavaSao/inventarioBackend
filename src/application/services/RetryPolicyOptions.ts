export interface RetryPolicyOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
}
