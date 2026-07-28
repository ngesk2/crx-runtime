# Yahoo Mail OAuth Setup Guide

This guide walks you through setting up Yahoo Mail access for the CRX Newsletter Brain.

## Overview

The CRX Newsletter Brain uses Yahoo Mail's IMAP access with app passwords (OAuth-based authentication). This provides secure, read-only access to your inbox without requiring your main Yahoo password.

## Step-by-Step Setup

### Step 1: Enable Two-Factor Authentication (2FA)

1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Sign in to your Yahoo account
3. Scroll to "Two-step verification"
4. Click "Turn on"
5. Follow the prompts to set up 2FA (SMS or authenticator app)

**Note:** 2FA is required to generate app passwords.

### Step 2: Generate App Password

1. On the same Yahoo Account Security page
2. Scroll down to "App passwords"
3. Click "Generate app password"
4. You'll see a dropdown menu - select "Mail" from the list
5. In the text field, enter a name for this app (e.g., "Newsletter Brain")
6. Click "Generate"

### Step 3: Copy Your App Password

Yahoo will generate a 16-character password in this format:
```
abcd efgh ijkl mnop
```

**Important:**
- Copy this password immediately
- Store it securely (you won't see it again)
- This password is specific to this app
- You can revoke it anytime from Yahoo settings

### Step 4: Configure CRX Newsletter Brain

1. Navigate to your project directory:
```bash
cd C:\Users\nolan\CascadeProjects\crx-newsletter-brain
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Edit `.env` with your credentials:
```env
YAHOO_EMAIL=your_email@yahoo.com
YAHOO_APP_PASSWORD=abcd efgh ijkl mnop
```

Replace:
- `your_email@yahoo.com` with your actual Yahoo email
- `abcd efgh ijkl mnop` with the app password you generated

### Step 5: Test Connection

Run the connection test:
```bash
python -c "from yahoo_client import YahooMailClient; client = YahooMailClient(); client.test_connection()"
```

**Expected Output:**
```
Connected to Yahoo Mail as your_email@yahoo.com
Disconnected from Yahoo Mail
True
```

**If Successful:** You're ready to start the worker!

**If Failed:** See troubleshooting below.

## Troubleshooting

### Error: "Authentication failed"

**Possible Causes:**
- Incorrect app password
- App password was revoked
- 2FA not enabled on account

**Solutions:**
1. Verify app password is copied correctly (including spaces)
2. Generate a new app password from Yahoo settings
3. Ensure 2FA is enabled on your Yahoo account

### Error: "IMAP connection failed"

**Possible Causes:**
- IMAP not enabled in Yahoo settings
- Network/firewall blocking IMAP port (993)
- Incorrect IMAP server settings

**Solutions:**
1. Go to Yahoo Mail Settings → "Security" → "Allow apps that use less secure sign-in"
2. Ensure port 993 is not blocked by your firewall
3. Verify IMAP settings: `imap.mail.yahoo.com:993`

### Error: "No unread messages found"

**Possible Causes:**
- Inbox is empty
- All messages already marked as read
- Messages in different folder

**Solutions:**
1. Send yourself a test email
2. Check if messages are in a different folder
3. Verify worker is fetching from correct folder (INBOX)

### Error: "SSL certificate error"

**Possible Causes:**
- System time is incorrect
- SSL certificate issues

**Solutions:**
1. Check system date/time is correct
2. Update system SSL certificates
3. (Advanced) Disable SSL verification for testing only

## Security Best Practices

### App Password Security

- **Never share** your app password
- **Store securely** in environment variables (not in code)
- **Rotate regularly** - generate new passwords periodically
- **Revoke immediately** if compromised

### Environment Variables

- **Never commit** `.env` to version control
- **Use `.gitignore`** to prevent accidental commits
- **Use different passwords** for different environments
- **Limit access** to `.env` file permissions

### Access Control

- **Use read-only access** - the worker only fetches, doesn't send
- **Monitor access** - check Yahoo security settings regularly
- **Revoke unused** app passwords periodically

## Advanced Configuration

### Custom IMAP Settings

If you need to customize IMAP settings, edit `yahoo_client.py`:

```python
self.imap_server = "imap.mail.yahoo.com"
self.imap_port = 993
```

### Custom Folder

To fetch from a different folder, modify `yahoo_client.py`:

```python
self.connection.select('INBOX')  # Change to your folder name
```

### Connection Timeout

To adjust connection timeout, add to `yahoo_client.py`:

```python
self.connection = imaplib.IMAP4_SSL(self.imap_server, self.imap_port, timeout=30)
```

## Revoking Access

If you need to revoke the Newsletter Brain's access:

1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Scroll to "App passwords"
3. Find "Newsletter Brain" in the list
4. Click "Revoke"

The worker will no longer be able to access your Yahoo Mail.

## Support

If you encounter issues not covered here:

1. Check Yahoo Mail [IMAP documentation](https://help.yahoo.com/kb/SLN4075.html)
2. Verify your Yahoo account is in good standing
3. Ensure you're using the latest version of the CRX Newsletter Brain
4. Check the worker logs for detailed error messages

## Summary

✅ Enable 2FA on Yahoo account
✅ Generate app password from Yahoo settings
✅ Configure `.env` with email and app password
✅ Test connection with YahooMailClient
✅ Start the worker

Your CRX Newsletter Brain is now ready to process newsletters!
