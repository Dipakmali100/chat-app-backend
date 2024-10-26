import { Request, Response } from "express";
import client from "../utils/prismaClient";
import generateWebToken from "../utils/generateWebToken";
import DateInIST from "../constants/DateInIST";

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    let { username } = req.body;
    const { password } = req.body;
    const { imgUrl } = req.body;

    if (!username || !password || !imgUrl) {
      return res.status(200).json({
        success: false,
        message: "Please enter username, password and image URL",
      });
    }

    username = username.toLowerCase().trim();

    const userExists = await client.user.findUnique({
      where: {
        username,
      },
    });

    if (userExists) {
      return res.status(200).json({
        success: false,
        message: "Username already exists",
      });
    }

    const DateTime: any = DateInIST();
    const user = await client.user.create({
      data: {
        username,
        password,
        imgUrl,
        verified: false,
        verificationDate: DateTime,
        createdAt: DateTime,
        updatedAt: DateTime,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
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
        imgUrl: user.imgUrl,
        verified: user.verified,
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
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id, username }: any = req.user;

    const userExists = await client.user.findUnique({
      where: {
        id,
        username,
      },
    });

    if (!userExists) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User verified successfully",
      data: {
        userId: id,
        username,
        imgUrl: userExists.imgUrl,
        verified: userExists.verified,
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

export const uniqueUsername = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(200).json({
        success: false,
        message: "Please enter username",
      });
    }

    const userExists = await client.user.findUnique({
      where: {
        username,
      },
    });

    if (userExists) {
      return res.status(200).json({
        success: false,
        message: "Username already exists",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Username is unique",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const changeAvatar = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user?.id;
    const { imgUrl } = req.body;

    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User is not logged in",
      });
    }

    if (!imgUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const user = await client.user.update({
      where: {
        id: Number(userId),
      },
      data: {
        imgUrl: imgUrl,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Avatar changed successfully",
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
