import numpy as np

def path2List(p):
    """Converts a file path string to a list of segments."""
    return p.strip().split("/") if isinstance(p, str) else []

def get_path_similarity_stats(files_A, files_B):
    """Calculates LCP, LCSuff, Jaccard, etc., between two file lists."""
    stats = {}
    
    # Helper lambdas for logic
    LCP = lambda f1, f2: sum(1 for a, b in zip(path2List(f1), path2List(f2)) if a == b)
    LCSuff = lambda f1, f2: sum(1 for a, b in zip(reversed(path2List(f1)), reversed(path2List(f2))) if a == b)
    
    # Basic Jaccard
    set_A, set_B = set(files_A), set(files_B)
    stats["jaccard"] = len(set_A & set_B) / len(set_A | set_B) if set_A | set_B else 0
    stats["nb_shared"] = len(set_A & set_B)
    stats["delta_files"] = len(files_A) - len(files_B)

    # Expensive loop for path similarities
    # Optimization: If lists are empty, skip loops
    if not files_A or not files_B:
        for m in ["LCP_mean", "LCP_max", "LCSuff_mean", "LCSuff_max"]:
            stats[m] = 0
        return stats

    # Calculate LCP matrix
    lcp_scores = [LCP(fa, fb)/max(len(path2List(fa)), len(path2List(fb)), 1) for fa in files_A for fb in files_B]
    stats["LCP_mean"] = np.mean(lcp_scores)
    stats["LCP_max"] = np.max(lcp_scores)

    # Calculate LCSuff matrix
    lcsucc_scores = [LCSuff(fa, fb)/max(len(path2List(fa)), len(path2List(fb)), 1) for fa in files_A for fb in files_B]
    stats["LCSuff_mean"] = np.mean(lcsucc_scores)
    stats["LCSuff_max"] = np.max(lcsucc_scores)

    return stats