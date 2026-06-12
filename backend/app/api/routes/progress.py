import json
import asyncio
import redis.asyncio as aioredis
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from uuid import UUID
from ...config import settings

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/{job_id}/stream")
async def stream_progress(job_id: UUID):
    """Server-Sent Events endpoint for real-time progress."""

    async def event_generator():
        r = await aioredis.from_url(settings.REDIS_URL)
        pubsub = r.pubsub()
        channel = f"job_progress:{str(job_id)}"
        await pubsub.subscribe(channel)

        completed = False
        try:
            # Initial event so client can show "connected" immediately.
            yield f"data: {json.dumps({'event': 'connected', 'job_id': str(job_id)})}\n\n"

            while not completed:
                try:
                    message = await pubsub.get_message(
                        ignore_subscribe_messages=True,
                        timeout=1.0,
                    )

                    if not message:
                        # Heartbeat to keep connections alive behind proxies.
                        yield f"data: {json.dumps({'event': 'heartbeat', 'job_id': str(job_id)})}\n\n"
                        continue

                    raw = message.get("data")
                    if raw is None:
                        continue

                    if isinstance(raw, (bytes, bytearray)):
                        payload_str = raw.decode()
                    else:
                        payload_str = str(raw)

                    try:
                        data = json.loads(payload_str)
                    except json.JSONDecodeError:
                        data = {
                            "event": "message",
                            "job_id": str(job_id),
                            "message": payload_str,
                        }

                    yield f"data: {json.dumps(data)}\n\n"

                    if data.get("event") in ["job_completed", "job_failed"]:
                        completed = True
                except asyncio.CancelledError:
                    raise
                except Exception:
                    # Avoid killing the stream on transient issues.
                    yield f"data: {json.dumps({'event': 'stream_error', 'job_id': str(job_id)})}\n\n"
        finally:
            try:
                await pubsub.unsubscribe(channel)
            finally:
                await r.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

