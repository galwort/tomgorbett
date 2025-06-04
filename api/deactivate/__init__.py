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


def main(timer: func.TimerRequest) -> None:
    cutoff = (dt.datetime.now(tz) - dt.timedelta(days=45)).strftime("%Y%m%d%H%M")

    used_recently = {
        d.to_dict()["Activity"]
        for d in (
            db.collection("tracker").order_by("__name__").start_at([cutoff]).stream()
        )
    }

    for act_doc in db.collection("activities").stream():
        act_id = act_doc.id
        is_active = act_doc.to_dict().get("Active", True)
        should_be_active = act_id in used_recently
        if is_active and not should_be_active:
            act_doc.reference.update({"Active": False})
        elif not is_active and should_be_active:
            act_doc.reference.update({"Active": True})
