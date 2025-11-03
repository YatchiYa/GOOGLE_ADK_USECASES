"""
Brevo Expert Agent Module

This module provides comprehensive Brevo (formerly SendinBlue) integration
with tools for contact management and email operations.
"""

from .agent import brevo_expert, root_agent
from .brevo_tools import (
    create_contact,
    get_contact,
    get_all_contacts,
    update_contact,
    delete_contact,
    create_bulk_contacts,
    send_transactional_email
)

__all__ = [
    'brevo_expert',
    'root_agent',
    'create_contact',
    'get_contact',
    'get_all_contacts',
    'update_contact',
    'delete_contact',
    'create_bulk_contacts',
    'send_transactional_email'
]