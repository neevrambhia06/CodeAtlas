import os
import json
import logging
import re
import uuid
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


class ParserEngine:
    def __init__(self, extract_path: str):
        self.extract_path = extract_path
        self.metadata = {
            "entities": [],
            "relationships": [],
            "file_tree": [],
            "languages": set(),
            "frameworks": set(),
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

                # File entity
                file_id = f"file:{rel_path}"
                self.metadata["entities"].append(
                    {
                        "id": file_id,
                        "type": "file",
                        "name": file,
                        "path": rel_path,
                        "evidence": [
                            {
                                "evidence_id": str(uuid.uuid4()),
                                "source_type": "filesystem",
                                "reference": rel_path,
                                "snippet_or_description": f"File exists at {rel_path}",
                                "reasoning_type": "DIRECT",
                            }
                        ],
                    }
                )

                self.metadata["relationships"].append(
                    {
                        "source_id": project_id,
                        "target_id": file_id,
                        "type": "CONTAINS",
                        "confidence": 1.0,
                        "evidence": [],
                    }
                )

                if file.endswith((".js", ".jsx", ".ts", ".tsx")):
                    self.metadata["languages"].add(
                        "JavaScript" if file.endswith(".js") else "TypeScript"
                    )
                    files_to_parse.append((full_path, rel_path, file_id))
                elif file.endswith(".py"):
                    self.metadata["languages"].add("Python")
                    files_to_parse.append((full_path, rel_path, file_id))
                elif file == "package.json":
                    self._parse_package_json(full_path, file_id)
                elif (
                    file.endswith(".sql")
                    or "schema" in file.lower()
                    or "db" in file.lower()
                ):
                    self.metadata["languages"].add("SQL")

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

    def _parse_file_wrapper(self, args):
        try:
            return self._parse_file(*args)
        except Exception as e:
            return e

    def _parse_package_json(self, file_path: str, file_id: str):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                deps = data.get("dependencies", {})
                dev_deps = data.get("devDependencies", {})
                self.metadata["dependencies"].update(deps)

                all_deps = {**deps, **dev_deps}
                for fw, key in [
                    ("Next.js", "next"),
                    ("React", "react"),
                    ("Express", "express"),
                ]:
                    if key in all_deps:
                        self.metadata["frameworks"].add(fw)
                if any(k in all_deps for k in ["pg", "typeorm", "prisma", "sequelize"]):
                    self.metadata["frameworks"].add("Relational-DB")

                # Add external service entities for major deps
                for dep in all_deps:
                    if dep in [
                        "stripe",
                        "sendgrid",
                        "twilio",
                        "auth0",
                        "supabase",
                        "firebase",
                    ]:
                        ext_id = f"ext:{dep}"
                        if not any(
                            e["id"] == ext_id for e in self.metadata["entities"]
                        ):
                            self.metadata["entities"].append(
                                {
                                    "id": ext_id,
                                    "type": "external_service",
                                    "name": dep,
                                    "path": "package.json",
                                    "evidence": [
                                        {
                                            "evidence_id": str(uuid.uuid4()),
                                            "source_type": "dependency",
                                            "reference": "package.json",
                                            "snippet_or_description": f"Found '{dep}' in package.json",
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
            self.metadata["errors"].append(f"package.json parsing error: {str(e)}")

    def _parse_file(self, full_path: str, rel_path: str, file_id: str) -> dict:
        result = {"routes": [], "entities": [], "relationships": []}
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
                lines = content.splitlines()

                # Basic entity extraction using regex (Python/JS/TS)
                # 1. Functions
                func_pattern = re.compile(
                    r"(?:async\s+)?(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>|def\s+([a-zA-Z0-9_]+)\s*\()"
                )
                # 2. Classes
                class_pattern = re.compile(r"class\s+([a-zA-Z0-9_]+)")
                # 3. Imports
                import_pattern = re.compile(
                    r'(?:import\s+.*from\s+[\'"]([^\'"]+)[\'"]|require\([\'"]([^\'"]+)[\'"]\)|import\s+[\'"]([^\'"]+)[\'"]|from\s+([^\s]+)\s+import|import\s+([^\s]+))'
                )

                for i, line in enumerate(lines):
                    # Route detection
                    if (
                        "app.get(" in line
                        or "router.post(" in line
                        or "app.post(" in line
                        or "router.get(" in line
                    ):
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
                    elif (
                        "export default function" in line
                        or "export async function GET" in line
                        or "export async function POST" in line
                    ) and (
                        "pages/api" in rel_path
                        or "app/api" in rel_path
                        or "app/" in rel_path
                    ):
                        route_id = f"route:{rel_path}:{i}"
                        result["routes"].append(rel_path)
                        result["entities"].append(
                            {
                                "id": route_id,
                                "type": "route",
                                "name": "Next.js Route",
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
                    func_match = func_pattern.search(line)
                    if func_match:
                        func_name = next(
                            g for g in func_match.groups() if g is not None
                        )
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

                    # Class detection
                    class_match = class_pattern.search(line)
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
                    import_match = import_pattern.search(line)
                    if import_match:
                        import_target = next(
                            g for g in import_match.groups() if g is not None
                        )
                        if import_target.startswith("."):
                            # It's a local import, we can try to link it roughly
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

        return result

    def _format_response(self) -> dict:
        self.metadata["languages"] = list(self.metadata["languages"])
        self.metadata["frameworks"] = list(self.metadata["frameworks"])
        return self.metadata
