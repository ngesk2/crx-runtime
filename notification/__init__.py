"""Notification Authority Package

Constitutional communication architecture for routing notifications
to external providers (Kit, Twilio, GitHub, Stripe).
"""

from notification.authority import NotificationAuthority
from notification.provider_registry import ProviderRegistry
from notification.providers.base import NotificationProvider
from notification.providers.kit import KitProvider
from notification.providers.twilio import TwilioProvider
from notification.evidence import NotificationEvidence

__all__ = [
    "NotificationAuthority",
    "ProviderRegistry",
    "NotificationProvider",
    "KitProvider",
    "TwilioProvider",
    "NotificationEvidence",
]
