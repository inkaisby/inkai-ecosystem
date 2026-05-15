-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "eventId" TEXT;

-- CreateIndex
CREATE INDEX "Attendance_memberId_eventId_idx" ON "Attendance"("memberId", "eventId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
