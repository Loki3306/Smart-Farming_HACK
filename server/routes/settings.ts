import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { farmer_id } = req.query;

  return res.json({
    farmer_id,
    irrigation_mode: "auto",
    crop: "wheat",
  });
});

router.post("/", async (req, res) => {
  const data = req.body;

  return res.json({
    success: true,
    data,
  });
});

export default router;