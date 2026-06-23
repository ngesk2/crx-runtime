import imaplib
import email
import os
from dotenv import load_dotenv
from email.header import decode_header

load_dotenv()

def validate_credentials():
    """Validate Yahoo Mail credentials and inspect inbox."""
    print("=" * 60)
    print("Yahoo Mail Credential Validation")
    print("=" * 60)
    print()
    
    email_address = os.getenv("YAHOO_EMAIL")
    app_password = os.getenv("YAHOO_APP_PASSWORD")
    
    print(f"Email: {email_address}")
    print(f"Password: {'*' * len(app_password) if app_password else 'NOT SET'}")
    print()
    
    if not email_address or not app_password:
        print("[ERROR] Credentials not found in .env file")
        return False
    
    try:
        # Connect to Yahoo Mail
        print("Connecting to imap.mail.yahoo.com:993...")
        imap_server = "imap.mail.yahoo.com"
        imap_port = 993
        
        connection = imaplib.IMAP4_SSL(imap_server, imap_port)
        
        print("Attempting login...")
        result, data = connection.login(email_address, app_password)
        
        if result != 'OK':
            print(f"[FAILURE] Login failed")
            print(f"IMAP Response: {result}")
            print(f"Server Message: {data[0].decode() if data else 'No message'}")
            connection.close()
            connection.logout()
            return False
        
        print("[SUCCESS] Login successful")
        print()
        
        # Select inbox
        print("Selecting INBOX...")
        result, data = connection.select('INBOX')
        
        if result != 'OK':
            print(f"[ERROR] Failed to select INBOX: {data}")
            connection.close()
            connection.logout()
            return False
        
        # Get mailbox count
        result, data = connection.search(None, 'ALL')
        if result == 'OK':
            email_ids = data[0].split()
            print(f"Mailbox: INBOX")
            print(f"Total messages: {len(email_ids)}")
        else:
            print(f"[ERROR] Failed to search: {data}")
            connection.close()
            connection.logout()
            return False
        
        print()
        
        # Get latest 5 messages
        print("Latest messages:")
        print()
        
        latest_ids = email_ids[-5:] if len(email_ids) >= 5 else email_ids
        
        for email_id in latest_ids:
            try:
                result, msg_data = connection.fetch(email_id, '(RFC822)')
                if result != 'OK':
                    continue
                
                raw_email = msg_data[0][1]
                email_message = email.message_from_bytes(raw_email)
                
                # Extract subject
                subject = ""
                if email_message["Subject"]:
                    subject_parts = decode_header(email_message["Subject"])
                    subject = ""
                    for part, encoding in subject_parts:
                        if isinstance(part, bytes):
                            subject += part.decode(encoding or 'utf-8', errors='ignore')
                        else:
                            subject += part
                
                print(f"* {subject}")
                
            except Exception as e:
                print(f"* [Error fetching message: {e}]")
                continue
        
        print()
        print("=" * 60)
        print("VALIDATION COMPLETE")
        print("=" * 60)
        
        connection.close()
        connection.logout()
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        print(f"Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = validate_credentials()
    if success:
        print("\n[SUCCESS] Credentials validated successfully")
        exit(0)
    else:
        print("\n[FAILURE] Credential validation failed")
        exit(1)
