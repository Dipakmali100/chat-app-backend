import { Request, Response } from "express";
import client from "../utils/prismaClient";
import DateInIST from "../constants/DateInIST";

export const searchUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId: any = req.user?.id;
    let { searchedUsername } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User is not logged in",
      });
    }

    if (!searchedUsername) {
      return res.status(400).json({
        success: false,
        message: "Searched username is required",
      });
    }

    searchedUsername = searchedUsername.toLowerCase();

    let result = await client.user.findMany({
      where: {
        username: {
          contains: searchedUsername,
        },
        id: {
          not: userId,
        },
      },
      select: {
        id: true,
        username: true,
        imgUrl: true,
      },
      take: 3,
    });

    if (!result) {
      return res.status(200).json({
        success: true,
        message: "No users found",
        data: [],
      });
    }

    const connections = await client.connection.findMany({
      where: {
        firstUserId: userId,
        secondUserId: {
          in: result.map((user) => user.id),
        },
      },
      select: {
        secondUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    result = result.map((user) => {
      return {
        ...user,
        isConnected: connections.some(
          (connection) => connection.secondUser.id === user.id
        ),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Users found",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const connect = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { secondUserId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User is not logged in",
      });
    }

    if (!secondUserId) {
      return res.status(400).json({
        success: false,
        message: "Second user ID is required",
      });
    }

    // Check if the users exist
    const users = await client.user.findMany({
      where: {
        id: { in: [userId, secondUserId] },
      },
      select: {
        id: true,
        username: true,
      },
    });

    // Extracting the usernames
    const firstUser = users.find((user) => user.id === Number(userId));
    const secondUser = users.find((user) => user.id === secondUserId);

    if (users.length !== 2 || !firstUser || !secondUser) {
      return res.status(400).json({
        success: false,
        message: "Username not found",
      });
    }

    if (firstUser.username === secondUser.username) {
      return res.status(400).json({
        success: false,
        message: "You cannot connect with yourself",
      });
    }

    const DateTime = DateInIST();
    await client.connection.createMany({
      data: [
        {
          firstUserId: firstUser.id,
          secondUserId: secondUser.id,
          createdAt: DateTime,
        },
        {
          firstUserId: secondUser.id,
          secondUserId: firstUser.id,
          createdAt: DateTime,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Connection created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const disconnect = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { friendId, isDeleteChat } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User is not logged in",
      });
    }

    if (!friendId || isDeleteChat === undefined) {
      return res.status(400).json({
        success: false,
        message: "friendId and isDeleteChat is required",
      });
    }

    if (Number(friendId) === Number(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot disconnect with yourself",
      });
    }

    await client.connection.deleteMany({
      where: {
        OR: [
          {
            firstUserId: Number(userId),
            secondUserId: Number(friendId),
          },
          {
            firstUserId: Number(friendId),
            secondUserId: Number(userId),
          },
        ],
      },
    });

    if (isDeleteChat) {
      await client.message.deleteMany({
        where: {
          OR: [
            {
              senderId: Number(userId),
              receiverId: Number(friendId),
            },
            {
              senderId: Number(friendId),
              receiverId: Number(userId),
            },
          ],
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Connection disconnected successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
