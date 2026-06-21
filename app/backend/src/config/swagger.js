const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ladli Bridal Studio API',
      version: '1.0.0',
      description: `
# Ladli Bridal Studio — REST API Documentation

A production-ready backend for a luxury beauty salon & bridal studio.

## Authentication
Most endpoints require a Bearer JWT token. Obtain one via \`POST /api/v1/auth/login\`.

## Rate Limiting
- General: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes

## Versioning
All endpoints are prefixed with \`/api/v1\`
      `,
      contact: {
        name: 'Ladli Bridal Studio',
        email: 'admin@ladlibridalstudio.com',
      },
      license: { name: 'MIT' },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development Server',
      },
      {
        url: 'https://api.ladlibridalstudio.com/api/v1',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsDoc(options);
module.exports = swaggerSpec;
