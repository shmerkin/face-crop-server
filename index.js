import express from "express";
import axios from "axios";
import sharp from "sharp";

const app = express();
app.use(express.json());

app.post("/crop", async (req, res) => {
  try {
    const data = req.body;
    console.log("🟡 Incoming Request:", JSON.stringify(data));

    const { imageUrl, bbox, output_size = [1080, 1920], zoom_factor = 2 } = data;

    // 🎯 בדיקה בסיסית
    if (!imageUrl || !bbox) {
      return res.status(400).json({ error: "Missing imageUrl or bbox" });
    }

    // 🧠 תמיכה בכל פורמט של bbox
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

    // ✅ בדיקות עומק
    if (box.length !== 4 || box.some(isNaN)) {
      return res.status(400).json({ error: "Invalid bbox coordinates" });
    }

    if (!Array.isArray(output_size) || output_size.length !== 2 || output_size.some(isNaN)) {
      return res.status(400).json({ error: "Invalid output_size format" });
    }

    const [x1, y1, x2, y2] = box;
    const cropWidth = x2 - x1;
    const cropHeight = y2 - y1;

    if (cropWidth <= 0 || cropHeight <= 0) {
      return res.status(400).json({ error: "Invalid crop area" });
    }

    const centerX = x1 + cropWidth / 2;
    const centerY = y1 + cropHeight / 2;

    const newWidth = cropWidth * zoom_factor;
    const newHeight = cropHeight * zoom_factor;

    if (newWidth < 10 || newHeight < 10) {
      return res.status(400).json({ error: "Zoomed crop too small" });
    }

    const newX = Math.max(0, Math.floor(centerX - newWidth / 2));
    const newY = Math.max(0, Math.floor(centerY - newHeight / 2));

    con
