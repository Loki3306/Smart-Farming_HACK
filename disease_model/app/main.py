from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from PIL import Image
import tempfile
import os

from .inference import predict

app = FastAPI(title="Plant Disease Detection Service")

@app.post("/predict")
async def predict_disease(
    crop: str = Form(...),
    image: UploadFile = File(...)
):
    # Save uploaded image temporarily
    suffix = os.path.splitext(image.filename)[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await image.read())
        temp_path = tmp.name

    try:
        result = predict(
            image_path=temp_path,
            crop=crop
        )
        return JSONResponse(content=result)
    finally:
        os.remove(temp_path)
