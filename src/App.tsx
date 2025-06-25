import {
  useSavedProducts,
  ProductCard,
  // @ts-ignore
  type Product,
} from '@shopify/shop-minis-react';
import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

// Mock function to simulate video URL fetching
const fetchAIVideo = (productId: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://cdn.shopify.com/s/files/1/0000/0001/videos/ai-video-${productId}.mp4`);
    }, 1000); // Simulate network delay
  });
};
 
export function App() {
  const { products: initialProducts } = useSavedProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState<boolean>(true);
  const [modal, setModal] = useState<{ open: boolean; productId: string | null }>({ open: false, productId: null });

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Preload all AI videos before showing UI
  useEffect(() => {
    let isMounted = true;
    async function preloadVideos() {
      if (!initialProducts || initialProducts.length === 0) return;
      setLoadingVideos(true);
      const urls: Record<string, string> = {};
      for (const product of initialProducts) {
        urls[product.id] = await fetchAIVideo(product.id);
      }
      if (isMounted) {
        setVideoUrls(urls);
        setLoadingVideos(false);
      }
    }
    preloadVideos();
    return () => { isMounted = false; };
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

  if (!products?.length || loadingVideos) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading your favorite products...</p>
      </div>
    );
  }

  return (
    <div className="pt-12 px-4 pb-6 flex flex-col items-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-2 text-center">Your Favorites</h1>
      <p className="text-base text-gray-600 mb-6 text-center">Swipe to browse your saved products</p>
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
                      <button
                        className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow-md active:bg-blue-700 transition"
                        onClick={() => setModal({ open: true, productId: product.id })}
                      >
                        Generate AI Preview
                      </button>
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
      {/* Modal for AI Video */}
      {modal.open && modal.productId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-4 w-[90vw] max-w-sm flex flex-col items-center">
            <h2 className="text-lg font-bold mb-2">AI Generated Video</h2>
            <video
              src={videoUrls[modal.productId]}
              controls
              autoPlay
              className="w-full rounded mb-4"
            />
            <button
              className="w-full py-2 bg-gray-700 text-white rounded font-semibold text-base mt-2"
              onClick={() => setModal({ open: false, productId: null })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 