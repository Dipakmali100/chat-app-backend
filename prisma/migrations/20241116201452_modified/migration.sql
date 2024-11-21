-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "replyMsgId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyMsgId_fkey" FOREIGN KEY ("replyMsgId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
