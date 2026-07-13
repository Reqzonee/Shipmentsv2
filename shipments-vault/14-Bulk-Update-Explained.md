# How Bulk Field Updates Work

## Short answer

**Yes — whatever you type is applied to every matching row.**

If filter = Contacts with status `active` (~13,104 people), and you fill:

| Field | You type | Result on every matching contact |
|-------|----------|----------------------------------|
| Name | `Bulk Renamed` | All 13,104 get name = `Bulk Renamed` |
| Email | *(leave blank)* | Email **unchanged** |
| Age | `30` | All get age = `30` |
| Status | `— no change —` | Status **unchanged** (stays active) |

Blank / “no change” = **skip that field**.  
Filled = **same new value written on all matches**.

This is normal CRM **bulk update** behavior (mass edit), not “generate unique names per person.”

---

## Good uses

- Set status `inactive` → `active` for a segment  
- Set company `industry` to `Logistics` for all prospects  
- Set lead `source` to `bulk_campaign`  

## Be careful

- Putting one email on thousands of contacts will collide with unique email indexes → many may **fail** or **skip** (dedup)  
- Prefer updating **status / industry / source / stage**, not unique emails, unless you know what you’re doing  

---

## API shape

```json
{
  "accountId": "acc_demo",
  "entityType": "contact",
  "filters": { "status": "active" },
  "updates": {
    "name": "Bulk Renamed",
    "age": 30
  }
}
```

Only keys inside `updates` are changed.

---

## Related

- [[13-Hosting-Guide]]
- [[03-API-Specification]]
