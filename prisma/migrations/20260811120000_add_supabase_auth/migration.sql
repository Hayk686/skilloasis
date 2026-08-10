ALTER TABLE "User"
ADD COLUMN "authId" UUID,
ADD COLUMN "email" TEXT;

CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");
