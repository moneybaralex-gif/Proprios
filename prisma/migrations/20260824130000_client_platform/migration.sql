-- Proprios client platform: certification, KYC and favorites
DO $$ BEGIN
  CREATE TYPE "CertificationStatus" AS ENUM ('ATTENTE', 'EN_COURS', 'CERTIFIE', 'REJETE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "plots" ADD COLUMN IF NOT EXISTS "certificationStatus" "CertificationStatus" NOT NULL DEFAULT 'ATTENTE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "identityCardPhotoUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portraitPhotoUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cardHoldingPhotoUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycSubmittedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycReviewedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycRejectionReason" TEXT;

UPDATE "plots" SET "certificationStatus" = CASE WHEN "certified" = true THEN 'CERTIFIE'::"CertificationStatus" ELSE 'ATTENTE'::"CertificationStatus" END;

CREATE TABLE IF NOT EXISTS "_FavoritePlots" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_FavoritePlots_AB_unique" UNIQUE ("A", "B")
);
CREATE INDEX IF NOT EXISTS "_FavoritePlots_B_index" ON "_FavoritePlots"("B");
DO $$ BEGIN
  ALTER TABLE "_FavoritePlots" ADD CONSTRAINT "_FavoritePlots_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "_FavoritePlots" ADD CONSTRAINT "_FavoritePlots_B_fkey" FOREIGN KEY ("B") REFERENCES "plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
