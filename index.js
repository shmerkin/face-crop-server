const express = require("express");
const sharp = require("sharp");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/crop", async (req, res) => {
  try {
    const { image_url, bbox, zoom_factor = 2, output_size = [1080, 1920] } = req.body;

    const response = await axios.get(image_url, { responseType: "arraybuffer" });
    const image = sharp(response.data);
    const metadata = await image.metadata();

    const [x1, y1, x2, y2] = bbox;
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const width = (x2 - x1) * zoom_factor;
    const height = (y2 - y1) * zoom_factor;

    const left = Math.max(0, Math.round(centerX - width / 2));
    const top = Math.max(0, Math.round(centerY - height / 2));

    const cropped = await image
      .extract({
        left,
        top,
        width: Math.min(width, metadata.width - left),
        height: Math.min(height, metadata.height - top)
      })
      .resize(output_size[0], output_size[1])
      .jpeg()
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
