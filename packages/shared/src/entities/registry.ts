import type { Model } from 'mongoose';
import { Contact } from '../models/Contact.js';
import { Company } from '../models/Company.js';
import { Lead } from '../models/Lead.js';
import { Opportunity } from '../models/Opportunity.js';
import { Task } from '../models/Task.js';
import type { EntityType } from '../constants.js';

export type EntityFieldDef = {
  key: string;
  label: string;
  type: 'string' | 'number' | 'email' | 'enum';
  enumValues?: readonly string[];
  /** Can be set in bulk update */
  updatable: boolean;
  /** Common filter field */
  filterable: boolean;
};

export type EntityDefinition = {
  type: EntityType;
  label: string;
  collectionLabel: string;
  /** Field used for de-duplication (assignment: email) */
  dedupeField: 'email';
  model: Model<any>;
  fields: EntityFieldDef[];
  defaultStatus: string;
};

export const ENTITY_REGISTRY: Record<EntityType, EntityDefinition> = {
  contact: {
    type: 'contact',
    label: 'Contact',
    collectionLabel: 'Contacts',
    dedupeField: 'email',
    model: Contact,
    defaultStatus: 'lead',
    fields: [
      { key: 'name', label: 'Name', type: 'string', updatable: true, filterable: false },
      { key: 'email', label: 'Email', type: 'email', updatable: true, filterable: false },
      { key: 'age', label: 'Age', type: 'number', updatable: true, filterable: true },
      {
        key: 'status',
        label: 'Status',
        type: 'enum',
        enumValues: ['active', 'inactive', 'lead'],
        updatable: true,
        filterable: true,
      },
    ],
  },
  company: {
    type: 'company',
    label: 'Company',
    collectionLabel: 'Companies',
    dedupeField: 'email',
    model: Company,
    defaultStatus: 'prospect',
    fields: [
      { key: 'name', label: 'Name', type: 'string', updatable: true, filterable: false },
      { key: 'email', label: 'Email', type: 'email', updatable: true, filterable: false },
      { key: 'industry', label: 'Industry', type: 'string', updatable: true, filterable: true },
      {
        key: 'status',
        label: 'Status',
        type: 'enum',
        enumValues: ['active', 'inactive', 'prospect'],
        updatable: true,
        filterable: true,
      },
    ],
  },
  lead: {
    type: 'lead',
    label: 'Lead',
    collectionLabel: 'Leads',
    dedupeField: 'email',
    model: Lead,
    defaultStatus: 'new',
    fields: [
      { key: 'name', label: 'Name', type: 'string', updatable: true, filterable: false },
      { key: 'email', label: 'Email', type: 'email', updatable: true, filterable: false },
      { key: 'source', label: 'Source', type: 'string', updatable: true, filterable: true },
      {
        key: 'status',
        label: 'Status',
        type: 'enum',
        enumValues: ['new', 'contacted', 'qualified', 'lost'],
        updatable: true,
        filterable: true,
      },
    ],
  },
  opportunity: {
    type: 'opportunity',
    label: 'Opportunity',
    collectionLabel: 'Opportunities',
    dedupeField: 'email',
    model: Opportunity,
    defaultStatus: 'prospecting',
    fields: [
      { key: 'name', label: 'Name', type: 'string', updatable: true, filterable: false },
      { key: 'email', label: 'Email', type: 'email', updatable: true, filterable: false },
      { key: 'amount', label: 'Amount', type: 'number', updatable: true, filterable: true },
      {
        key: 'status',
        label: 'Stage',
        type: 'enum',
        enumValues: [
          'prospecting',
          'qualification',
          'proposal',
          'negotiation',
          'closed_won',
          'closed_lost',
        ],
        updatable: true,
        filterable: true,
      },
    ],
  },
  task: {
    type: 'task',
    label: 'Task',
    collectionLabel: 'Tasks',
    dedupeField: 'email',
    model: Task,
    defaultStatus: 'todo',
    fields: [
      { key: 'name', label: 'Title', type: 'string', updatable: true, filterable: false },
      { key: 'email', label: 'Assignee email', type: 'email', updatable: true, filterable: false },
      {
        key: 'priority',
        label: 'Priority',
        type: 'enum',
        enumValues: ['low', 'medium', 'high'],
        updatable: true,
        filterable: true,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'enum',
        enumValues: ['todo', 'in_progress', 'done', 'cancelled'],
        updatable: true,
        filterable: true,
      },
    ],
  },
};

export function getEntityDef(entityType: string): EntityDefinition {
  const def = ENTITY_REGISTRY[entityType as EntityType];
  if (!def) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  return def;
}

export function listEntityDefs(): EntityDefinition[] {
  return Object.values(ENTITY_REGISTRY);
}
