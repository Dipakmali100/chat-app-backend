import { Request, Response } from "express";
import client from "../utils/prismaClient";
import generateWebToken from "../utils/generateWebToken";

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(200).json({
        success: false,
        message: "Please enter username and password",
      });
    }

    const user = await client.user.create({
      data: {
        username,
        password,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const login = async(req:Request, res:Response):Promise<any>=>{
    try{
        const{username, password} = req.body;
        
        if(!username || !password){
            return res.status(200).json({
                success: false,
                message: "Please enter username and password",
            })
        }

        const user:any = await client.user.findUnique({
            where: {
                username,
                password
            }
        })

        if(!user){
            return res.status(200).json({
                success: false,
                message: "User not found",
            })
        }

        // Generate JWT token
        const token = generateWebToken(user.id, user.username);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                userId: user.id,
                username: user.username,
                token
            }
        })
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        })
    }
}

export const verify = async(req:Request, res:Response):Promise<any>=>{
    return res.status(200).json({
        success: true
    })
}