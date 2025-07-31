import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
app.use(express.json());

app.post("/crop", async (req, res) => {
  try {
    const { imageUrl, bbox, output_size = [1080, 1920], zoom_factor = 2 } = req.body;

    // Validate bbox format and convert to array if needed
    let box = bbox;

    // Try to fix bbox if it's not already an array
    if (!Array.isArray(bbox)) {
      if (typeof bbox === "string") {
        // Try to parse if it's a string like "299,245,459,486"
        box = bbox.split(",").map(Number);
      } else if (typeof bbox === "object" && Object.values(bbox).length === 4) {
        box = Object.values(bbox).map(Number);
      } else {
        return res.status(400).json({ error: "Invalid bbox format" });
      }
    }

    if (!imageUrl || box.length !== 4) {
      return res.status(400).json({ error: "Missing or invalid imageUrl or bbox" });
    }

    const [x1, y1, x2, y2] = box;
    const cropWidth = x2 - x1;
    const cropHeight = y2 - y1;

    const centerX = x1 + cropWidth / 2;
    const centerY = y1 + cropHeight / 2;

    const newWidth = cropWidth * zoom_factor;
    const newHeight = cropHeight * zoom_factor;

    const newX = Math.max(0, Math.floor(centerX - newWidth / 2));
    const newY = Math.max(0, Math.floor(centerY - newHeight / 2));

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    const cropped = await sharp(imageBuffer)
      .extract({ left: newX, top: newY, width: Math.floor(newWidth), height: Math.floor(newHeight) })
      .resize(output_size[0], output_size[1])
      .toBuffer();

    res.set("Content-Type", "image/jpeg");
    res.send(cropped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server is running on port", PORT);
});
