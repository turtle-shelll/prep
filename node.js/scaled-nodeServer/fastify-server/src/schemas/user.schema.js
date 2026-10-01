/**
 * Fastify JSON Schemas for input validation and high-speed serialization.
 * Fastify compiles these using Ajv and fast-json-stringify for max throughput.
 */

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string' },
  },
};

const getUsersSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        count: { type: 'integer' },
        data: {
          type: 'array',
          items: userSchema,
        },
      },
    },
  },
};

const getUserByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: userSchema,
      },
    },
  },
};

const createUserSchema = {
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: userSchema,
      },
    },
  },
};

module.exports = {
  getUsersSchema,
  getUserByIdSchema,
  createUserSchema,
};
