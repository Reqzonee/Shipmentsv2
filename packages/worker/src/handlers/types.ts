import type { ContactDocument, LogStatus } from '@shipments/shared';

export type EntityOutcome = {
  entityId: string;
  status: LogStatus;
  message: string | null;
  error: string | null;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
};

export type BatchResult = {
  outcomes: EntityOutcome[];
  successCount: number;
  failureCount: number;
  skippedCount: number;
};

export interface BulkActionHandler {
  readonly key: string;
  processBatch(
    entities: ContactDocument[],
    updates: Record<string, unknown>,
    seenEmails: Set<string>
  ): Promise<BatchResult>;
}
