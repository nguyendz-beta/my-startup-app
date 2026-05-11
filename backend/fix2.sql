ALTER TABLE product_ingredients ADD COLUMN variantId VARCHAR(191) NULL;
ALTER TABLE product_ingredients DROP INDEX product_ingredients_productId_itemId_key;
ALTER TABLE product_ingredients ADD UNIQUE INDEX product_ingredients_productId_itemId_variantId_key (productId, itemId, variantId);
ALTER TABLE product_ingredients ADD CONSTRAINT product_ingredients_variantId_fkey FOREIGN KEY (variantId) REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE;