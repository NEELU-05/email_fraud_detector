"""
Text preprocessing utilities for email fraud detection.
Handles text cleaning, tokenization, and URL extraction.
"""

import re
from typing import List, Tuple

def _ensure_nltk_data():
    """Download NLTK data if missing (runs silently)."""
    try:
        import nltk
        for pkg in ('stopwords', 'punkt', 'wordnet', 'omw-1.4'):
            nltk.download(pkg, quiet=True)
    except Exception:
        pass

_ensure_nltk_data()

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize


class TextCleaner:
    """Handles all text preprocessing operations."""
    
    def __init__(self):
        """Initialize the text cleaner with NLTK components."""
        try:
            self.stop_words = set(stopwords.words('english'))
        except LookupError:
            self.stop_words = set()
        
        self.lemmatizer = WordNetLemmatizer()
        
        # URL pattern for extraction
        self.url_pattern = re.compile(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        )
    
    def extract_urls(self, text: str) -> List[str]:
        """
        Extract all URLs from the email text.
        
        Args:
            text: Raw email text
            
        Returns:
            List of URLs found in the text
        """
        urls = self.url_pattern.findall(text)
        return urls
    
    def remove_html_tags(self, text: str) -> str:
        """
        Remove HTML tags from text.
        
        Args:
            text: Text potentially containing HTML
            
        Returns:
            Text with HTML tags removed
        """
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)
    
    def remove_urls(self, text: str) -> str:
        """
        Remove URLs from text.
        
        Args:
            text: Text containing URLs
            
        Returns:
            Text with URLs removed
        """
        return self.url_pattern.sub('', text)
    
    def remove_special_chars(self, text: str) -> str:
        """
        Remove special characters and numbers, keep only letters and spaces.
        
        Args:
            text: Text to clean
            
        Returns:
            Text with only letters and spaces
        """
        return re.sub(r'[^a-zA-Z\s]', '', text)
    
    def clean_text(self, text: str) -> str:
        """
        Complete text cleaning pipeline.
        
        Steps:
        1. Convert to lowercase
        2. Remove HTML tags
        3. Remove URLs
        4. Remove special characters and numbers
        5. Remove extra whitespace
        
        Args:
            text: Raw email text
            
        Returns:
            Cleaned text ready for tokenization
        """
        # Lowercase
        text = text.lower()
        
        # Remove HTML
        text = self.remove_html_tags(text)
        
        # Remove URLs
        text = self.remove_urls(text)
        
        # Remove special characters
        text = self.remove_special_chars(text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def tokenize_and_lemmatize(self, text: str) -> List[str]:
        """
        Tokenize text and apply lemmatization with stopword removal.
        
        Args:
            text: Cleaned text
            
        Returns:
            List of processed tokens
        """
        try:
            tokens = word_tokenize(text)
        except LookupError:
            tokens = text.split()
        
        # Remove stopwords and lemmatize
        processed_tokens = [
            self.lemmatizer.lemmatize(token)
            for token in tokens
            if token not in self.stop_words and len(token) > 2
        ]
        
        return processed_tokens
    
    def preprocess(self, text: str) -> Tuple[str, List[str]]:
        """
        Full preprocessing pipeline.
        
        Args:
            text: Raw email text
            
        Returns:
            Tuple of (cleaned_text, urls_extracted)
        """
        if not text or not isinstance(text, str):
            return " ", []
        try:
            text = str(text)[:50000]  # Limit length, ensure string
        except Exception:
            return " ", []
        # Extract URLs before cleaning
        urls = self.extract_urls(text)
        # Clean text
        try:
            cleaned = self.clean_text(text)
        except Exception:
            cleaned = re.sub(r'[^a-zA-Z\s]', '', text.lower())[:5000]
        # Tokenize and lemmatize
        try:
            tokens = self.tokenize_and_lemmatize(cleaned)
        except Exception:
            tokens = [t for t in cleaned.split() if len(t) > 2]
        # Join tokens back into string
        processed_text = ' '.join(tokens) if tokens else " "
        return processed_text, urls


# Convenience function for quick access
def preprocess_email(email_text: str) -> Tuple[str, List[str]]:
    """
    Convenience function to preprocess email text.
    
    Args:
        email_text: Raw email text
        
    Returns:
        Tuple of (processed_text, urls_found)
    """
    cleaner = TextCleaner()
    return cleaner.preprocess(email_text)
