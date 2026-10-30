from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://ronak:ronak_shop_2026@localhost:5432/ronak_shop"
    jwt_secret: str = "dev-secret"
    jwt_expire_minutes: int = 720
    jwt_algorithm: str = "HS256"

    admin_username: str = "admin"
    admin_password: str = "admin123"
    admin_name: str = "Shop Admin"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
