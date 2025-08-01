import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
app.use(express.json());

app.post("/crop", async (req, res) => {
  try {
    const { imageUrl, bbox, output_size = [1080, 1920], zoom_factor = 2 } = req.body;

    // תמיכה בפורמטים שונים של bbox
    let box = bbox;

    if (!Array.isArray(bbox)) {
      if (typeof bbox === "string") {
        box = bbox.split(",").map(Number);
      } else if (typeof bbox === "object" && Object.keys(bbox).length === 4) {
        box = Object.values(bbox).map(Number);
      } else {
        return res.status(400).json({ error: "Invalid bbox format" });
      }
    }

    if (!imageUrl || box.length !== 4 || box.some(isNaN)) {
      return res.status(400).json({ error: "Missing or invalid imageUrl or bbox" });
    }

    const [x1, y1, x2, y2] = box;
    const cropWidth = x2 - x1;
    const cropHeight = y2 - y1;

    if (cropWidth <= 0 || cropHeight <= 0) {
      return res.status(400).json({ error: "Invalid bbox coordinates" });
    }

    const centerX = x1 + cropWidth / 2;
    const centerY = y1 + cropHeight / 2;

    const newWidth = cropWidth * zoom_factor;
    const newHeight = cropHeight * zoom_factor;

    const newX = Math.max(0, Math.floor(centerX - newWidth / 2));
    const newY = Math.max(0, Math.floor(centerY - newHeight / 2));

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    const cropped = await sharp(imageBuffer)
      .extract({
        left: newX,
        top: newY,
        width: Math.floor(newWidth),
        height: Math.floor(newHeight)
      })
      .resize(output_size[0], output_size[1])
      .jpeg()
      .toBuffer();

    res.set("Content-Type", "image/jpeg");
    res.send(cropped);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({
      error: "Processing failed",
      details: err.message || "Unknown error"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Face Crop Server running on port ${PORT}`);
});
