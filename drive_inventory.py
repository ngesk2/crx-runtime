"""
Complete Google Drive inventory - read only
"""
import json, requests

with open("token.json") as f:
    td = json.load(f)
token = td["access_token"]
headers = {"Authorization": "Bearer " + token}

all_files = []
page_token = None
while True:
    params = {"pageSize": 100, "fields": "files(id,name,mimeType,modifiedTime,size,parents),nextPageToken"}
    if page_token:
        params["pageToken"] = page_token
    r = requests.get("https://www.googleapis.com/drive/v3/files", headers=headers, params=params)
    data = r.json()
    all_files.extend(data.get("files", []))
    page_token = data.get("nextPageToken")
    if not page_token:
        break

print(f"Total files in Drive: {len(all_files)}")
print()

# Group by type
by_type = {}
for f in all_files:
    mt = f["mimeType"]
    by_type.setdefault(mt, []).append(f)

print("--- BY TYPE ---")
for mt, files in sorted(by_type.items()):
    short = mt.split("/")[-1].split(".")[-1].split("-")[-1]
    print(f"  {short}: {len(files)}")

print()
print("--- ALL FILES ---")
for f in all_files:
    modified = (f.get("modifiedTime") or "")[:10] if f.get("modifiedTime") else "unknown"
    size = f.get("size")
    size_str = f" ({int(size)/1024:.0f}KB)" if size else ""
    print(f"  [{modified}] {f['name']}{size_str}")
    print(f"    ID: {f['id']}  Type: {f['mimeType']}")
