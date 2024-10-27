import { Request, Response } from "express";
import client from "../utils/prismaClient";
import DateInIST from "../constants/DateInIST";

export const updateTraffic = async (req: Request, res: Response) : Promise<any>  => {
    try {
        const DateAndTime = DateInIST();
        await client.traffic.update({
            where: {
                id: 1
            },
            data: {
                count: {
                    increment: 1
                },
                updatedAt: DateAndTime
            }
        })

        return res.status(200).json({
            success: true
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false
        })
    }
};