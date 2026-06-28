import os
import json
import logging
import urllib.request
import urllib.parse

logger = logging.getLogger(__name__)

GATEWAY_URL = os.environ.get('GATEWAY_URL', 'http://gateway:8080')

def _request(method, path, body=None):
    url = f'{GATEWAY_URL}{path}'
    data = json.dumps(body).encode('utf-8') if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        logger.error(f'HTTP {e.code} on {method} {path}: {e.read().decode()}')
        raise
    except Exception as e:
        logger.error(f'Request failed {method} {path}: {e}')
        raise

def emit_event(event_type, aggregate_id, aggregate_type, event_data):
    import uuid
    event_id = str(uuid.uuid4())
    result = _request('POST', '/api/v1/events', {
        'event_id': event_id,
        'event_type': event_type,
        'aggregate_id': aggregate_id,
        'aggregate_type': aggregate_type,
        'event_data': event_data,
    })
    logger.info(f'Emitted {event_type} event: {event_id}')
    return result.get('event_id')

def store_object(kind, data, metadata=None, object_id=None):
    result = _request('POST', '/api/v1/repository/objects', {
        'object_id': object_id,
        'kind': kind,
        'data': data,
        'metadata': metadata or {},
    })
    return result.get('object_id')

def load_object(object_id):
    return _request('GET', f'/api/v1/repository/objects/{urllib.parse.quote(object_id)}')

def search_objects(kind=None, query=None, filters=None, limit=100):
    params = {}
    if kind: params['kind'] = kind
    if query: params['query'] = query
    if filters: params['filters'] = json.dumps(filters)
    if limit: params['limit'] = str(limit)
    qs = urllib.parse.urlencode(params)
    return _request('GET', f'/api/v1/repository/objects?{qs}')
