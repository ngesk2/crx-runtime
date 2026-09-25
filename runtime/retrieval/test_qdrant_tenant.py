"""
W7 QDRANT tenant enforcement tests (Python projection plane).

Verifies: _resolve_tenant_id takes tenant from the row, then payload, then
payload.event_data, and raises (fail closed) when absent; _require_tenant_id
rejects missing/empty tenants before any Qdrant read; all four Qdrant payload
forms carry tenant_id.
"""
import sys
import os
import types
import importlib.util

sys.path.insert(0, '/home/nolan/ping')

# Stub third-party modules absent from this Python env. The tenant logic
# under test is pure; the stubs only satisfy module-level imports.
for _mod, _attrs in {
    'psycopg2': ['connect'],
    'psycopg2.extras': ['DictCursor'],
    'qdrant_client': [],
    'qdrant_client.models': ['Distance', 'VectorParams', 'PointStruct', 'Filter', 'FieldCondition', 'MatchValue'],
}.items():
    _m = types.ModuleType(_mod)
    for _a in _attrs:
        setattr(_m, _a, type(_a, (), {}))
    sys.modules[_mod] = _m

# Stub runtime.* leaf imports that pull heavy dependency chains, while
# letting the real package __init__ files load.
import runtime as _rt_pkg  # noqa: E402  (real package)


def _load(modname, path):
    spec = importlib.util.spec_from_file_location(modname, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[modname] = mod
    spec.loader.exec_module(mod)
    return mod


# Pre-stub heavy leaves before the target modules import them.
for _mod, _cls in {
    'runtime.configuration': None,
    'runtime.authorities.embedding_authority': 'EmbeddingAuthority',
    'runtime.authorities.projection_authority': 'ProjectionAuthority',
    'runtime.constitutional.secret_adapter': None,
}.items():
    _m = types.ModuleType(_mod)
    if _cls:
        setattr(_m, _cls, type(_cls, (), {'get_client': staticmethod(lambda: None)}))
    sys.modules[_mod] = _m
sys.modules['runtime.configuration'].get_configuration = lambda *a, **k: None
sys.modules['runtime.constitutional.secret_adapter'].get_secret_adapter = lambda: None

_qpw = _load('qpw_under_test', '/home/nolan/ping/runtime/kernel/workers/qdrant_projection_worker.py')
_rs = _load('rs_under_test', '/home/nolan/ping/runtime/retrieval/retrieval_service.py')

passed = 0
failed = 0


def check(name, fn):
    global passed, failed
    try:
        fn()
        passed += 1
        print(f"PASS {name}")
    except Exception as e:
        failed += 1
        print(f"FAIL {name}: {e}")


def test_resolve_from_row():
    QdrantProjectionWorker = _qpw.QdrantProjectionWorker
    tid = QdrantProjectionWorker._resolve_tenant_id({'event_id': 'e1', 'tenant_id': 'tenant-a'})
    assert tid == 'tenant-a', tid


def test_resolve_from_payload():
    QdrantProjectionWorker = _qpw.QdrantProjectionWorker
    tid = QdrantProjectionWorker._resolve_tenant_id(
        {'event_id': 'e1', 'payload': {'tenant_id': 'tenant-b'}})
    assert tid == 'tenant-b', tid


def test_resolve_from_event_data():
    QdrantProjectionWorker = _qpw.QdrantProjectionWorker
    tid = QdrantProjectionWorker._resolve_tenant_id(
        {'event_id': 'e1', 'payload': {'event_data': {'tenant_id': 'tenant-c'}}})
    assert tid == 'tenant-c', tid


def test_resolve_row_beats_payload():
    QdrantProjectionWorker = _qpw.QdrantProjectionWorker
    tid = QdrantProjectionWorker._resolve_tenant_id(
        {'event_id': 'e1', 'tenant_id': 'tenant-a', 'payload': {'tenant_id': 'tenant-evil'}})
    assert tid == 'tenant-a', tid


def test_resolve_missing_raises():
    QdrantProjectionWorker = _qpw.QdrantProjectionWorker
    try:
        QdrantProjectionWorker._resolve_tenant_id({'event_id': 'e1', 'payload': {}})
    except ValueError as e:
        assert 'fail closed' in str(e)
        return
    raise AssertionError('must raise ValueError on missing tenant')


def test_require_tenant_ok():
    _require_tenant_id = _rs._require_tenant_id
    assert _require_tenant_id('tenant-a') == 'tenant-a'


def test_require_tenant_rejects():
    _require_tenant_id = _rs._require_tenant_id
    for bad in [None, '', '   ', 123]:
        try:
            _require_tenant_id(bad)
        except ValueError:
            continue
        raise AssertionError(f'must reject {bad!r}')


def test_all_payload_forms_stamp_tenant():
    src = open('/home/nolan/ping/runtime/kernel/workers/qdrant_projection_worker.py').read()
    for form in ["'tenant_id': tenant_id"]:
        assert src.count(form) >= 4, f'expected >=4 tenant_id stamps, found {src.count(form)}'


def test_retrieval_signatures_require_tenant():
    import inspect
    RetrievalService = _rs.RetrievalService
    for m in ['semantic_search', 'metadata_lookup', 'retrieve']:
        params = list(inspect.signature(getattr(RetrievalService, m)).parameters)
        assert 'tenant_id' in params, f'{m} missing tenant_id param'


def test_projection_authority_sovereignty_preserved():
    src = open('/home/nolan/ping/runtime/kernel/workers/qdrant_projection_worker.py').read()
    assert 'ProjectionAuthority.get_client()' in src, 'ProjectionAuthority sovereignty must survive'
    assert 'QdrantClient(' not in src.replace('ProjectionAuthority.get_client()', ''), \
        'no direct QdrantClient construction'


if __name__ == '__main__':
    print('=== W7 QDRANT Python tenant enforcement ===')
    check('resolve tenant from row', test_resolve_from_row)
    check('resolve tenant from payload', test_resolve_from_payload)
    check('resolve tenant from payload.event_data', test_resolve_from_event_data)
    check('row tenant beats payload tenant', test_resolve_row_beats_payload)
    check('missing tenant raises (fail closed)', test_resolve_missing_raises)
    check('_require_tenant_id accepts valid', test_require_tenant_ok)
    check('_require_tenant_id rejects missing/empty', test_require_tenant_rejects)
    check('all four Qdrant payload forms stamp tenant_id', test_all_payload_forms_stamp_tenant)
    check('retrieval signatures require tenant_id', test_retrieval_signatures_require_tenant)
    check('ProjectionAuthority sovereignty preserved', test_projection_authority_sovereignty_preserved)
    print(f"=== Summary: {passed} passed, {failed} failed ===")
    sys.exit(0 if failed == 0 else 1)
