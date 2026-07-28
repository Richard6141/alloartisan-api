-- AlterTable
ALTER TABLE "admin_role_defs" ALTER COLUMN "permissions" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "perm_granted" DROP DEFAULT,
ALTER COLUMN "perm_revoked" DROP DEFAULT;
