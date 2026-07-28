-- AlterTable
ALTER TABLE "annonces_chantier" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "profils_travailleur" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_role_id" VARCHAR(36),
ADD COLUMN     "perm_granted" TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
ADD COLUMN     "perm_revoked" TEXT[] NOT NULL DEFAULT ARRAY[]::text[];

-- CreateTable
CREATE TABLE "admin_role_defs" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(255),
    "is_builtin" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_role_defs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_role_defs_name_key" ON "admin_role_defs"("name");

-- RenameForeignKey
ALTER TABLE "annonces_chantier" RENAME CONSTRAINT "annonce_metier_fkey" TO "annonces_chantier_metier_id_fkey";

-- RenameForeignKey
ALTER TABLE "annonces_chantier" RENAME CONSTRAINT "annonce_patron_fkey" TO "annonces_chantier_patron_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "avis_travail" RENAME CONSTRAINT "avis_travail_engagement_fkey" TO "avis_travail_engagement_id_fkey";

-- RenameForeignKey
ALTER TABLE "engagements_travail" RENAME CONSTRAINT "engagement_patron_fkey" TO "engagements_travail_patron_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "engagements_travail" RENAME CONSTRAINT "engagement_profil_fkey" TO "engagements_travail_profil_travailleur_id_fkey";

-- RenameForeignKey
ALTER TABLE "manifestations_interet" RENAME CONSTRAINT "interet_annonce_fkey" TO "manifestations_interet_annonce_id_fkey";

-- RenameForeignKey
ALTER TABLE "manifestations_interet" RENAME CONSTRAINT "interet_profil_fkey" TO "manifestations_interet_profil_travailleur_id_fkey";

-- RenameForeignKey
ALTER TABLE "profil_travailleur_metiers" RENAME CONSTRAINT "ptm_metier_fkey" TO "profil_travailleur_metiers_metier_id_fkey";

-- RenameForeignKey
ALTER TABLE "profil_travailleur_metiers" RENAME CONSTRAINT "ptm_profil_fkey" TO "profil_travailleur_metiers_profil_travailleur_id_fkey";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_admin_role_id_fkey" FOREIGN KEY ("admin_role_id") REFERENCES "admin_role_defs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "avis_travail_engagement_sens_key" RENAME TO "avis_travail_engagement_id_sens_key";

-- RenameIndex
ALTER INDEX "manifestations_annonce_profil_key" RENAME TO "manifestations_interet_annonce_id_profil_travailleur_id_key";

-- RenameIndex
ALTER INDEX "profil_travailleur_metiers_profil_metier_key" RENAME TO "profil_travailleur_metiers_profil_travailleur_id_metier_id_key";
