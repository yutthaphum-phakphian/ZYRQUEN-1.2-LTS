import os
import sys
import unittest

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from zyrquen_sdk import ZyrquenConfig, ZyrquenPythonSDK


class TestZyrquenSDK(unittest.TestCase):
    def test_config_raises_when_missing_api_key(self):
        old_val = os.environ.pop("ZYRQUEN_API_KEY", None)
        try:
            with self.assertRaises(ValueError):
                ZyrquenConfig(api_key="")
        finally:
            if old_val is not None:
                os.environ["ZYRQUEN_API_KEY"] = old_val

    def test_trace_requires_block_hash(self):
        sdk = ZyrquenPythonSDK()
        with self.assertRaises(ValueError):
            sdk.execute_forensic_trace("")

    def test_trace_returns_expected_stage_count(self):
        sdk = ZyrquenPythonSDK()
        result = sdk.execute_forensic_trace("849202", stages=3)
        self.assertEqual(len(result), 3)
        self.assertIn("Stage 01: VERIFIED", result[0])


if __name__ == "__main__":
    unittest.main()
