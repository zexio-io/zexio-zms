import { createRoute, z } from "@hono/zod-openapi";

// 1. Sign Up Route
export const signUpRoute = createRoute({
  method: 'post',
  path: '/api/auth/sign-up/email',
  summary: 'Sign up with email and password (Body: email, password, name)',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Successfully signed up',
      content: { 
        'application/json': { 
          schema: z.object({ 
            success: z.boolean(),
            data: z.object({
              user: z.object({ id: z.string(), email: z.string(), name: z.string() }),
              session: z.object({ id: z.string() })
            })
          }) 
        } 
      }
    },
    400: {
      description: 'Bad Request',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    }
  }
});

// 2. Sign In Route
export const signInRoute = createRoute({
  method: 'post',
  path: '/api/auth/sign-in/email',
  summary: 'Sign in with email and password (Body: email, password)',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Successfully signed in',
      content: { 
        'application/json': { 
          schema: z.object({ 
            success: z.boolean(),
            data: z.object({
              user: z.object({ id: z.string(), email: z.string(), name: z.string() }),
              session: z.object({ id: z.string() })
            })
          }) 
        } 
      }
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    }
  }
});

// 3. Sign Out Route
export const signOutRoute = createRoute({
  method: 'post',
  path: '/api/auth/sign-out',
  summary: 'Sign out the current session',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Successfully signed out',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } }
    }
  }
});

// 4. Session Route
export const getSessionRoute = createRoute({
  method: 'get',
  path: '/api/auth/get-session',
  summary: 'Get the current session details',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Current session',
      content: { 
        'application/json': { 
          schema: z.object({ 
            success: z.boolean(),
            data: z.object({
              user: z.object({ id: z.string(), email: z.string(), name: z.string() }),
              session: z.object({ id: z.string() })
            }).nullable()
          }) 
        } 
      }
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    },
    500: {
      description: 'Server Error',
      content: { 'application/json': { schema: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string() }) }) } }
    }
  }
});
