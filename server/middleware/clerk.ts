import dotenv from "dotenv";
dotenv.config();
import { clerkClient } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

if (!process.env.CLERK_SECRET_KEY) {
  console.warn('WARNING: CLERK_SECRET_KEY is not set. Authentication will not work.');
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const verifiedToken = await clerkClient.verifyToken(token);
      
      if (!verifiedToken || !verifiedToken.sub) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const user = await clerkClient.users.getUser(verifiedToken.sub);
      
      req.userId = verifiedToken.sub;
      req.user = user;
      
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const verifiedToken = await clerkClient.verifyToken(token);
        
        if (verifiedToken && verifiedToken.sub) {
          const user = await clerkClient.users.getUser(verifiedToken.sub);
          req.userId = verifiedToken.sub;
          req.user = user;
        }
      } catch (verifyError) {
        console.log('Optional auth: token verification failed, continuing without auth');
      }
    }
  } catch (error) {
    console.error('Optional auth error:', error);
  }
  
  next();
};
