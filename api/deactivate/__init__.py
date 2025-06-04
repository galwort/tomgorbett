import json, datetime as dt
from zoneinfo import ZoneInfo
import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from firebase_admin import credentials, initialize_app, firestore
import firebase_admin as fb

tz = ZoneInfo("America/New_York")
vault = "https://kv-tomgorbett.vault.azure.net/"
sc = SecretClient(vault_url=vault, credential=DefaultAzureCredential())
cred = credentials.Certificate(json.loads(sc.get_secret("FirebaseSDK").value))
if not fb._apps:
    initialize_app(cred)
db = firestore.client()


def main(mytimer: func.TimerRequest) -> None:
    now = dt.datetime.now(tz)
    cutoff_dt = now - dt.timedelta(days=45)
    for a_doc in db.collection("activities").stream():
        act_id = a_doc.id
        active_flag = a_doc.to_dict().get("Active", True)
        latest_q = (
            db.collection("tracker")
            .where("Activity", "==", act_id)
            .order_by("__name__", direction=firestore.Query.DESCENDING)
            .limit(1)
            .stream()
        )
        latest = next(latest_q, None)
        if latest:
            last_dt = dt.datetime.strptime(latest.id, "%Y%m%d%H%M").replace(tzinfo=tz)
            days_since = (now - last_dt).total_seconds() / 86400
        else:
            days_since = float("inf")
        should_be_active = days_since < 45
        if active_flag != should_be_active:
            a_doc.reference.update({"Active": should_be_active})
