import imaplib
import email
import os
import json
from dotenv import load_dotenv
from email.header import decode_header
from datetime import datetime
import re

load_dotenv()

MIN_WORD_COUNT = 500

def extract_body(email_message):
    """Extract text body from email message."""
    body = ""
    
    if email_message.is_multipart():
        for part in email_message.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset() or 'utf-8'
                    body = payload.decode(charset, errors='ignore')
                    break
                except:
                    continue
    else:
        try:
            payload = email_message.get_payload(decode=True)
            charset = email_message.get_content_charset() or 'utf-8'
            body = payload.decode(charset, errors='ignore')
        except:
            body = str(email_message.get_payload())
    
    # Clean HTML
    body = re.sub('<[^<]+?>', ' ', body)
    body = ' '.join(body.split())
    
    return body

def inspect_inbox():
    """Inspect inbox and identify newsletter candidates."""
    print("=" * 60)
    print("Newsletter Inspection")
    print("=" * 60)
    print()
    
    email_address = os.getenv("YAHOO_EMAIL")
    app_password = os.getenv("YAHOO_APP_PASSWORD")
    
    if not email_address or not app_password:
        print("[ERROR] Credentials not found")
        return
    
    try:
        connection = imaplib.IMAP4_SSL("imap.mail.yahoo.com", 993)
        connection.login(email_address, app_password)
        connection.select('INBOX')
        
        # Fetch latest 100 emails
        result, data = connection.search(None, 'ALL')
        if result != 'OK':
            print(f"[ERROR] Failed to search: {data}")
            return
        
        email_ids = data[0].split()
        # Get last 100
        email_ids = email_ids[-100:] if len(email_ids) >= 100 else email_ids
        
        print(f"Scanning {len(email_ids)} emails...")
        print()
        
        candidates = []
        
        for email_id in email_ids:
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
                
                # Extract sender
                sender = ""
                if email_message["From"]:
                    sender_parts = decode_header(email_message["From"])
                    sender = ""
                    for part, encoding in sender_parts:
                        if isinstance(part, bytes):
                            sender += part.decode(encoding or 'utf-8', errors='ignore')
                        else:
                            sender += part
                
                # Extract received date
                received_at = email_message.get("Date", "")
                
                # Extract body
                body = extract_body(email_message)
                word_count = len(body.split())
                
                candidate = {
                    "sender": sender,
                    "subject": subject,
                    "received_date": received_at,
                    "word_count": word_count
                }
                
                candidates.append(candidate)
                
            except Exception as e:
                print(f"[Error processing email {email_id}: {e}]")
                continue
        
        connection.close()
        connection.logout()
        
        # Save to JSON
        with open('newsletter_candidates.json', 'w', encoding='utf-8') as f:
            json.dump(candidates, f, indent=2)
        
        print(f"[OK] Scanned {len(candidates)} emails")
        print(f"[OK] Saved to newsletter_candidates.json")
        print()
        
        # Filter by word count
        qualified = [c for c in candidates if c['word_count'] >= MIN_WORD_COUNT]
        rejected = [c for c in candidates if c['word_count'] < MIN_WORD_COUNT]
        
        print(f"Qualified (500+ words): {len(qualified)}")
        print(f"Rejected (< 500 words): {len(rejected)}")
        print()
        
        # Top senders
        from collections import Counter
        senders = [c['sender'] for c in qualified]
        top_senders = Counter(senders).most_common(10)
        
        print("Top senders:")
        for sender, count in top_senders:
            print(f"  {sender}: {count}")
        
        return candidates
        
    except Exception as e:
        print(f"[ERROR] Inspection failed: {e}")
        return None

if __name__ == "__main__":
    candidates = inspect_inbox()
    if candidates:
        print("\n[SUCCESS] Inspection complete")
    else:
        print("\n[FAILURE] Inspection failed")
