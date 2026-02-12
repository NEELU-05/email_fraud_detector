"""
Rule-based URL fraud detection analyzer.
Detects suspicious patterns in URLs commonly used in phishing emails.
"""

import re
import math
from typing import List, Dict, Tuple
from urllib.parse import urlparse


class URLAnalyzer:
    """Analyzes URLs for fraud indicators using rule-based detection."""
    
    # Known URL shortener domains
    URL_SHORTENERS = {
        'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co',
        'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'short.link',
        'tiny.cc', 'cli.gs', 'pic.gd', 'DwarfURL.com', 'yfrog.com',
        'migre.me', 'ff.im', 'tiny.pl', 'url4.eu', 'tr.im',
        'twit.ac', 'su.pr', 'twurl.nl', 'snipurl.com', 'BudURL.com',
        'short.to', 'ping.fm', 'Digg.com', 'post.ly', 'Just.as',
        'bkite.com', 'snipr.com', 'fic.kr', 'loopt.us', 'doiop.com',
        'twitthis.com', 'htxt.it', 'AltURL.com', 'RedirX.com', 'DigBig.com',
        'short.ie', 'u.mavrev.com', 'kl.am', 'wp.me', 'rubyurl.com',
        'om.ly', 'to.ly', 'bit.it', 'lnkd.in', 'db.tt',
        'qr.ae', 'adf.ly', 'bitly.com', 'cur.lv', 'ity.im',
        'q.gs', 'po.st', 'bc.vc', 'twitthis.com', 'u.to',
        'j.mp', 'buzurl.com', 'cutt.us', 'u.bb', 'yourls.org',
        'prettylinkpro.com', 'scrnch.me', 'filoops.info', 'vzturl.com',
        'qr.net', '1url.com', 'tweez.me', 'v.gd', 'link.zip.net'
    }
    
    # Suspicious top-level domains
    SUSPICIOUS_TLDS = {
        '.xyz', '.top', '.pw', '.cc', '.tk', '.ml', '.ga', '.cf', '.gq',
        '.work', '.click', '.link', '.download', '.racing', '.loan', '.win',
        '.bid', '.review', '.trade', '.date', '.stream', '.party', '.faith',
        '.science', '.accountant', '.cricket', '.men', '.online', '.site'
    }
    
    def __init__(self):
        """Initialize the URL analyzer."""
        self.ip_pattern = re.compile(
            r'https?://(?:\d{1,3}\.){3}\d{1,3}'
        )
    
    def calculate_entropy(self, domain: str) -> float:
        """
        Calculate Shannon entropy of a domain name.
        High entropy suggests random/generated domains.
        
        Args:
            domain: Domain name to analyze
            
        Returns:
            Entropy value (higher = more random)
        """
        if not domain:
            return 0.0
        
        # Calculate character frequency
        char_freq = {}
        for char in domain:
            char_freq[char] = char_freq.get(char, 0) + 1
        
        # Calculate entropy
        entropy = 0.0
        domain_len = len(domain)
        
        for count in char_freq.values():
            probability = count / domain_len
            entropy -= probability * math.log2(probability)
        
        return entropy
    
    def is_url_shortener(self, url: str) -> bool:
        """
        Check if URL uses a known shortening service.
        
        Args:
            url: URL to check
            
        Returns:
            True if URL is from a shortening service
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove www. prefix
            if domain.startswith('www.'):
                domain = domain[4:]
            
            return domain in self.URL_SHORTENERS
        except Exception:
            return False
    
    def has_suspicious_tld(self, url: str) -> bool:
        """
        Check if URL has a suspicious top-level domain.
        
        Args:
            url: URL to check
            
        Returns:
            True if TLD is suspicious
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            for tld in self.SUSPICIOUS_TLDS:
                if domain.endswith(tld):
                    return True
            
            return False
        except Exception:
            return False
    
    def has_excessive_subdomains(self, url: str, threshold: int = 3) -> bool:
        """
        Check if URL has excessive subdomains (common in phishing).
        
        Args:
            url: URL to check
            threshold: Maximum allowed subdomains
            
        Returns:
            True if subdomain count exceeds threshold
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove www. prefix
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Count dots (subdomains)
            subdomain_count = domain.count('.')
            
            return subdomain_count >= threshold
        except Exception:
            return False
    
    def is_ip_based(self, url: str) -> bool:
        """
        Check if URL uses IP address instead of domain name.
        
        Args:
            url: URL to check
            
        Returns:
            True if URL uses IP address
        """
        return bool(self.ip_pattern.match(url))
    
    def has_high_entropy(self, url: str, threshold: float = 4.0) -> bool:
        """
        Check if domain has high entropy (random-looking).
        
        Args:
            url: URL to check
            threshold: Entropy threshold
            
        Returns:
            True if entropy exceeds threshold
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove www. and TLD for entropy calculation
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Get domain without TLD
            domain_parts = domain.split('.')
            if len(domain_parts) > 1:
                domain = domain_parts[0]
            
            entropy = self.calculate_entropy(domain)
            return entropy > threshold
        except Exception:
            return False
    
    def analyze_url(self, url: str) -> Dict[str, any]:
        """
        Perform comprehensive analysis on a single URL.
        
        Args:
            url: URL to analyze
            
        Returns:
            Dictionary with analysis results
        """
        return {
            'url': url,
            'is_shortener': self.is_url_shortener(url),
            'suspicious_tld': self.has_suspicious_tld(url),
            'excessive_subdomains': self.has_excessive_subdomains(url),
            'ip_based': self.is_ip_based(url),
            'high_entropy': self.has_high_entropy(url)
        }
    
    def calculate_url_risk_score(self, url: str) -> float:
        """
        Calculate risk score for a single URL (0.0 to 1.0).
        
        Args:
            url: URL to score
            
        Returns:
            Risk score between 0.0 (safe) and 1.0 (high risk)
        """
        analysis = self.analyze_url(url)
        
        # Weight different factors
        score = 0.0
        
        if analysis['is_shortener']:
            score += 0.3
        if analysis['suspicious_tld']:
            score += 0.25
        if analysis['excessive_subdomains']:
            score += 0.2
        if analysis['ip_based']:
            score += 0.15
        if analysis['high_entropy']:
            score += 0.1
        
        return min(score, 1.0)
    
    def analyze_urls(self, urls: List[str]) -> Tuple[float, List[Dict]]:
        """
        Analyze multiple URLs and calculate aggregate risk score.
        
        Args:
            urls: List of URLs to analyze
            
        Returns:
            Tuple of (aggregate_risk_score, detailed_analyses)
        """
        if not urls:
            return 0.0, []
        
        analyses = []
        total_risk = 0.0
        
        for url in urls:
            analysis = self.analyze_url(url)
            risk_score = self.calculate_url_risk_score(url)
            
            analysis['risk_score'] = risk_score
            analyses.append(analysis)
            total_risk += risk_score
        
        # Average risk score across all URLs
        avg_risk = total_risk / len(urls)
        
        return avg_risk, analyses


# Convenience function
def analyze_email_urls(urls: List[str]) -> Tuple[float, List[Dict]]:
    """
    Convenience function to analyze URLs from an email.
    
    Args:
        urls: List of URLs extracted from email
        
    Returns:
        Tuple of (risk_score, detailed_analyses)
    """
    analyzer = URLAnalyzer()
    return analyzer.analyze_urls(urls)
