import { Request, Response, NextFunction } from 'express'; // Import necessary types
import jwt from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction):any => {
    const authHeader = req.headers.authorization; // Use 'authorization' instead of 'get'
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized user",
        });
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user",
            });
        }

        req.user = {
            id: decoded.userId,
            username: decoded.username,
        };

        next();
    });
};
