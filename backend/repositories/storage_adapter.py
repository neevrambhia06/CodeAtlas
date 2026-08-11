import os
import shutil
import zipfile
import logging

logger = logging.getLogger(__name__)


class LocalStorageAdapter:
    def __init__(self, base_path="/tmp/codeatlas_workspace"):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    def save_zip(self, upload_file, repo_id: str) -> str:
        zip_path = os.path.join(self.base_path, f"{repo_id}.zip")
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return zip_path

    def extract_zip(
        self,
        zip_path: str,
        repo_id: str,
        max_uncompressed_size=10000 * 1024 * 1024,
        max_files=5000000,
    ) -> str:
        extract_path = os.path.join(self.base_path, repo_id)
        os.makedirs(extract_path, exist_ok=True)
        try:
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                total_size = 0
                file_count = 0
                for info in zip_ref.infolist():
                    total_size += info.file_size
                    file_count += 1
                    if total_size > max_uncompressed_size:
                        raise ValueError(
                            "Zip bomb detected: Uncompressed size exceeds limit"
                        )
                    if file_count > max_files:
                        raise ValueError("Zip bomb detected: Too many files in archive")
                zip_ref.extractall(extract_path)
            return extract_path
        except zipfile.BadZipFile:
            raise ValueError("Corrupted ZIP file")

    def cleanup(self, repo_id: str):
        zip_path = os.path.join(self.base_path, f"{repo_id}.zip")
        extract_path = os.path.join(self.base_path, repo_id)
        if os.path.exists(zip_path):
            os.remove(zip_path)
        if os.path.exists(extract_path):
            shutil.rmtree(extract_path, ignore_errors=True)
        logger.info(f"Cleaned up workspace for {repo_id}")
