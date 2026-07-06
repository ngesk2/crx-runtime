from .configuration_authority import ConfigurationAuthority

# Pre-initialized singleton — import and use directly.
#   from runtime.config import config
#   pg = config.get_postgres_config()
config = ConfigurationAuthority.get_instance()
