import azure.functions as func
from azure.storage.blob import BlobServiceClient
import json
import os

TAGS = [
    'Bride',
    'Groom',
    "Bride's Parents",
    "Groom's Parents",
    "Bride's Family",
    "Groom's Family",
    'Bridesmaids',
    'Groomsmen',
    'Cat',
    'Getting Ready',
    'Church',
    'Vows',
    'Reception',
    'Dancing',
    'Speeches',
    'Food',
]

CONNECTION_STRING = os.getenv('WEDDING_ASSETS_CONNECTION_STRING')
CONTAINER = 'assets'
BLOB_NAME = 'wedding_tags.json'

def get_blob_client():
    if not CONNECTION_STRING:
        return None
    service = BlobServiceClient.from_connection_string(CONNECTION_STRING)
    container = service.get_container_client(CONTAINER)
    return container.get_blob_client(BLOB_NAME)

def load_data():
    client = get_blob_client()
    if client is None:
        return {tag: [] for tag in TAGS}
    try:
        data = client.download_blob().readall().decode()
        return json.loads(data)
    except Exception:
        return {tag: [] for tag in TAGS}

def save_data(data):
    client = get_blob_client()
    if client is None:
        return
    client.upload_blob(json.dumps(data), overwrite=True)

def main(req: func.HttpRequest) -> func.HttpResponse:
    method = req.method
    data = load_data()
    if method == 'GET':
        return func.HttpResponse(json.dumps(data), mimetype='application/json')
    try:
        body = req.get_json()
    except Exception:
        return func.HttpResponse(status_code=400)
    tag = body.get('tag')
    name = body.get('filename')
    if tag not in TAGS or not name:
        return func.HttpResponse(status_code=400)
    tagged = name in data.get(tag, [])
    if tagged:
        data[tag] = [n for n in data[tag] if n != name]
    else:
        data.setdefault(tag, []).append(name)
    save_data(data)
    return func.HttpResponse(json.dumps({'tagged': not tagged}), mimetype='application/json')
