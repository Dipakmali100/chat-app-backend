import client from "./prismaClient";

export default async function getFriendList(userId: number) {
    const friendList = await client.connection.findMany({
        where: {
            firstUserId: userId,
        },
        select: {
            secondUser: {
                select: {
                    id: true
                },
            },
        },
    });
    return friendList;
}