import os, json, datetime as dt, tempfile
import joblib, pandas as pd, numpy as np, azure.functions as func
from zoneinfo import ZoneInfo
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobClient
from firebase_admin import credentials, initialize_app, firestore
import firebase_admin as fb

vault = "https://kv-tomgorbett.vault.azure.net/"
sc = SecretClient(vault_url=vault, credential=DefaultAzureCredential())
conn = sc.get_secret("StorageConnectionString").value
cred = credentials.Certificate(json.loads(sc.get_secret("FirebaseSDK").value))
if not fb._apps:
    initialize_app(cred)
db = firestore.client()

blob_model = BlobClient.from_connection_string(
    conn, container_name="assets", blob_name="model_latest.pkl"
)
tmp_model = os.path.join(tempfile.gettempdir(), "model_latest.pkl")
if not os.path.exists(tmp_model):
    with open(tmp_model, "wb") as f:
        f.write(blob_model.download_blob().readall())
model = joblib.load(tmp_model)
feature_names = model.feature_names_in_

activity_docs = db.collection("activities").stream()
productive_map = {
    doc.id: doc.to_dict().get("Productive", False) for doc in activity_docs
}

tz = ZoneInfo("America/New_York")


def day_ids(date_obj: dt.date):
    return date_obj.strftime("%Y%m%d") + "0000", date_obj.strftime("%Y%m%d") + "2359"


def fetch_rows(start_id: str, end_id: str):
    ref = db.collection("tracker")
    return ref.order_by("__name__").start_at([start_id]).end_at([end_id]).stream()


def build_feature_row() -> pd.DataFrame:
    local_now = dt.datetime.now(tz)
    today = local_now.date()
    start_id, end_id = day_ids(today)
    rows = [{"doc_id": d.id, **d.to_dict()} for d in fetch_rows(start_id, end_id)]
    if not rows:
        raise ValueError("No tracker data found for today.")
    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["doc_id"].astype(str), format="%Y%m%d%H%M")
    df["productive"] = df["Activity"].map(productive_map).fillna(False)
    prod_so_far = df["productive"].sum() * 15
    act_pct = df.groupby("Activity").size() / len(df)
    seven_ago = today - dt.timedelta(days=7)
    start7, _ = day_ids(seven_ago)
    now_id = local_now.strftime("%Y%m%d%H%M")
    rows7 = [{"doc_id": d.id, **d.to_dict()} for d in fetch_rows(start7, now_id)]
    if rows7:
        df7 = pd.DataFrame(rows7)
        df7["productive"] = df7["Activity"].map(productive_map).fillna(False)
        prod_7day_avg = df7["productive"].sum() * 15 / 7
    else:
        prod_7day_avg = prod_so_far
    X = pd.Series(0.0, index=feature_names)
    X["prod_so_far"] = prod_so_far
    X["prod_7day_avg"] = prod_7day_avg
    dow_col = f"dow_{today.strftime('%A')}"
    if dow_col in X.index:
        X[dow_col] = 1
    for act, pct in act_pct.items():
        col = f"pct_{act}"
        if col in X.index:
            X[col] = pct
    return pd.DataFrame([X])


def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        X = build_feature_row()
        pred_minutes = model.predict(X)[0]
        pred_hours = round(pred_minutes / 60 / 0.25) * 0.25
        return func.HttpResponse(
            json.dumps({"predicted_hours": pred_hours}), mimetype="application/json"
        )
    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)
