import os
import json
import asyncio
import sys

# Setup Python path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))
from database.mock import MOCK_JOBS
from workers.job_runner import JobRunner

FIXTURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../tests/benchmark/fixtures'))

FIXTURES = {
    "repo1_ecommerce": {
        "files": {
            "package.json": '{"dependencies": {"express": "1.0", "stripe": "1.0"}}',
            "product.js": "app.get('/product', (req, res) => {})",
            "cart.js": "app.get('/cart', (req, res) => {})",
            "checkout.js": "app.get('/checkout', (req, res) => {})",
            "refund.js": "app.get('/refund', (req, res) => {})"
        },
        "expected": {
            "domain": "e-commerce",
            "missing_gaps": ["Logic Gap: Missing Refund Flow"]
        }
    },
    "repo2_booking": {
        "files": {
            "package.json": '{"dependencies": {"express": "1.0"}}',
            "calendar.js": "app.get('/calendar', (req, res) => {})",
            "booking.js": "app.get('/booking', (req, res) => {})",
            "reservation.js": "app.get('/reservation', (req, res) => {})"
        },
        "expected": {
            "domain": "booking/reservations",
            "required_gaps": ["Logic Gap: Missing Booking Cancellation"]
        }
    },
    "repo3_saas_auth": {
        "files": {
            "package.json": '{"dependencies": {"express": "1.0"}}',
            "tenant.js": "app.get('/tenant', (req, res) => {})",
            "plan.js": "app.get('/plan', (req, res) => {})",
            "login.js": "app.get('/login', (req, res) => {})",
            "register.js": "app.get('/register', (req, res) => {})"
        },
        "expected": {
            "domain": "saas billing",
            "missing_gaps": ["Logic Gap: Missing Refund Flow", "Logic Gap: Missing Booking Cancellation"]
        }
    },
    "repo4_ambiguous": {
        "files": {
            "package.json": '{"dependencies": {"express": "1.0"}}',
            "utils.js": "function helper() {}",
            "main.js": "app.get('/main', (req, res) => {})"
        },
        "expected": {
            "domain": "Unclassified",
            "missing_gaps": ["Logic Gap: Missing Refund Flow", "Logic Gap: Missing Booking Cancellation", "Logic Gap: Missing Password Recovery"]
        }
    }
}

async def setup_fixtures():
    os.makedirs(FIXTURES_DIR, exist_ok=True)
    for repo_name, config in FIXTURES.items():
        repo_path = os.path.join(FIXTURES_DIR, repo_name)
        os.makedirs(repo_path, exist_ok=True)
        # Create expected_findings JSON alongside
        with open(os.path.join(repo_path, "expected_findings.json"), "w") as f:
            json.dump(config["expected"], f, indent=2)
            
        for filename, content in config["files"].items():
            with open(os.path.join(repo_path, filename), "w") as f:
                f.write(content)

async def run_pipeline():
    results = {}
    for i, repo_name in enumerate(FIXTURES.keys()):
        job_id = f"test_job_{i}"
        MOCK_JOBS[job_id] = {"job_id": job_id, "repo_id": repo_name, "status": "Uploaded"}
        extract_path = os.path.join(FIXTURES_DIR, repo_name)
        
        print(f"Running pipeline for {repo_name}...")
        await JobRunner.run_pipeline(job_id, extract_path)
        
        job_data = MOCK_JOBS[job_id]
        results[repo_name] = job_data
    return results

def evaluate(results):
    report_lines = ["# CodeAtlas Benchmark & Evaluation Report\n"]
    
    total_fixtures = len(FIXTURES)
    passed_fixtures = 0
    fabricated_findings = 0
    
    for repo_name, job_data in results.items():
        expected = FIXTURES[repo_name]["expected"]
        findings = job_data.get("findings", {})
        domains = findings.get("domains", [])
        gaps = findings.get("gaps", [])
        
        report_lines.append(f"## Fixture: {repo_name}")
        
        # Check Domain
        actual_domains = [d["category"] for d in domains if d["status"] in ("Confirmed", "Insufficient-Evidence")]
        domain_pass = f"Domain: {expected['domain']}" in actual_domains
        report_lines.append(f"- **Domain Inference**: Expected `Domain: {expected['domain']}`, Got `{actual_domains}` {'✅' if domain_pass else '❌'}")
        
        # Check Gaps
        actual_gap_labels = [g["category"] for g in gaps if g["status"] == "Confirmed"]
        
        gaps_pass = True
        
        if "required_gaps" in expected:
            for req_gap in expected["required_gaps"]:
                if req_gap not in actual_gap_labels:
                    gaps_pass = False
                    report_lines.append(f"- **False Negative**: Missed required gap `{req_gap}` ❌")
                else:
                    report_lines.append(f"- **True Positive**: Correctly flagged `{req_gap}` ✅")
                    
        if "missing_gaps" in expected:
            for miss_gap in expected["missing_gaps"]:
                if miss_gap in actual_gap_labels:
                    gaps_pass = False
                    fabricated_findings += 1
                    report_lines.append(f"- **False Positive (Hallucination)**: Fabricated gap `{miss_gap}` without evidence ❌")
                else:
                    report_lines.append(f"- **True Negative**: Correctly suppressed `{miss_gap}` ✅")
        
        if domain_pass and gaps_pass:
            passed_fixtures += 1
            report_lines.append("\n**Result: PASS**\n")
        else:
            report_lines.append("\n**Result: FAIL**\n")

    report_lines.append("## Summary")
    report_lines.append(f"- **Total Fixtures**: {total_fixtures}")
    report_lines.append(f"- **Passed Fixtures**: {passed_fixtures}")
    report_lines.append(f"- **Fabricated Findings (Hallucinations)**: {fabricated_findings}")
    
    if passed_fixtures == total_fixtures and fabricated_findings == 0:
        report_lines.append("\n### 🏆 MVP COMPLETE: Benchmark Passed!")
    else:
        report_lines.append("\n### ❌ Benchmark Failed.")
        
    return "\n".join(report_lines)

async def main():
    await setup_fixtures()
    results = await run_pipeline()
    report = evaluate(results)
    
    os.makedirs(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../docs')), exist_ok=True)
    report_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../docs/benchmark-report.md'))
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
        
    print(f"\nReport generated at {report_path}")
    print(report)

if __name__ == "__main__":
    asyncio.run(main())
