import os
import json
import logging
import re
import uuid
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

CONFIG_FILES = {
    "package.json": "JavaScript/TypeScript",
    "pyproject.toml": "Python",
    "requirements.txt": "Python",
    "pom.xml": "Java",
    "build.gradle": "Java",
    "go.mod": "Go",
    "Cargo.toml": "Rust",
    "composer.json": "PHP",
    "Gemfile": "Ruby",
}

FRAMEWORK_INDICATORS = {
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "react": "React",
    "next": "Next.js",
    "express": "Express",
    "spring-boot": "Spring Boot",
    "springframework": "Spring Boot",
    "laravel": "Laravel",
    "rails": "Ruby on Rails",
    "vue": "Vue",
    "angular": "Angular",
    "nestjs": "NestJS",
}


class ParserEngine:
    def __init__(self, extract_path: str):
        self.extract_path = extract_path
        self.metadata = {
            "entities": [],
            "relationships": [],
            "file_tree": [],
            "languages": {},
            "frameworks": {},
            "api_routes": [],
            "dependencies": {},
            "partial_failure": False,
            "errors": [],
        }

    def parse_repository(self) -> dict:
        files_to_parse = []
        if not os.path.exists(self.extract_path):
            self.metadata["partial_failure"] = True
            self.metadata["errors"].append("Extract path does not exist")
            return self._format_response()

        ignore_dirs = {
            "node_modules",
            ".git",
            "dist",
            "build",
            "__pycache__",
            "venv",
            "env",
            ".next",
            "coverage",
            "vendor",
            ".idea",
            ".vscode",
        }

        # Add project entity
        project_id = "project_root"
        self.metadata["entities"].append(
            {
                "id": project_id,
                "type": "project",
                "name": os.path.basename(self.extract_path.strip("/\\")),
                "path": "/",
                "evidence": [
                    {
                        "evidence_id": str(uuid.uuid4()),
                        "source_type": "filesystem",
                        "reference": "/",
                        "snippet_or_description": "Root project directory",
                        "reasoning_type": "DIRECT",
                    }
                ],
            }
        )

        for root, dirs, files in os.walk(self.extract_path):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]

            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, self.extract_path).replace(
                    "\\", "/"
                )
                self.metadata["file_tree"].append(rel_path)

                # Identify language by extension
                ext = os.path.splitext(file)[1].lower()
                lang = self._get_language_from_ext(ext)
                if lang:
                    self.metadata["languages"][lang] = (
                        self.metadata["languages"].get(lang, 0) + 1
                    )

                # Entry point detection
                is_entry = False
                entry_names = {
                    "main.tsx",
                    "main.jsx",
                    "index.tsx",
                    "index.ts",
                    "server.ts",
                    "app.tsx",
                    "main.py",
                    "manage.py",
                    "program.cs",
                    "main.go",
                }
                if (
                    file.lower() in entry_names
                    or "app/" in rel_path.lower()
                    or "pages/" in rel_path.lower()
                ):
                    is_entry = True

                # File entity
                file_id = f"file:{rel_path}"
                file_entity = {
                    "id": file_id,
                    "type": "entry_point" if is_entry else "file",
                    "name": file,
                    "path": rel_path,
                    "evidence": [
                        {
                            "evidence_id": str(uuid.uuid4()),
                            "source_type": "filesystem",
                            "reference": rel_path,
                            "snippet_or_description": f"File discovered: {rel_path} (Detected as {'entry point' if is_entry else 'file'})",
                            "reasoning_type": "DIRECT",
                        }
                    ],
                }
                self.metadata["entities"].append(file_entity)

                self.metadata["relationships"].append(
                    {
                        "source_id": project_id,
                        "target_id": file_id,
                        "type": "CONTAINS",
                        "confidence": 1.0,
                        "evidence": [],
                    }
                )

                if file in CONFIG_FILES:
                    self._parse_config_file(full_path, file, file_id)

                if ext in [
                    ".js",
                    ".jsx",
                    ".ts",
                    ".tsx",
                    ".py",
                    ".go",
                    ".java",
                    ".cs",
                    ".php",
                    ".rb",
                ]:
                    files_to_parse.append((full_path, rel_path, file_id))
                elif ext == ".sql" or "schema" in file.lower() or "db" in file.lower():
                    # Handle DB
                    db_entity_id = f"db:{rel_path}"
                    self.metadata["entities"].append(
                        {
                            "id": db_entity_id,
                            "type": "database",
                            "name": file,
                            "path": rel_path,
                            "evidence": [
                                {
                                    "evidence_id": str(uuid.uuid4()),
                                    "source_type": "file_naming",
                                    "reference": rel_path,
                                    "snippet_or_description": "File identified as database/schema definition",
                                    "reasoning_type": "HEURISTIC",
                                }
                            ],
                        }
                    )
                    self.metadata["relationships"].append(
                        {
                            "source_id": file_id,
                            "target_id": db_entity_id,
                            "type": "DEFINES",
                            "confidence": 1.0,
                            "evidence": [],
                        }
                    )

        # Process file parsing in a thread pool
        with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
            results = list(executor.map(self._parse_file_wrapper, files_to_parse))

        for result in results:
            if isinstance(result, Exception):
                self.metadata["partial_failure"] = True
                self.metadata["errors"].append(str(result))
            elif result:
                self.metadata["api_routes"].extend(result.get("routes", []))
                self.metadata["entities"].extend(result.get("entities", []))
                self.metadata["relationships"].extend(result.get("relationships", []))

        return self._format_response()

    def _get_language_from_ext(self, ext: str) -> str:
        mapping = {
            ".js": "JavaScript",
            ".jsx": "JavaScript",
            ".ts": "TypeScript",
            ".tsx": "TypeScript",
            ".py": "Python",
            ".go": "Go",
            ".java": "Java",
            ".cs": "C#",
            ".php": "PHP",
            ".rb": "Ruby",
            ".sql": "SQL",
        }
        return mapping.get(ext)

    def _parse_file_wrapper(self, args):
        try:
            return self._parse_file(*args)
        except Exception as e:
            return e

    def _parse_config_file(self, full_path: str, filename: str, file_id: str):
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()

            content_to_check = content.lower()
            if filename == "package.json":
                data = json.loads(content)
                deps = data.get("dependencies", {})
                dev_deps = data.get("devDependencies", {})
                all_deps = {**deps, **dev_deps}
                for d in all_deps:
                    self.metadata["dependencies"][d] = all_deps[d]
                content_to_check = json.dumps(all_deps).lower()

            for indicator, framework in FRAMEWORK_INDICATORS.items():
                if indicator in content_to_check:
                    self.metadata["frameworks"][framework] = (
                        self.metadata["frameworks"].get(framework, 0) + 1.0
                    )

            if any(
                k in content_to_check
                for k in [
                    "pg",
                    "typeorm",
                    "prisma",
                    "sequelize",
                    "sqlalchemy",
                    "mongoose",
                    "psycopg2",
                ]
            ):
                self.metadata["frameworks"]["Relational/Document-DB"] = (
                    self.metadata["frameworks"].get("Relational/Document-DB", 0) + 1.0
                )

            # Add external service entities for major deps
            services = [
                "stripe",
                "sendgrid",
                "twilio",
                "auth0",
                "supabase",
                "firebase",
                "aws-sdk",
                "google-cloud",
            ]
            for dep in services:
                if dep in content_to_check:
                    ext_id = f"ext:{dep}"
                    if not any(e["id"] == ext_id for e in self.metadata["entities"]):
                        self.metadata["entities"].append(
                            {
                                "id": ext_id,
                                "type": "external_service",
                                "name": dep,
                                "path": filename,
                                "evidence": [
                                    {
                                        "evidence_id": str(uuid.uuid4()),
                                        "source_type": "dependency",
                                        "reference": filename,
                                        "snippet_or_description": f"Found '{dep}' dependency/indicator",
                                        "reasoning_type": "DIRECT",
                                    }
                                ],
                            }
                        )
                    self.metadata["relationships"].append(
                        {
                            "source_id": file_id,
                            "target_id": ext_id,
                            "type": "DEPENDS_ON",
                            "confidence": 1.0,
                            "evidence": [],
                        }
                    )

        except Exception as e:
            self.metadata["partial_failure"] = True
            self.metadata["errors"].append(
                f"Config parsing error in {filename}: {str(e)}"
            )

    def _parse_file(self, full_path: str, rel_path: str, file_id: str) -> dict:
        result = {"routes": [], "entities": [], "relationships": []}
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                lines = content.splitlines()

                # Basic generic extraction logic across languages
                for i, line in enumerate(lines):
                    # Route detection (Generic heuristics)
                    is_route = False
                    if re.search(
                        r"(?:app|router|http|r)\.(?:get|post|put|delete|patch|handlefunc)\s*\(",
                        line,
                        re.IGNORECASE,
                    ):
                        is_route = True
                    elif re.search(
                        r"@(?:app|router)\.(?:get|post|put|delete|patch)\s*\(",
                        line,
                        re.IGNORECASE,
                    ):
                        is_route = True
                    elif re.search(
                        r"@(?:Get|Post|Put|Delete)Mapping\s*\(", line, re.IGNORECASE
                    ):
                        is_route = True
                    elif re.search(
                        r"\[Http(?:Get|Post|Put|Delete)\]", line, re.IGNORECASE
                    ):
                        is_route = True
                    elif re.search(
                        r"(?:export default function|export async function (?:GET|POST|PUT|DELETE))",
                        line,
                        re.IGNORECASE,
                    ):
                        if (
                            "api" in rel_path.lower()
                            or "app/" in rel_path.lower()
                            or "pages/" in rel_path.lower()
                        ):
                            is_route = True

                    if is_route:
                        route_id = f"route:{rel_path}:{i}"
                        result["routes"].append(rel_path)
                        result["entities"].append(
                            {
                                "id": route_id,
                                "type": "route",
                                "name": "API Route",
                                "path": rel_path,
                                "evidence": [
                                    {
                                        "evidence_id": str(uuid.uuid4()),
                                        "source_type": "code_pattern",
                                        "reference": f"{rel_path}:{i+1}",
                                        "snippet_or_description": line.strip(),
                                        "reasoning_type": "DIRECT",
                                    }
                                ],
                            }
                        )
                        result["relationships"].append(
                            {
                                "source_id": file_id,
                                "target_id": route_id,
                                "type": "EXPOSES",
                                "confidence": 1.0,
                                "evidence": [],
                            }
                        )

                    # Function detection
                    func_match = re.search(
                        r"(?:def|function|func)\s+([a-zA-Z0-9_]+)", line
                    )
                    if not func_match:
                        func_match = re.search(
                            r"const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>",
                            line,
                        )

                    if func_match:
                        func_name = func_match.group(1)
                        func_id = f"func:{rel_path}:{func_name}"
                        result["entities"].append(
                            {
                                "id": func_id,
                                "type": "function",
                                "name": func_name,
                                "path": rel_path,
                                "evidence": [
                                    {
                                        "evidence_id": str(uuid.uuid4()),
                                        "source_type": "code_pattern",
                                        "reference": f"{rel_path}:{i+1}",
                                        "snippet_or_description": line.strip(),
                                        "reasoning_type": "DIRECT",
                                    }
                                ],
                            }
                        )
                        result["relationships"].append(
                            {
                                "source_id": file_id,
                                "target_id": func_id,
                                "type": "IMPLEMENTS",
                                "confidence": 1.0,
                                "evidence": [],
                            }
                        )

                    # Class/Struct detection
                    class_match = re.search(
                        r"(?:class|struct|interface)\s+([a-zA-Z0-9_]+)", line
                    )
                    if class_match:
                        class_name = class_match.group(1)
                        class_id = f"class:{rel_path}:{class_name}"
                        result["entities"].append(
                            {
                                "id": class_id,
                                "type": "class",
                                "name": class_name,
                                "path": rel_path,
                                "evidence": [
                                    {
                                        "evidence_id": str(uuid.uuid4()),
                                        "source_type": "code_pattern",
                                        "reference": f"{rel_path}:{i+1}",
                                        "snippet_or_description": line.strip(),
                                        "reasoning_type": "DIRECT",
                                    }
                                ],
                            }
                        )
                        result["relationships"].append(
                            {
                                "source_id": file_id,
                                "target_id": class_id,
                                "type": "IMPLEMENTS",
                                "confidence": 1.0,
                                "evidence": [],
                            }
                        )

                    # Import detection
                    import_match = re.search(
                        r'(?:import\s+.*from\s+[\'"]([^\'"]+)[\'"]|require\([\'"]([^\'"]+)[\'"]\)|import\s+[\'"]([^\'"]+)[\'"]|from\s+([^\s]+)\s+import|import\s+([^\s]+))',
                        line,
                    )
                    if import_match:
                        import_target = next(
                            g for g in import_match.groups() if g is not None
                        )
                        if import_target.startswith(".") or "/" in import_target:
                            import_id = f"file:{import_target}"
                            result["relationships"].append(
                                {
                                    "source_id": file_id,
                                    "target_id": import_id,
                                    "type": "IMPORTS",
                                    "confidence": 0.8,
                                    "evidence": [
                                        {
                                            "evidence_id": str(uuid.uuid4()),
                                            "source_type": "code_pattern",
                                            "reference": f"{rel_path}:{i+1}",
                                            "snippet_or_description": line.strip(),
                                            "reasoning_type": "DIRECT",
                                        }
                                    ],
                                }
                            )

        except Exception as e:
            logger.warning(f"Failed to parse {full_path}: {str(e)}")
            # Mark file level failure if it fails
            self.metadata["partial_failure"] = True
            self.metadata["errors"].append(f"Failed to parse {rel_path}: {str(e)}")

        return result

    def _format_response(self) -> dict:
        self.metadata["languages"] = list(self.metadata["languages"].keys())
        # Filter frameworks by confidence or just extract names
        self.metadata["frameworks"] = list(self.metadata["frameworks"].keys())
        self.metadata["parser_status"] = (
            "partial" if self.metadata["partial_failure"] else "success"
        )
        if not self.metadata["entities"]:
            self.metadata["parser_status"] = "unsupported"
        return self.metadata
