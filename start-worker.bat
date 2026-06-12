@echo off
cd backend
celery -A app.worker.celery_app worker --loglevel=info --pool=solo

