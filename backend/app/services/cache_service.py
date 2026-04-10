import json
import logging
import hashlib
from typing import Optional, Any
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

try:
    if settings.redis_url:
        import redis.asyncio as redis
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    else:
        redis_client = None
except Exception as e:
    logger.warning(f"Failed to connect to Redis: {e}. Falling back to in-memory cache.")
    redis_client = None

# Fallback in-memory cache if Redis is not configured or fails
_memory_cache = {}

def _generate_cache_key(prefix: str, content: str) -> str:
    """Generate a consistent SHA256 content signature-based cache key."""
    content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
    return f"ghostlaw:{prefix}:{content_hash}"

async def get_cached(prefix: str, content: str) -> Optional[Any]:
    """Retrieve a value from the cache."""
    key = _generate_cache_key(prefix, content)
    
    try:
        if redis_client:
            val = await redis_client.get(key)
            if val:
                return json.loads(val)
        else:
            if key in _memory_cache:
                return json.loads(_memory_cache[key])
    except Exception as e:
        logger.error(f"Cache get error: {e}")
        
    return None

async def set_cached(prefix: str, content: str, data: Any, ttl_seconds: int = 86400):
    """Set a value in the cache with a Time-To-Live (TTL)."""
    key = _generate_cache_key(prefix, content)
    str_data = json.dumps(data)
    
    try:
        if redis_client:
            await redis_client.set(key, str_data, ex=ttl_seconds)
        else:
            _memory_cache[key] = str_data
            # In a real cluster we'd implement async cleanup, but simple dict is fine for fallback
    except Exception as e:
        logger.error(f"Cache set error: {e}")
