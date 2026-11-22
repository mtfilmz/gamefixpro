"""Comprueba que el instalador quedó firmado con la clave cuya parte pública está en tauri.conf.json.
Si no coincide, la app instalada rechazaría la actualización; mejor fallar aquí."""
import base64
import glob
import hashlib
import json
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

conf = json.load(open("src-tauri/tauri.conf.json", encoding="utf-8"))
pub_text = base64.b64decode(conf["plugins"]["updater"]["pubkey"]).decode()
pub = base64.b64decode(pub_text.splitlines()[1])
pk_keynum, pk = pub[2:10], pub[10:42]

exe = glob.glob("src-tauri/target/release/bundle/nsis/*-setup.exe")[0]
sig_text = base64.b64decode(open(exe + ".sig", encoding="utf-8").read().strip()).decode()
lines = sig_text.splitlines()
sig = base64.b64decode(lines[1])
alg, keynum, signature = sig[:2], sig[2:10], sig[10:74]
data = open(exe, "rb").read()
msg = hashlib.blake2b(data, digest_size=64).digest() if alg == b"ED" else data
if keynum != pk_keynum:
    sys.exit("La firma se hizo con otra clave: revisa el secreto TAURI_SIGNING_PRIVATE_KEY.")
Ed25519PublicKey.from_public_bytes(pk).verify(signature, msg)
print("Firma correcta para", exe)
