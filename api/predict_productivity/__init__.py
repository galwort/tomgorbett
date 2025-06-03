import os, json, datetime as dt, tempfile
import joblib, pandas as pd, numpy as np, azure.functions as func
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


def build_feature_row() -> pd.DataFrame:
    today = dt.date.today()
    start_id = today.strftime("%Y%m%d") + "0000"
    end_id = today.strftime("%Y%m%d") + "2359"
    docs = (
        db.collection("tracker")
        .where("id", ">=", start_id)
        .where("id", "<=", end_id)
        .stream()
    )
    rows = [d.to_dict() for d in docs]
    if not rows:
        raise ValueError("No tracker data found for today.")
    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["id"].astype(str), format="%Y%m%d%H%M")
    df["productive"] = df["Activity"].map(productive_map).fillna(False)
    prod_so_far = df["productive"].sum() * 15
    act_pct = df.groupby("Activity").size() / len(df)

    seven = today - dt.timedelta(days=7)
    start7 = seven.strftime("%Y%m%d") + "0000"
    now_id = dt.datetime.utcnow().strftime("%Y%m%d%H%M")
    docs7 = (
        db.collection("tracker")
        .where("id", ">=", start7)
        .where("id", "<=", now_id)
        .stream()
    )
    df7 = pd.DataFrame([d.to_dict() for d in docs7])
    if df7.empty:
        prod_7day_avg = prod_so_far
    else:
        df7["productive"] = df7["Activity"].map(productive_map).fillna(False)
        prod_7day_avg = df7["productive"].sum() * 15 / 7

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
        pred_hours = round((pred_minutes / 60) / 0.25) * 0.25
        return func.HttpResponse(
            json.dumps({"predicted_hours": pred_hours}), mimetype="application/json"
        )
    except Exception as e:
        return func.HttpResponse(str(e), status_code=500)
