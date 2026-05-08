import { createServiceClient } from "./src/lib/supabase/server";

async function checkImages() {
  const supabase = createServiceClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, image_url")
    .limit(5);

  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  console.log("Sample products and image URLs:");
  products?.forEach(p => {
    console.log(`- ${p.name}: ${p.image_url}`);
  });
}

checkImages();
