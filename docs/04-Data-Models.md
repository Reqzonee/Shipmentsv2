# Data Models (MongoDB)

## Contact Collection

```typescript
// contacts
{
  _id: ObjectId,
  accountId: string,          // multi-tenant ready
  name: string,
  email: string,              // indexed — used for dedup
  age: number,
  status: 'active' | 'inactive' | 'lead',
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ accountId: 1, email: 1 }     // unique per account (dedup)
{ accountId: 1, status: 1 }    // filter queries for bulk actions
{ accountId: 1, createdAt: -1 }
```

---

## Bulk Action Collection

```typescript
// bulk_actions
{
  _id: ObjectId,
  accountId: string,
  entityType: 'contact',      // extensible: 'company', 'lead', etc.
  actionType: 'bulk_update',  // extensible: 'bulk_delete', etc.
  status: 'scheduled' | 'queued' | 'running' | 'completed' | 'failed' | 'partial',
  
  // What to process
  payload: {
    filters?: Record<string, any>,   // e.g., { status: 'inactive' }
    entityIds?: string[],            // explicit ID list
    updates?: Record<string, any>,   // for bulk_update
  },
  
  // Counters (updated atomically by worker)
  totalCount: number,
  processedCount: number,
  successCount: number,
  failureCount: number,
  skippedCount: number,
  
  // Job metadata
  jobId: string,              // BullMQ job ID
  error: string | null,       // top-level failure reason
  
  // Timestamps
  scheduledAt: Date | null,
  createdAt: Date,
  startedAt: Date | null,
  completedAt: Date | null,
  updatedAt: Date
}

// Indexes
{ accountId: 1, createdAt: -1 }
{ status: 1 }
{ accountId: 1, status: 1 }
```

---

## Bulk Action Log Collection

```typescript
// bulk_action_logs
{
  _id: ObjectId,
  actionId: ObjectId,         // ref bulk_actions
  accountId: string,
  entityId: string,
  entityType: string,
  status: 'success' | 'failed' | 'skipped',
  message: string | null,
  error: string | null,
  metadata: {                 // optional context
    previousValues?: Record<string, any>,
    newValues?: Record<string, any>
  },
  processedAt: Date
}

// Indexes
{ actionId: 1, status: 1 }
{ actionId: 1, processedAt: 1 }
{ accountId: 1, actionId: 1 }
```

**Why separate logs collection?**
- A bulk action on 1M records = 1M log docs
- Keeps `bulk_actions` document small and fast to read for status polling
- Logs can be archived/TTL'd independently

---

## Rate Limit (Redis — Not MongoDB)

```
Key:   rate:{accountId}:{minute_bucket}
Value: integer counter
TTL:   60 seconds
```

---

## Sample Contact Document

```json
{
  "_id": "674a00000000000000000001",
  "accountId": "acc_demo",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 32,
  "status": "active",
  "createdAt": "2026-07-01T00:00:00.000Z",
  "updatedAt": "2026-07-01T00:00:00.000Z"
}
```

---

## Entity-Agnostic Design Notes

The `entityType` + `actionType` combo is the extension point:

| entityType | actionType | Handler |
|------------|------------|---------|
| contact | bulk_update | BulkUpdateHandler |
| contact | bulk_delete | BulkDeleteHandler (future) |
| company | bulk_update | CompanyBulkUpdateHandler (future) |

MongoDB collections per entity (`contacts`, `companies`) — worker resolves collection name from `entityType`.

---

## Related Notes

- [[01-Architecture-Plan]]
- [[03-API-Specification]]
