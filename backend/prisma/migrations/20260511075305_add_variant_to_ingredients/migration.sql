/*
  Warnings:

  - A unique constraint covering the columns `[productId,itemId,variantId]` on the table `product_ingredients` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `product_ingredients` DROP FOREIGN KEY `product_ingredients_productId_fkey`;

-- DropIndex
DROP INDEX `product_ingredients_productId_itemId_key` ON `product_ingredients`;

-- AlterTable
ALTER TABLE `product_ingredients` ADD COLUMN `variantId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `product_ingredients_productId_itemId_variantId_key` ON `product_ingredients`(`productId`, `itemId`, `variantId`);

-- AddForeignKey
ALTER TABLE `product_ingredients` ADD CONSTRAINT `product_ingredients_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
