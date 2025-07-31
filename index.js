import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
app.use(express.json());

app.post("/crop", async (req, res) => {
  try {
    const { imageUrl, bbox, output_size = [1080, 1920], zoom_factor = 2 } = req.body;

    if (!imageUrl || !bbox) {
      return res.status(400).json({ error: "Missing imageUrl or bbox" });
    }

    const [x1, y1, x2, y2] = bbox;
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
    res.status(500).json({ error: "Processing failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
