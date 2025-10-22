#!/usr/bin/env python3
"""
Simple Beads (bd) wrapper for environments where the bd CLI cannot be installed.
Reads .beads/issues.jsonl directly to provide basic issue tracking functionality.
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

class BeadsWrapper:
    def __init__(self, repo_path="."):
        self.repo_path = Path(repo_path)
        self.issues_file = self.repo_path / ".beads" / "issues.jsonl"

    def load_issues(self) -> List[Dict[str, Any]]:
        """Load all issues from the JSONL file."""
        if not self.issues_file.exists():
            return []

        issues = []
        with open(self.issues_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line:
                    issues.append(json.loads(line))
        return issues

    def list_issues(self, status=None):
        """List all issues, optionally filtered by status."""
        issues = self.load_issues()

        if status:
            issues = [i for i in issues if i.get('status') == status]

        if not issues:
            print("No issues found.")
            return

        # Sort by ID
        issues.sort(key=lambda x: x.get('id', ''))

        for issue in issues:
            id_ = issue.get('id', 'unknown')
            title = issue.get('title', 'No title')
            status = issue.get('status', 'unknown')
            priority = issue.get('priority', '-')
            issue_type = issue.get('issue_type', 'task')

            # Format output
            status_symbol = {
                'open': '○',
                'closed': '●',
                'in_progress': '◐'
            }.get(status, '?')

            print(f"{status_symbol} {id_:12} [P{priority}] [{issue_type:8}] {title}")

    def show_issue(self, issue_id):
        """Show detailed information about a specific issue."""
        issues = self.load_issues()
        issue = next((i for i in issues if i.get('id') == issue_id), None)

        if not issue:
            print(f"Issue {issue_id} not found.")
            return

        print(f"\n{'='*60}")
        print(f"Issue: {issue.get('id')}")
        print(f"{'='*60}")
        print(f"Title:       {issue.get('title', 'No title')}")
        print(f"Status:      {issue.get('status', 'unknown')}")
        print(f"Priority:    {issue.get('priority', '-')}")
        print(f"Type:        {issue.get('issue_type', 'task')}")
        print(f"Created:     {issue.get('created_at', 'unknown')}")
        print(f"Updated:     {issue.get('updated_at', 'unknown')}")

        if issue.get('closed_at'):
            print(f"Closed:      {issue.get('closed_at')}")

        if issue.get('description'):
            print(f"\nDescription:\n{issue.get('description')}")

        if issue.get('notes'):
            print(f"\nNotes:\n{issue.get('notes')}")

        # Show dependencies
        deps = issue.get('dependencies', [])
        if deps:
            print(f"\nDependencies:")
            for dep in deps:
                dep_type = dep.get('type', 'unknown')
                depends_on = dep.get('depends_on_id', 'unknown')
                print(f"  - {dep_type}: {depends_on}")

        print(f"{'='*60}\n")

    def stats(self):
        """Show statistics about the issues."""
        issues = self.load_issues()

        if not issues:
            print("No issues found.")
            return

        total = len(issues)
        by_status = {}
        by_type = {}

        for issue in issues:
            status = issue.get('status', 'unknown')
            issue_type = issue.get('issue_type', 'task')

            by_status[status] = by_status.get(status, 0) + 1
            by_type[issue_type] = by_type.get(issue_type, 0) + 1

        print(f"\n{'='*40}")
        print(f"Beads Statistics")
        print(f"{'='*40}")
        print(f"Total issues: {total}")
        print(f"\nBy Status:")
        for status, count in sorted(by_status.items()):
            print(f"  {status:12} {count:3}")
        print(f"\nBy Type:")
        for itype, count in sorted(by_type.items()):
            print(f"  {itype:12} {count:3}")
        print(f"{'='*40}\n")

    def quickstart(self):
        """Show quickstart information."""
        print("\n" + "="*60)
        print("Beads Quickstart (Wrapper Mode)")
        print("="*60)
        print("\nThis is a wrapper script for reading Beads issues directly")
        print("from the .beads/issues.jsonl file.")
        print("\nThe full 'bd' CLI is not available in this environment due to")
        print("network restrictions preventing Go module downloads.")
        print("\nAvailable commands:")
        print("  ./bd-wrapper.py list              - List all issues")
        print("  ./bd-wrapper.py list --status open - List open issues")
        print("  ./bd-wrapper.py show <issue-id>   - Show issue details")
        print("  ./bd-wrapper.py stats             - Show statistics")
        print("  ./bd-wrapper.py quickstart        - Show this help")
        print("\nYour chess project has completed all 9 tracked issues:")
        print("  chess-1 through chess-9 (all closed)")
        print("\nTo create new issues, you would need the full 'bd' CLI or")
        print("manually edit .beads/issues.jsonl (see TEXT_FORMATS.md in")
        print("the Beads repo for format details).")
        print("="*60 + "\n")

def main():
    wrapper = BeadsWrapper()

    if len(sys.argv) < 2:
        wrapper.quickstart()
        sys.exit(0)

    command = sys.argv[1]

    if command == "list":
        status = None
        if len(sys.argv) > 3 and sys.argv[2] == "--status":
            status = sys.argv[3]
        wrapper.list_issues(status=status)

    elif command == "show":
        if len(sys.argv) < 3:
            print("Usage: bd-wrapper.py show <issue-id>")
            sys.exit(1)
        issue_id = sys.argv[2]
        wrapper.show_issue(issue_id)

    elif command == "stats":
        wrapper.stats()

    elif command == "quickstart":
        wrapper.quickstart()

    else:
        print(f"Unknown command: {command}")
        print("Available commands: list, show, stats, quickstart")
        sys.exit(1)

if __name__ == "__main__":
    main()
