import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shipmnts Bulk Action Platform API',
      version: '1.0.0',
      description:
        'Scalable bulk action engine for CRM entities. Start with Contact bulk update.',
    },
    servers: [{ url: 'http://localhost:3000/api/v1', description: 'Local' }],
    tags: [
      { name: 'Health', description: 'Service health' },
      { name: 'Bulk Actions', description: 'Bulk action lifecycle' },
      { name: 'Contacts', description: 'Sample CRM contacts' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
});
