import * as Joi from 'joi';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;
  POSTGRES_DB?: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  FRONTEND_URL?: string;
}

export const envValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required in .env',
  }),

  POSTGRES_USER: Joi.string().optional(),
  POSTGRES_PASSWORD: Joi.string().optional(),
  POSTGRES_DB: Joi.string().optional(),

  JWT_SECRET: Joi.string().min(6).required().messages({
    'string.min': 'JWT_SECRET must be at least 6 characters long',
    'any.required': 'JWT_SECRET is required in .env',
  }),

  JWT_EXPIRE: Joi.string().default('3d'),

  CLOUDINARY_CLOUD_NAME: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_CLOUD_NAME is required in .env',
  }),

  CLOUDINARY_API_KEY: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_API_KEY is required in .env',
  }),

  CLOUDINARY_API_SECRET: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_API_SECRET is required in .env',
  }),

  FRONTEND_URL: Joi.string().optional(),
});

export const validationOptions: Joi.ValidationOptions = {
  allowUnknown: true, // Allow extraneous/system environment variables
  abortEarly: false,  // Report all missing/invalid fields at once
};
