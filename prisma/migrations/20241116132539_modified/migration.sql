-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_replyMsgId_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "replyMsgId" DROP NOT NULL,
ALTER COLUMN "replyMsgId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyMsgId_fkey" FOREIGN KEY ("replyMsgId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
