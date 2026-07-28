import imaplib
import email
import os
from dotenv import load_dotenv
from email.header import decode_header
from typing import List, Dict, Optional
import re

# Load environment variables from .env file
load_dotenv()

class YahooMailClient:
    """Yahoo Mail client using IMAP with OAuth app password."""
    
    def __init__(self):
        self.email = os.getenv("YAHOO_EMAIL")
        self.app_password = os.getenv("YAHOO_APP_PASSWORD")
        self.imap_server = "imap.mail.yahoo.com"
        self.imap_port = 993
        self.connection = None
    
    def connect(self) -> bool:
        """Connect to Yahoo Mail using IMAP."""
        try:
            self.connection = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            self.connection.login(self.email, self.app_password)
            self.connection.select('INBOX')
            print(f"Connected to Yahoo Mail as {self.email}")
            return True
        except Exception as e:
            print(f"Error connecting to Yahoo Mail: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from Yahoo Mail."""
        if self.connection:
            try:
                self.connection.close()
                self.connection.logout()
                print("Disconnected from Yahoo Mail")
            except:
                pass
    
    def fetch_unread_newsletters(self) -> List[Dict]:
        """Fetch unread emails from inbox."""
        if not self.connection:
            if not self.connect():
                return []
        
        newsletters = []
        
        try:
            # Search for unread emails
            status, messages = self.connection.search(None, 'UNSEEN')
            
            if status != 'OK':
                print("No unread messages found")
                return newsletters
            
            email_ids = messages[0].split()
            print(f"Found {len(email_ids)} unread messages")
            
            for email_id in email_ids:
                try:
                    # Fetch email
                    status, msg_data = self.connection.fetch(email_id, '(RFC822)')
                    
                    if status != 'OK':
                        continue
                    
                    # Parse email
                    raw_email = msg_data[0][1]
                    email_message = email.message_from_bytes(raw_email)
                    
                    # Extract email data
                    newsletter = self._extract_email_data(email_message)
                    if newsletter:
                        newsletters.append(newsletter)
                    
                    # Mark as read
                    self.connection.store(email_id, '+FLAGS', '\\Seen')
                    
                except Exception as e:
                    print(f"Error processing email {email_id}: {e}")
                    continue
            
            return newsletters
            
        except Exception as e:
            print(f"Error fetching unread newsletters: {e}")
            return newsletters
    
    def _extract_email_data(self, email_message) -> Optional[Dict]:
        """Extract relevant data from email message."""
        try:
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
            
            # Extract message ID
            message_id = email_message.get("Message-ID", "")
            if not message_id:
                # Generate fallback ID
                message_id = f"{sender}_{subject}".replace(" ", "_")
            
            # Extract body
            body = self._extract_body(email_message)
            
            # Count words
            word_count = len(body.split())
            
            # Extract received date
            received_at = email_message.get("Date", "")
            
            return {
                'message_id': message_id,
                'subject': subject,
                'sender': sender,
                'body': body,
                'word_count': word_count,
                'received_at': received_at
            }
            
        except Exception as e:
            print(f"Error extracting email data: {e}")
            return None
    
    def _extract_body(self, email_message) -> str:
        """Extract text body from email message."""
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                if content_type == "text/plain" and "attachment" not in content_disposition:
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
        
        # Clean up HTML if present
        body = re.sub('<[^<]+?>', ' ', body)
        body = ' '.join(body.split())
        
        return body
    
    def test_connection(self) -> bool:
        """Test connection to Yahoo Mail."""
        try:
            if self.connect():
                self.disconnect()
                return True
            return False
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False
