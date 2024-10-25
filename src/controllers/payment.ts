import { Request, Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay"
import client from "../utils/prismaClient";
import DateInIST from "../constants/DateInIST";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_SECRET_KEY
})
export const createOrder = async (req: Request, res: Response): Promise<any> => {
    try{
        const {amount, currency, receipt} = req.body;

        if(!amount || !currency || !receipt){
            return res.status(400).json({
                success: false,
                message: "Required parameters are missing"
            })
        }

        if(amount !== 1000){
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            })
        }

        const order = await razorpay.orders.create({
            amount,
            currency,
            receipt
        });

        if(!order){
            res.status(500).json({
                success: false,
                message: "Something went wrong"
            })
        }

        res.status(200).json({
            success: true,
            message: "Order created successfully",
            data: order
        })
    }catch(err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: err
        })
    }
}

export const verifyPayment = async (req: Request, res: Response): Promise<any> => {
    try{
        const userId = req.user?.id;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Unauthorized user"
            })
        }

        if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
            return res.status(400).json({
                success: false,
                message: "Required parameters are missing"
            })
        }

        const sha = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || "");
        sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = sha.digest('hex');

        if(digest !== razorpay_signature){
            return res.status(400).json({
                success: false,
                message: "Invalid signature"
            })
        }

        const DateTime: any = DateInIST();
        await client.user.update({
            where: {
                id: Number(userId)
            },
            data: {
                verified: true,
                verificationDate: DateTime
            }
        })

        res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        })
    }catch(err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: err
        })
    }
}