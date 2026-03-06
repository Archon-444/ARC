/**
 * Authorization Middleware - IDOR Protection
 * Prevents Insecure Direct Object References by validating resource ownership
 */

import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
    id: string;
  };
}

/**
 * Verify that the authenticated user owns the resource
 * Prevents IDOR attacks by checking ownership before allowing access
 */
export function requireOwnership(resourceOwnerField: string = 'owner') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      
      if (!user || !user.address) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Get resource from request body or params
      const resource = req.body || req.params;
      const resourceOwner = resource[resourceOwnerField];

      if (!resourceOwner) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Resource must have ${resourceOwnerField} field`
        });
      }

      // Compare owner address (case-insensitive)
      const normalizedUserAddress = user.address.toLowerCase();
      const normalizedResourceOwner = resourceOwner.toLowerCase();

      if (normalizedUserAddress !== normalizedResourceOwner) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        });
      }

      next();
    } catch (error) {
      console.error('[Authorization] Error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authorization check failed'
      });
    }
  };
}

/**
 * Verify that the authenticated user is the creator of the resource
 */
export function requireCreator() {
  return requireOwnership('creator');
}

/**
 * Verify that the authenticated user is the seller of the resource
 */
export function requireSeller() {
  return requireOwnership('seller');
}

/**
 * Verify resource exists and user has access
 * Queries database to ensure resource exists before checking ownership
 */
export function requireResourceAccess(
  getResourceFn: (id: string) => Promise<any>,
  ownerField: string = 'owner'
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      const resourceId = req.params.id;

      if (!user || !user.address) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      if (!resourceId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Resource ID required'
        });
      }

      // Fetch resource from database
      const resource = await getResourceFn(resourceId);

      if (!resource) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Resource not found'
        });
      }

      const resourceOwner = resource[ownerField];

      if (!resourceOwner) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: `Resource missing ${ownerField} field`
        });
      }

      // Compare owner address (case-insensitive)
      const normalizedUserAddress = user.address.toLowerCase();
      const normalizedResourceOwner = resourceOwner.toLowerCase();

      if (normalizedUserAddress !== normalizedResourceOwner) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        });
      }

      // Attach resource to request for downstream use
      (req as any).resource = resource;

      next();
    } catch (error) {
      console.error('[Authorization] Error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authorization check failed'
      });
    }
  };
}

export default {
  requireOwnership,
  requireCreator,
  requireSeller,
  requireResourceAccess,
};
