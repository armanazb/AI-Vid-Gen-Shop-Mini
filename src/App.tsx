import {
  useSavedProducts,
  ProductCard,
  // @ts-ignore
  type Product,
} from "@shopify/shop-minis-react";
import { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { fal } from "@fal-ai/client";

// Configure fal.ai with credentials
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
});

// AI video generation function using fal.ai
const generateAIVideo = async (product: Product): Promise<string> => {
  console.log("🎬 Starting generateAIVideo function");

  const productInfo = {
    title: product.title,
    imageUrl: product.featuredImage?.url,
    altText: product.featuredImage?.altText,
  };

  console.log("📝 Product info:", productInfo);

  if (!productInfo.imageUrl) {
    console.error("❌ Product is missing an image");
    throw new Error("Product is missing an image");
  }

  console.log("🔑 API Key present:", !!import.meta.env.VITE_FAL_KEY);

  try {
    // Step 1: Generate optimized prompt using LLM
    console.log("🧠 Generating optimized prompt with LLM...");
    const promptResult = await fal.subscribe("fal-ai/any-llm", {
      input: {
        prompt: `You are an expert video prompt engineer. Create a detailed, engaging video prompt for Veo2 (Google's video generation model) based on this product information:

Product Title: ${productInfo.title}
Product Description: ${productInfo.altText || "No description available"}

Create a prompt that will generate a short, compelling product video that:
1. Highlights the product's key features and benefits
2. Uses dynamic camera movements and engaging visuals
3. Is optimized for Veo2's capabilities
4. Creates excitement and desire for the product
5. Is suitable for social media and marketing

The prompt should be specific, detailed, and focus on visual storytelling. Keep it under 200 words but make every word count.

Return ONLY the video prompt, no additional text or explanation.`,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log("🧠 LLM Queue update:", update.status);
        if (update.status === "IN_PROGRESS" && update.logs) {
          const newLogs = update.logs.map((log) => log.message);
          console.log("🧠 LLM Progress logs:", newLogs);
          newLogs.forEach(console.log);
        } else if (update.status === "COMPLETED") {
          console.log("✅ LLM prompt generation completed!");
        }
      },
    });

    const optimizedPrompt = promptResult.data?.output;
    console.log("🎯 Generated prompt:", optimizedPrompt);

    if (!optimizedPrompt) {
      console.error("❌ Failed to generate prompt from LLM");
      throw new Error("Failed to generate optimized prompt");
    }

    // Step 2: Generate video using the optimized prompt
    console.log("🚀 Generating video with optimized prompt...");
    const result = await fal.subscribe("fal-ai/veo2/image-to-video", {
      input: {
        prompt: optimizedPrompt,
        image_url: productInfo.imageUrl,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log("📊 Video Queue update:", update.status);
        if (update.status === "IN_PROGRESS" && update.logs) {
          const newLogs = update.logs.map((log) => log.message);
          console.log("📝 Video Progress logs:", newLogs);
          newLogs.forEach(console.log);
        } else if (update.status === "COMPLETED") {
          console.log("✅ Video generation completed!");
        }
      },
    });

    console.log("📦 Full result object:", result);
    console.log("🎥 Result data:", result.data);
    console.log("🆔 Request ID:", result.requestId);

    if (result.data?.video?.url) {
      console.log("✅ Video URL found:", result.data.video.url);
      return result.data.video.url;
    } else {
      console.error("❌ No video URL in result:", result.data);
      throw new Error("Video generation failed to produce a result");
    }
  } catch (error) {
    console.error("💥 Error in generateAIVideo:", error);
    throw error;
  }
};

export function App() {
  const { products: initialProducts } = useSavedProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState<Record<string, boolean>>(
    {}
  );
  const [videoErrors, setVideoErrors] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<{
    open: boolean;
    productId: string | null;
  }>({ open: false, productId: null });

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  const handleGenerateVideo = async (productId: string) => {
    console.log("Generate AI Preview clicked for product:", productId);
    const product = products.find((p) => p.id === productId);
    console.log("Found product:", product);

    if (!product) {
      console.error("Product not found for ID:", productId);
      return;
    }

    console.log("Starting video generation...");
    setLoadingVideos((prev) => ({ ...prev, [productId]: true }));
    setVideoErrors((prev) => ({ ...prev, [productId]: "" }));

    try {
      console.log("Calling generateAIVideo with product:", {
        id: product.id,
        title: product.title,
        imageUrl: product.featuredImage?.url,
        altText: product.featuredImage?.altText,
      });

      const videoUrl = await generateAIVideo(product);
      console.log("Video generation successful! URL:", videoUrl);

      setVideoUrls((prev) => ({ ...prev, [productId]: videoUrl }));
      setModal({ open: true, productId });
    } catch (error) {
      console.error("Error generating video:", error);
      setVideoErrors((prev) => ({
        ...prev,
        [productId]:
          error instanceof Error ? error.message : "An unknown error occurred",
      }));
    } finally {
      setLoadingVideos((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleSwipe = (productId: string) => {
    setProducts((currentProducts) => {
      if (!currentProducts) return [];
      const swipedItem = currentProducts.find((p) => p.id === productId);
      if (!swipedItem) return currentProducts;
      const otherProducts = currentProducts.filter((p) => p.id !== productId);
      return [...otherProducts, swipedItem];
    });
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);

  if (!products?.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading your favorite products...</p>
      </div>
    );
  }

  return (
    <div className="pt-12 px-4 pb-6 flex flex-col items-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-2 text-center">Your Favorites</h1>
      <p className="text-base text-gray-600 mb-6 text-center">
        Swipe to browse your saved products
      </p>
      <div className="relative w-full h-full flex justify-center items-center">
        <AnimatePresence>
          {products
            .slice(0, 2)
            .reverse()
            .map((product, index) => {
              const isTop = index === 1;
              const isGenerating = loadingVideos[product.id];
              const hasError = videoErrors[product.id];

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
                      <div className="shadow-lg rounded-lg bg-white">
                        <div className="overflow-hidden rounded-t-lg">
                          <ProductCard product={product} />
                        </div>
                        <div className="p-4">
                          {hasError && (
                            <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded">
                              {hasError}
                            </div>
                          )}
                          <button
                            className={`w-full py-3 rounded-lg font-semibold text-lg shadow-md transition ${
                              isGenerating
                                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                : "bg-blue-600 text-white active:bg-blue-700"
                            }`}
                            onClick={() => handleGenerateVideo(product.id)}
                            disabled={isGenerating}
                          >
                            {isGenerating
                              ? "Generating AI Preview..."
                              : "Generate AI Preview"}
                          </button>
                        </div>
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
