# Architecture in Plain English

## The restaurant analogy

Imagine a busy restaurant:

| Real life | Our system |
|-----------|------------|
| Customer places an order | You click **Queue bulk action** in the UI |
| Waiter writes the order ticket | **API** saves the job in MongoDB |
| Ticket goes on the kitchen rail | Job goes into **Redis queue** |
| Chef cooks in batches | **Worker** updates contacts in batches of ~500 |
| Order status board | Progress bar / dashboard |
| Receipt of each dish | Per-contact **logs** |

You don’t stand in the kitchen waiting for 2,000 plates. You place the order and watch the board update.

---

## What “2,000 contacts” means

Nothing magical. It’s just **fake test data** so we can prove bulk processing works on a large list.

- Seed 500 / 2,000 / 5,000 = create that many sample people in the database
- Roughly 1/3 become `active`, 1/3 `inactive`, 1/3 `lead`

## What statuses mean

| Status | Meaning (CRM-style) |
|--------|---------------------|
| **active** | Currently engaged / usable customer |
| **inactive** | Paused / not engaged right now |
| **lead** | Potential customer, not converted yet |

Bulk update example: “Find everyone who is **inactive** and set them to **active**.”

---

## Pieces of the system

1. **UI (React)** — buttons, tables, progress animation  
2. **API (Express)** — receives requests, validates, creates jobs  
3. **MongoDB** — stores contacts + jobs + logs  
4. **Redis + BullMQ** — waiting line for jobs  
5. **Worker** — background process that does the heavy updates  

Mongo Docker container = local database (because Atlas IP wasn’t allowed yet).

---

## Related

- [[09-AGENT-HANDOFF]]
- [[01-Architecture-Plan]]
