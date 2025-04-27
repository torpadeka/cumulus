import torch
model = torch.load("./emotion-yolov11-model/yolov11_finetuned.pt")
print("Model loaded successfully:", model)