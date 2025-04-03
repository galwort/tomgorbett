import logging
import os
import json

import torch
import numpy as np

from transformers import CLIPModel, CLIPProcessor
from azure.storage.blob import BlobServiceClient
from io import BytesIO
from flask import Flask, request, jsonify


clip_model_name = "openai/clip-vit-base-patch32"
model = CLIPModel.from_pretrained(clip_model_name)
processor = CLIPProcessor.from_pretrained(clip_model_name)
model.eval()
torch.set_grad_enabled(False)


BLOB_CONNECTION_STRING = os.environ["AZURE_BLOB_CONNECTION_STRING"]
CONTAINER_NAME = "assets"
EMBEDDINGS_FILENAME = "image_embeddings.json"

logging.info("Connecting to Azure Blob...")
blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(CONTAINER_NAME)
blob_client = container_client.get_blob_client(EMBEDDINGS_FILENAME)

logging.info(f"Downloading {EMBEDDINGS_FILENAME} from blob storage...")
download_stream = blob_client.download_blob()
embeddings_bytes = download_stream.readall()
image_embeddings_dict = json.loads(embeddings_bytes.decode("utf-8"))
logging.info(f"Loaded embeddings for {len(image_embeddings_dict)} images.")


all_urls = list(image_embeddings_dict.keys())
all_vectors = np.array(list(image_embeddings_dict.values()), dtype=np.float32)


def get_text_embedding(text_query: str) -> np.ndarray:
    inputs = processor(text=[text_query], return_tensors="pt", padding=True)
    with torch.no_grad():
        text_emb = model.get_text_features(**inputs)

    return text_emb[0].cpu().numpy()


def search_images(query: str, top_k: int = 5):
    text_emb = get_text_embedding(query)

    scores = all_vectors @ text_emb

    top_k_indices = scores.argsort()[-top_k:][::-1]

    results = []
    for idx in top_k_indices:
        results.append({"url": all_urls[idx], "score": float(scores[idx])})
    return results


app = Flask(__name__)

@app.route('/search', methods=['GET'])
def search_images_endpoint():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Please provide a query parameter 'q'. For example: ?q=bride+and+groom+dancing"}), 400

    results = search_images(query, top_k=5)
    return jsonify({"query": query, "results": results})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
