import {
  usePopularProducts,
  ProductCard,
} from '@shopify/shop-minis-react';
import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

export function App() {
  const { products: initialProducts } = usePopularProducts();
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  const handleSwipe = (productId: string) => {
    setProducts((currentProducts) => {
      if (!currentProducts) return [];
      const swipedItem = currentProducts.find(p => p.id === productId);
      if (!swipedItem) return currentProducts;
      const otherProducts = currentProducts.filter(p => p.id !== productId);
      return [...otherProducts, swipedItem];
    });
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);

  if (!products?.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex justify-center items-center bg-gray-50">
      <div className="relative w-full h-full flex justify-center items-center">
        <AnimatePresence>
          {products.slice(0, 2).reverse().map((product, index) => {
            const isTop = index === 1;
            return (
              <motion.div
                key={product.id}
                className="absolute w-[85%] max-w-[400px]"
                style={{
                  scale: isTop ? 1 : 0.95,
                  y: isTop ? 0 : -20,
                  zIndex: index,
                }}
                animate={{
                  scale: isTop ? 1 : 0.95,
                  y: isTop ? 0 : -20,
                }}
              >
                {isTop ? (
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 100) {
                        handleSwipe(product.id);
                      }
                    }}
                    style={{ x, rotate }}
                    className="w-full"
                  >
                    <div className="shadow-lg rounded-lg overflow-hidden bg-white">
                      <ProductCard product={product} />
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full shadow-lg rounded-lg overflow-hidden bg-white">
                    <ProductCard product={product} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}


