-- CreateTable
CREATE TABLE "RankFeeTemplate" (
    "id" TEXT NOT NULL,
    "rankName" TEXT NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankFeeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RankFeeTemplate_rankName_key" ON "RankFeeTemplate"("rankName");

-- Seed initial data
INSERT INTO "RankFeeTemplate" ("id", "rankName", "fee", "createdAt", "updatedAt") VALUES
('putih-template-id-0001', 'Sabuk Putih', 485000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kuning-template-id-0002', 'Sabuk Oranye / Kuning', 495000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hijau-template-id-0003', 'Sabuk Hijau', 505000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('biru-template-id-0004', 'Sabuk Biru', 515000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('coklat-template-id-0005', 'Sabuk Coklat', 545000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
