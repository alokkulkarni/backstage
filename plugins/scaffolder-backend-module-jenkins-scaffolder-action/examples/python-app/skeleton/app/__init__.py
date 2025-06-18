# Main application package
from .config import settings
from .database import init_db
from .models import *
from .schemas import *
from .api import router

__version__ = "{{ values.version | default('0.1.0') }}"
__title__ = "{{ values.name }}"
__description__ = "{{ values.description }}"

{% if values.framework == "fastapi" -%}
from .main import app

__all__ = ["app", "settings", "init_db", "router"]
{%- elif values.framework == "django" -%}
# Django app initialization
default_app_config = "app.apps.AppConfig"

__all__ = ["settings", "init_db", "router"]
{%- elif values.framework == "flask" -%}
from .main import create_app

__all__ = ["create_app", "settings", "init_db", "router"]
{%- endif %}
