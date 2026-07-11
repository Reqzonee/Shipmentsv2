import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { connectDB, Contact } from '@shipments/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const accountId = process.argv[2] ?? 'acc_demo';
const count = Number(process.argv[3] ?? 2000);

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Ananya', 'Diya', 'Myra',
  'Sara', 'Kiara', 'Reyansh', 'Ayaan', 'Navya', 'Pari', 'Ishaan',
];
const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Shah', 'Joshi',
  'Reddy', 'Nair', 'Chopra', 'Kapoor',
];
const STATUSES = ['active', 'inactive', 'lead'] as const;

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');

  await connectDB(uri);

  const stamp = Date.now();
  const docs = Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];
    return {
      accountId,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}.${stamp}.${i}@example.com`,
      age: 18 + (i % 50),
      status: STATUSES[i % STATUSES.length],
    };
  });

  const inserted = await Contact.insertMany(docs, { ordered: false });
  console.log(`Seeded ${inserted.length} contacts for account ${accountId}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
