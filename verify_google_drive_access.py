"""
Google Drive Access Verification Script
Read-only - lists files, no modifications
"""
import json, os, requests

TOKEN_PATH = os.path.join(os.path.dirname(__file__), "token.json")
CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), "credentials", "client_secret.json")

def get_access_token():
    with open(TOKEN_PATH) as f:
        td = json.load(f)
    return td["access_token"]

def list_files(page_size=20):
    token = get_access_token()
    headers = {"Authorization": "Bearer " + token}
    params = {"pageSize": page_size, "fields": "files(id,name,mimeType,modifiedTime),nextPageToken"}
    r = requests.get("https://www.googleapis.com/drive/v3/files", headers=headers, params=params)
    r.raise_for_status()
    return r.json()

def search_files(query, page_size=50):
    token = get_access_token()
    headers = {"Authorization": "Bearer " + token}
    params = {"q": query, "pageSize": page_size, "fields": "files(id,name,mimeType,modifiedTime)"}
    r = requests.get("https://www.googleapis.com/drive/v3/files", headers=headers, params=params)
    r.raise_for_status()
    return r.json()

def main():
    print("=" * 70)
    print("GOOGLE DRIVE ACCESS VERIFICATION")
    print("=" * 70)

    print("\n--- Authentication Check ---")
    token = get_access_token()
    print(f"Access token: PRESENT ({len(token)} chars)")

    print("\n--- Token Refresh Check ---")
    with open(CREDENTIALS_PATH) as f:
        creds = json.load(f)["installed"]
    with open(TOKEN_PATH) as f:
        td = json.load(f)
    r = requests.post("https://oauth2.googleapis.com/token", data={
        "refresh_token": td["refresh_token"],
        "client_id": creds["client_id"],
        "client_secret": creds["client_secret"],
        "grant_type": "refresh_token",
    })
    if r.status_code == 200:
        print("Refresh: OK - new token valid for", r.json().get("expires_in"), "s")
    else:
        print("Refresh: FAILED -", r.text[:200])

    print("\n--- Recent Files (first 20) ---")
    data = list_files(20)
    files = data.get("files", [])
    print(f"Total files accessible: {len(files)}")
    for f in files:
        modified = f.get("modifiedTime", "unknown")[:10]
        print(f"  [{modified}] {f['name']}")
        print(f"    ID: {f['id']}")
        print(f"    Type: {f['mimeType']}")

    print("\n--- Search: Constitutional / Vault / Research ---")
    keywords = ["constitutional", "vault", "research", "notes", "script", "podcast", "creator", "memory", "identity"]
    for kw in keywords:
        result = search_files(f"name contains '{kw}'")
        kfiles = result.get("files", [])
        if kfiles:
            print(f"\n  '{kw}' matches ({len(kfiles)}):")
            for f in kfiles:
                modified = f.get("modifiedTime", "unknown")[:10]
                print(f"    [{modified}] {f['name']} ({f['mimeType']})")
                print(f"      ID: {f['id']}")

    print("\n--- Root-level folders ---")
    result = search_files("'root' in parents and mimeType = 'application/vnd.google-apps.folder'")
    folders = result.get("files", [])
    print(f"Root folders: {len(folders)}")
    for f in folders:
        print(f"  {f['name']} - {f['id']}")

    print("\n--- All folders ---")
    result = search_files("mimeType = 'application/vnd.google-apps.folder'")
    folders = result.get("files", [])
    print(f"Total folders: {len(folders)}")
    for f in folders:
        modified = f.get("modifiedTime", "unknown")[:10]
        print(f"  [{modified}] {f['name']} - {f['id']}")

    print("\nVerification complete.")

if __name__ == "__main__":
    main()
