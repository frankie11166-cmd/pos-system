ALTER TABLE "ActivityHistory" ADD COLUMN "userAccountId" INTEGER;

ALTER TABLE "ActivityHistory"
ADD CONSTRAINT "ActivityHistory_userAccountId_fkey"
FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
