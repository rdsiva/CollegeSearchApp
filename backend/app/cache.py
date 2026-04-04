from cachetools import TTLCache

# Cache research results for 1 hour (3600 seconds) to avoid re-fetching within a server session
research_cache: TTLCache = TTLCache(maxsize=200, ttl=3600)
