from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    UPLOAD_DIR: str

    class Config:
        env_file = ".env"
        extra = "ignore"

    def model_post_init(self, __context) -> None:  # type: ignore[override]
        # Some environments use `postgres://` which SQLAlchemy doesn't recognize.
        # Normalize to `postgresql://`.
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = "postgresql://" + self.DATABASE_URL[len("postgres://") :]


settings = Settings()



