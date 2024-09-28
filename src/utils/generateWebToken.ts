import jwt from "jsonwebtoken";

export default function generateWebToken(userId: string, username: string) {
    const token = jwt.sign({ userId, username }, process.env.JWT_SECRET!,{
        expiresIn: "30d",
    });

    return token;
}