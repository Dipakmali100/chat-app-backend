import { Request, Response } from "express";
import client from "../utils/prismaClient";
import generateWebToken from "../utils/generateWebToken";
import DateInIST from "../constants/DateInIST";

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    let { username } = req.body;
    const { password } = req.body;

    if (!username || !password) {
      return res.status(200).json({
        success: false,
        message: "Please enter username and password",
      });
    }

    username = username.toLowerCase();

    const userExists = await client.user.findUnique({
      where: {
        username,
      },
    });

    if (userExists) {
      return res.status(200).json({
        success: false,
        message: "User already exists",
      });
    }

    const DateTime: any = DateInIST();
    const user = await client.user.create({
      data: {
        username,
        password,
        createdAt: DateTime,
        updatedAt: DateTime,
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

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    let { username } = req.body;
    const { password } = req.body;

    if (!username || !password) {
      return res.status(200).json({
        success: false,
        message: "Please enter username and password",
      });
    }

    username = username.toLowerCase();

    const user: any = await client.user.findUnique({
      where: {
        username,
        password,
      },
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "Username or password is incorrect",
      });
    }

    // Generate JWT token
    const token = generateWebToken(user.id, user.username);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        userId: user.id,
        username: user.username,
        token,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const verify = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, username }: any = req.user;

    return res.status(200).json({
      success: true,
      message: "User verified successfully",
      data: {
        userId: id,
        username,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
