from disease_model.app.inference import predict

result = predict(
    image_path=r"C:\Users\lokes\Downloads\potato_late.webp",
    crop="Tomato"
)

print(result)
