#!/usr/bin/env python3
"""
Cryptographic Key Generation Script
Generates cryptographic keys for encryption, signing, and authentication
"""

import secrets
import sys
from pathlib import Path
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64

def generate_rsa_key_pair(key_size=4096):
    """Generate RSA key pair for signing and encryption."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
        backend=default_backend()
    )
    
    public_key = private_key.public_key()
    
    return private_key, public_key

def save_rsa_keys(private_key, public_key, name):
    """Save RSA keys to files."""
    keys_dir = Path(__file__).parent.parent.parent.parent / 'config' / 'credentials'
    keys_dir.mkdir(parents=True, exist_ok=True)
    
    # Save private key
    private_key_path = keys_dir / f'{name}_private.pem'
    with open(private_key_path, 'wb') as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    # Save public key
    public_key_path = keys_dir / f'{name}_public.pem'
    with open(public_key_path, 'wb') as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))
    
    print(f"RSA keys saved to: {keys_dir}")
    print(f"  Private: {private_key_path}")
    print(f"  Public: {public_key_path}")

def generate_aes_key(key_size=256):
    """Generate AES key for symmetric encryption."""
    return secrets.token_bytes(key_size // 8)

def save_aes_key(key, name):
    """Save AES key to file."""
    keys_dir = Path(__file__).parent.parent.parent.parent / 'config' / 'credentials'
    keys_dir.mkdir(parents=True, exist_ok=True)
    
    key_path = keys_dir / f'{name}_aes.key'
    with open(key_path, 'wb') as f:
        f.write(key)
    
    print(f"AES key saved to: {key_path}")

def derive_key_from_password(password: str, salt: bytes, key_length: int = 32):
    """Derive cryptographic key from password using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=key_length,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(password.encode())

def generate_hmac_key(key_size=256):
    """Generate HMAC key for message authentication."""
    return secrets.token_bytes(key_size // 8)

def save_hmac_key(key, name):
    """Save HMAC key to file."""
    keys_dir = Path(__file__).parent.parent.parent.parent / 'config' / 'credentials'
    keys_dir.mkdir(parents=True, exist_ok=True)
    
    key_path = keys_dir / f'{name}_hmac.key'
    with open(key_path, 'wb') as f:
        f.write(key)
    
    print(f"HMAC key saved to: {key_path}")

def generate_all_keys():
    """Generate all required cryptographic keys."""
    print("Generating cryptographic keys...")
    print()
    
    # RSA key pair for signing
    print("1. Generating RSA key pair for signing...")
    signing_private, signing_public = generate_rsa_key_pair(4096)
    save_rsa_keys(signing_private, signing_public, 'signing')
    
    # RSA key pair for encryption
    print("\n2. Generating RSA key pair for encryption...")
    encryption_private, encryption_public = generate_rsa_key_pair(4096)
    save_rsa_keys(encryption_private, encryption_public, 'encryption')
    
    # AES key for data encryption
    print("\n3. Generating AES key for data encryption...")
    data_aes_key = generate_aes_key(256)
    save_aes_key(data_aes_key, 'data')
    
    # AES key for backup encryption
    print("\n4. Generating AES key for backup encryption...")
    backup_aes_key = generate_aes_key(256)
    save_aes_key(backup_aes_key, 'backup')
    
    # HMAC key for message authentication
    print("\n5. Generating HMAC key for message authentication...")
    hmac_key = generate_hmac_key(256)
    save_hmac_key(hmac_key, 'auth')
    
    print("\n" + "=" * 60)
    print("All cryptographic keys generated successfully")
    print("=" * 60)
    print("\nIMPORTANT:")
    print("1. Store private keys securely")
    print("2. Never commit private keys to version control")
    print("3. Backup keys to secure offline storage")
    print("4. Rotate keys regularly")
    print("5. Use hardware security modules (HSM) for production")

if __name__ == '__main__':
    generate_all_keys()
