#!/usr/bin/env python3
"""
Live Arabic Subs - Backend API Testing
Tests all backend endpoints including the new Chrome Extension integration
"""

import requests
import sys
import json
import tempfile
import os
from datetime import datetime

class LiveArabicSubsAPITester:
    def __init__(self, base_url="https://live-arabic-subs.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {'Content-Type': 'application/json'} if not files else {}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict):
                        details += f", Response keys: {list(response_data.keys())}"
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    details += f", Response: {response.text[:100]}..."
            else:
                details += f", Expected: {expected_status}, Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            self.log_test(name, False, error_msg)
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        success1, response1 = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": "test_extension"}
        )
        
        # Test GET status
        success2, response2 = self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )
        
        return success1 and success2

    def test_translation_api(self):
        """Test text translation endpoint"""
        return self.run_test(
            "English to Arabic Translation",
            "POST",
            "translate",
            200,
            data={
                "text": "Hello, how are you today?",
                "source_language": "English",
                "target_language": "Arabic"
            }
        )

    def test_translation_empty_text(self):
        """Test translation with empty text"""
        return self.run_test(
            "Translation Empty Text Validation",
            "POST",
            "translate",
            400,
            data={
                "text": "",
                "source_language": "English",
                "target_language": "Arabic"
            }
        )

    def create_test_audio_file(self):
        """Create a minimal test audio file"""
        # Create a minimal WebM audio file (just headers)
        webm_header = b'\x1a\x45\xdf\xa3\x9f\x42\x86\x81\x01\x42\xf7\x81\x01\x42\xf2\x81\x04\x42\xf3\x81\x08\x42\x82\x84webm\x42\x87\x81\x02\x42\x85\x81\x02'
        
        temp_file = tempfile.NamedTemporaryFile(suffix='.webm', delete=False)
        temp_file.write(webm_header)
        temp_file.close()
        return temp_file.name

    def test_transcription_api(self):
        """Test audio transcription endpoint"""
        audio_file_path = self.create_test_audio_file()
        
        try:
            with open(audio_file_path, 'rb') as f:
                files = {'audio': ('test.webm', f, 'audio/webm')}
                success, response = self.run_test(
                    "Audio Transcription",
                    "POST",
                    "transcribe",
                    200,  # Expecting success even with minimal audio
                    files=files
                )
            return success
        except Exception as e:
            self.log_test("Audio Transcription", False, f"File error: {str(e)}")
            return False
        finally:
            if os.path.exists(audio_file_path):
                os.unlink(audio_file_path)

    def test_combined_transcribe_translate(self):
        """Test combined transcribe and translate endpoint (main extension endpoint)"""
        audio_file_path = self.create_test_audio_file()
        
        try:
            with open(audio_file_path, 'rb') as f:
                files = {'audio': ('test.webm', f, 'audio/webm')}
                success, response = self.run_test(
                    "Combined Transcribe & Translate (Extension Endpoint)",
                    "POST",
                    "transcribe-and-translate",
                    200,
                    files=files
                )
            return success
        except Exception as e:
            self.log_test("Combined Transcribe & Translate", False, f"File error: {str(e)}")
            return False
        finally:
            if os.path.exists(audio_file_path):
                os.unlink(audio_file_path)

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Live Arabic Subs API Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 60)

        # Core API tests
        self.test_health_check()
        self.test_status_endpoints()
        self.test_translation_api()
        self.test_translation_empty_text()
        
        # Audio processing tests (main extension functionality)
        self.test_transcription_api()
        self.test_combined_transcribe_translate()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed - check details above")
            return 1

def main():
    tester = LiveArabicSubsAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())