import pytest
from zyrquen_sdk import ZyrquenConfig, ZyrquenPythonSDK


def test_config_raises_when_missing_api_key(monkeypatch):
    monkeypatch.delenv("ZYRQUEN_API_KEY", raising=False)
    with pytest.raises(ValueError):
        ZyrquenConfig(api_key="")


def test_trace_requires_block_hash():
    sdk = ZyrquenPythonSDK()
    with pytest.raises(ValueError):
        sdk.execute_forensic_trace("")


def test_trace_returns_expected_stage_count():
    sdk = ZyrquenPythonSDK()
    result = sdk.execute_forensic_trace("849202", stages=3)
    assert len(result) == 3
    assert "Stage 01: VERIFIED" in result[0]
