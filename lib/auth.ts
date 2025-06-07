import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface User {
    _id?: string;
    username: string;
    email: string;
    password: string;
    deviceId?: string;
    createdAt: Date;
}

export function hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
}

export function verifyPassword(
    password: string,
    hashedPassword: string
): boolean {
    return bcrypt.compareSync(password, hashedPassword);
}

export function generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
        return null;
    }
}
