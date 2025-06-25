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
      <div className="pt-12 px-4 pb-6 flex justify-center items-center h-screen">
        <p>Loading products...</p>
      </div>
    );
  }

  const topProduct = products[0];

  return (
    <div className="pt-12 px-4 pb-6 flex flex-col items-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-2 text-center">
        Welcome to Shop Minis!
      </h1>
      <p className="text-xs text-blue-600 mb-4 text-center bg-blue-50 py-2 px-4 rounded border border-blue-200">
        🛠️ Edit <b>src/App.tsx</b> to change this come back to see
        your edits!
      </p>
      <p className="text-base text-gray-600 mb-6 text-center">
        These are the popular products today
      </p>
      <div className="relative w-full h-full flex justify-center items-center">
        <AnimatePresence>
          {products.slice(0, 2).reverse().map((product, index) => {
            const isTop = index === 1;
            return (
              <motion.div
                key={product.id}
                className="absolute w-[80%] h-[60%]"
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
                    className="w-full h-full"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ) : (
                  <div className="w-full h-full">
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


