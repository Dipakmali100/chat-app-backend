import { Request, Response } from "express";
import DateInIST from "../constants/DateInIST";
import client from "../utils/prismaClient";
import formattedTime from "../utils/formattedTime";

export const getFriendList = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId: any = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is not logged in",
      });
    }

    // Find all connections where the firstUser is the given user
    const connections = await client.connection.findMany({
      where: {
        firstUserId: userId,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        secondUser: {
          select: {
            id: true,
            username: true,
            imgUrl: true,
          },
        },
        createdAt: true,
      },
    });

    // Reshape the result to remove the "secondUser" nesting
    const formattedConnections = connections.map((connection) => {
      const timeAndDate = formattedTime(connection.createdAt);
      return {
        senderId: connection.secondUser.id,
        username: connection.secondUser.username,
        pendingMessages: 0,
        content: "",
        status: "",
        statusForUI: "",
        imgUrl: connection.secondUser.imgUrl,
        time: timeAndDate.showTime,
        date: timeAndDate.showDate,
        createdAt: connection.createdAt
      };
    });

    // Find pending messages for each connection
    const pendingMessages = await client.message.groupBy({
      by: ["senderId"],
      where: {
        receiverId: userId,
        OR: [
          {
            status: "sent",
          },
          {
            status: "received",
          },
        ],
      },
      _count: {
        senderId: true,
      },
    });

    // Format the pending messages
    let formattedPendingMessages: { [key: string]: number } = {};
    pendingMessages.forEach((message) => {
      formattedPendingMessages[message.senderId] = message._count.senderId;
    });

    // Update the status of pending messages
    await client.message.updateMany({
      where: {
        receiverId: userId,
        status: "sent",
      },
      data: {
        status: "received",
      },
    });

    // Add the pending messages to the connections
    formattedConnections.forEach((connection) => {
      if (formattedPendingMessages[connection.senderId]) {
        connection.pendingMessages =
          formattedPendingMessages[connection.senderId];
      }
    });

    // Find the last message of each connection
    const getLastMessageOfEachConnection = await Promise.all(
      formattedConnections.map(async (connection) => {
        return await client.message.findFirst({
          where: {
            OR: [
              {
                senderId: connection.senderId,
                receiverId: userId,
              },
              {
                senderId: userId,
                receiverId: connection.senderId,
              },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            senderId: true,
            receiverId: true,
            content: true,
            status: true,
            createdAt: true,
          },
        });
      })
    );

    // Add the last message to the connections
    formattedConnections.forEach((connection) => {
      const lastMessage = getLastMessageOfEachConnection.find(
        (message) =>
          (message?.senderId === connection.senderId &&
            message?.receiverId === userId) ||
          (message?.senderId === userId &&
            message?.receiverId === connection.senderId)
      );
      if (lastMessage) {
        connection.content = lastMessage.content;
        connection.status = lastMessage.status;
        if(lastMessage.senderId === userId){
          connection.statusForUI = "sent";
        }else{
          connection.statusForUI = "received";
        }
        connection.createdAt = lastMessage.createdAt;
        const timeAndDate = formattedTime(lastMessage.createdAt);
        connection.time = timeAndDate.showTime;
        connection.date = timeAndDate.showDate;
      }
    });

    // Sort in descending order of createdAt along with type for typescript
    formattedConnections.sort((a, b) => {
      if (a.createdAt < b.createdAt) {
        return 1;
      }
      if (a.createdAt > b.createdAt) {
        return -1;
      }
      return 0;
    });

    return res.status(200).json({
      success: true,
      message: "Friend list fetched successfully",
      data: formattedConnections,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getChat = async (req: Request, res: Response): Promise<any> => {
  try {
    const senderId: any = req.user?.id;
    const receiverId = req.body.friendId;

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "User is not logged in",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "receiverId is required",
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You can't send message to yourself",
      });
    }

    // check if they are connected
    const isConnected = await client.connection.findMany({
      where: {
        OR: [
          {
            firstUserId: senderId,
            secondUserId: receiverId,
          },
          {
            firstUserId: receiverId,
            secondUserId: senderId,
          },
        ],
      },
    });

    if (!isConnected || isConnected.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User is not connected",
      });
    }

    // get all messages
    const messages = await client.message.findMany({
      where: {
        OR: [
          {
            senderId,
            receiverId,
          },
          {
            senderId: receiverId,
            receiverId: senderId,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        status: true,
        createdAt: true,
      },
    });

    // marking the msg, So we can differentiate between sent and received when displaying
    messages.forEach((message:any) => {
      if (message.senderId === senderId) {
        message.statusForUI = "sent";
      } else {
        message.statusForUI = "received";
      }

      const timeAndDate = formattedTime(message.createdAt);
      message.time = timeAndDate.showTime;
      message.date = timeAndDate.showDate;
    });

    // mark the msg as read
    await client.message.updateMany({
      where: {
        senderId: receiverId,
        receiverId: senderId,
      },
      data: {
        status: "seen",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Chat fetched successfully",
      data: messages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const senderId:any = req.user?.id;

    const body: any = req.body;
    const { receiverId, content } = body;

    if(!senderId){
      return res.status(400).json({
        success: false,
        message: "User is not logged in",
      });
    }

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: "receiverId and content are required",
      });
    }

    if(receiverId === senderId){
      return res.status(400).json({
        success: false,
        message: "You can't send message to yourself",  
      });
    }

    const isConnected = await client.connection.findMany({
      where: {
        OR: [
          {
            firstUserId: senderId,
            secondUserId: receiverId,
          },
          {
            firstUserId: receiverId,
            secondUserId: senderId,
          },
        ],
      },
    });

    if (!isConnected || isConnected.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User is not connected",
      });
    }

    const DateTime:any = DateInIST();

    const message = await client.message.create({
      data: {
        senderId,
        receiverId,
        content,
        status: "sent",
        createdAt: DateTime,
        updatedAt: DateTime,
      },
    });

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Failed to send message",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};