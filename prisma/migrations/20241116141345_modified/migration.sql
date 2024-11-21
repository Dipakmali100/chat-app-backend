/*
  Warnings:

  - Made the column `replyMsgId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_replyMsgId_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "replyMsgId" SET NOT NULL,
ALTER COLUMN "replyMsgId" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyMsgId_fkey" FOREIGN KEY ("replyMsgId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
