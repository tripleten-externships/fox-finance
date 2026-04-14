/*
  Warnings:

  - A unique constraint covering the columns `[page]` on the table `PageVisitCounter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PageVisitCounter_page_key" ON "PageVisitCounter"("page");
