import azure.functions as func
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

FILE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'wedding_tags.json'))

def load_data():
    if os.path.exists(FILE_PATH):
        with open(FILE_PATH, 'r') as f:
            return json.load(f)
    return {tag: [] for tag in TAGS}

def save_data(data):
    with open(FILE_PATH, 'w') as f:
        json.dump(data, f)

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
