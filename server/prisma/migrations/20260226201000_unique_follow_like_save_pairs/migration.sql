-- Remove duplicate likes before enforcing uniqueness
DELETE FROM "Like" l1
USING "Like" l2
WHERE l1."id" > l2."id"
  AND l1."userId" = l2."userId"
  AND l1."postId" = l2."postId";

-- Remove duplicate saves before enforcing uniqueness
DELETE FROM "Save" s1
USING "Save" s2
WHERE s1."id" > s2."id"
  AND s1."userId" = s2."userId"
  AND s1."postId" = s2."postId";

-- Remove duplicate follows before enforcing uniqueness
DELETE FROM "Follow" f1
USING "Follow" f2
WHERE f1."id" > f2."id"
  AND f1."giverId" = f2."giverId"
  AND f1."receiverId" = f2."receiverId";

-- Add unique constraints for relation pairs
CREATE UNIQUE INDEX "Like_userId_postId_key" ON "Like"("userId", "postId");
CREATE UNIQUE INDEX "Save_userId_postId_key" ON "Save"("userId", "postId");
CREATE UNIQUE INDEX "Follow_giverId_receiverId_key" ON "Follow"("giverId", "receiverId");
