from PIL import Image
import os

def resize_icon(input_path, output_path, size):
    try:
        with Image.open(input_path) as img:
            img = img.resize(size, Image.Resampling.LANCZOS)
            img.save(output_path)
            print(f"Successfully created {output_path}")
    except Exception as e:
        print(f"Error resizing image: {e}")

if __name__ == "__main__":
    input_image = "image.png"
    
    if not os.path.exists("public"):
        os.makedirs("public")

    resize_icon(input_image, "public/pwa-192x192.png", (192, 192))
    resize_icon(input_image, "public/pwa-512x512.png", (512, 512))
