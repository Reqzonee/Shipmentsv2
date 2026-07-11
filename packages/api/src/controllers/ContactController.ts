import type { Request, Response } from 'express';
import { Contact } from '@shipments/shared';
import { sendOk, sendFail } from '../middleware/errorHandler.js';

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Ananya', 'Aadhya', 'Diya', 'Myra', 'Sara', 'Anika',
  'Pari', 'Aarohi', 'Navya', 'Kiara',
];
const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Shah', 'Joshi',
  'Reddy', 'Nair', 'Iyer', 'Chopra', 'Kapoor', 'Malhotra', 'Desai',
];
const STATUSES = ['active', 'inactive', 'lead'] as const;

/**
 * @swagger
 * /contacts:
 *   get:
 *     tags: [Contacts]
 *     summary: List contacts (paginated + filters)
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema: { type: string, default: acc_demo }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, lead] }
 *       - in: query
 *         name: q
 *         description: Search name or email
 *         schema: { type: string }
 *       - in: query
 *         name: minAge
 *         schema: { type: integer }
 *       - in: query
 *         name: maxAge
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated contacts
 */
export async function listContacts(req: Request, res: Response) {
  try {
    const accountId = String(req.query.accountId ?? 'acc_demo');
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const filter: Record<string, unknown> = { accountId };

    if (req.query.status) {
      filter.status = String(req.query.status);
    }

    const q = String(req.query.q ?? '').trim();
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const minAge = req.query.minAge !== undefined ? Number(req.query.minAge) : NaN;
    const maxAge = req.query.maxAge !== undefined ? Number(req.query.maxAge) : NaN;
    if (!Number.isNaN(minAge) || !Number.isNaN(maxAge)) {
      const age: Record<string, number> = {};
      if (!Number.isNaN(minAge)) age.$gte = minAge;
      if (!Number.isNaN(maxAge)) age.$lte = maxAge;
      filter.age = age;
    }

    const [data, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return sendOk(res, {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list contacts';
    return sendFail(res, message, 500);
  }
}

/**
 * @swagger
 * /contacts/seed:
 *   post:
 *     tags: [Contacts]
 *     summary: Seed sample contacts for testing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId: { type: string, example: acc_demo }
 *               count: { type: integer, example: 2000, default: 2000 }
 *     responses:
 *       201:
 *         description: Contacts seeded
 */
export async function seedContacts(req: Request, res: Response) {
  try {
    const accountId = String(req.body?.accountId ?? 'acc_demo');
    const count = Math.min(10_000, Math.max(1, Number(req.body?.count ?? 2000)));

    const docs = [];
    const stamp = Date.now();
    for (let i = 0; i < count; i++) {
      const first = FIRST_NAMES[i % FIRST_NAMES.length];
      const last = LAST_NAMES[i % LAST_NAMES.length];
      docs.push({
        accountId,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}.${stamp}.${i}@example.com`,
        age: 18 + (i % 50),
        status: STATUSES[i % STATUSES.length],
      });
    }

    const result = await Contact.insertMany(docs, { ordered: false }).catch(
      (err: { insertedDocs?: unknown[]; writeErrors?: unknown[] }) => {
        if (err.insertedDocs) return err.insertedDocs;
        throw err;
      }
    );

    const inserted = Array.isArray(result) ? result.length : 0;
    return sendOk(
      res,
      { accountId, requested: count, inserted },
      `Seeded ${inserted} contacts`,
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to seed contacts';
    return sendFail(res, message, 500);
  }
}
