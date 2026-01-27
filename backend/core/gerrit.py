import requests
import json
import pandas as pd

PROJECT_URLS = {
    "qt": "https://codereview.qt-project.org",
    "android": "https://android-review.googlesource.com",
    "openstack": "https://review.opendev.org"
}

class GerritClient:
    @staticmethod
    def get_patch_details(project_key, patch_id):
        base_url = PROJECT_URLS.get(project_key)
        if not base_url:
            raise ValueError(f"Unknown project: {project_key}")

        url = f"{base_url}/changes/{patch_id}?o=ALL_REVISIONS&o=ALL_FILES&o=MESSAGES"
        
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                return None
            
            # Clean Gerrit's magic prefix
            content = resp.text
            if content.startswith(")]}'"):
                content = content[4:]
            
            data = json.loads(content)
            return GerritClient._parse_gerrit_json(data, patch_id)
            
        except Exception as e:
            print(f"[GerritAPI] Error fetching {patch_id}: {e}")
            return None

    @staticmethod
    def _parse_gerrit_json(data, patch_id):
        """Standardizes the JSON into a clean dictionary."""
        subject = data.get("subject", "")
        created_str = data.get("created", "")
        created_time = pd.to_datetime(created_str) if created_str else pd.NaT

        # Get latest revision for commit message
        revisions = data.get("revisions", {})
        last_rev = next(iter(revisions.values())) if revisions else {} # naive grab first available if default fails
        
        # Better logic to find latest
        if revisions:
            max_num = max(r.get("_number", 0) for r in revisions.values())
            for r in revisions.values():
                if r.get("_number") == max_num:
                    last_rev = r
                    break
        
        commit_msg = last_rev.get("commit", {}).get("message", subject)

        # Get files from Revision 1 (standard practice for patch comparisons)
        rev1 = next((r for r in revisions.values() if r.get("_number") == 1), None)
        files = []
        if rev1:
            files = [f for f in rev1.get("files", {}) if f not in ["/COMMIT_MSG", "MERGE_LIST"]]

        return {
            "patch_id": str(patch_id),
            "title": subject,
            "description": commit_msg,
            "created_time": created_time,
            "files": files
        }
    