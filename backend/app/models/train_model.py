"""
ML model training script for email fraud detection.
Aggregates ALL datasets from the 'archive (1)' directory and fine-tunes a RoBERTa model.
"""

import os
import glob
import pandas as pd
import numpy as np
import torch
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification, 
    Trainer, 
    TrainingArguments,
    DataCollatorWithPadding
)
from datasets import Dataset

# Check for GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"USING DEVICE: {device}")

def load_and_standardize_dataset(file_path):
    """
    Load a CSV file and standardize it to 'text' and 'label' columns.
    Returns a normalized DataFrame or None if loading fails.
    """
    try:
        print(f"Loading {os.path.basename(file_path)}...")
        
        # specific handling for known problematic files if needed
        # Trying 'latin-1' encoding as some older spam datasets use it
        try:
            df = pd.read_csv(file_path, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding='latin-1')
            
        columns = [c.lower() for c in df.columns]
        df.columns = columns
        
        text_col = None
        label_col = None
        
        # Identify text column
        if 'text_combined' in columns:
            text_col = 'text_combined'
        elif 'body' in columns and 'subject' in columns:
            df['text_combined'] = df['subject'].fillna('') + " " + df['body'].fillna('')
            text_col = 'text_combined'
        elif 'body' in columns:
            text_col = 'body'
        elif 'text' in columns:
            text_col = 'text'
            
        # Identify label column
        if 'label' in columns:
            label_col = 'label'
        elif 'class' in columns:
            label_col = 'class'
            
        if not text_col or not label_col:
            print(f"⚠️  Skipping {os.path.basename(file_path)}: Could not identify text/label columns. Found: {columns}")
            return None
            
        # Normalize
        df = df[[text_col, label_col]].copy()
        df.columns = ['text', 'label']
        
        # Drop junk
        df = df.dropna()
        
        # Normalize labels to 0 (Safe) and 1 (Fraud)
        # This part requires care. We assume 1=Fraud, 0=Safe for numeric.
        # If labels are strings (spam/ham), we map them.
        
        # Check label content
        unique_labels = df['label'].unique()
        
        # Mapping logic
        if isinstance(unique_labels[0], str):
            # mapping for text labels if they appear
            mapping = {
                'spam': 1, 'fraud': 1, 'phishing': 1, '1': 1,
                'ham': 0, 'safe': 0, 'legit': 0, '0': 0
            }
            df['label'] = df['label'].astype(str).str.lower().map(mapping)
            df = df.dropna(subset=['label']) # Drop unmapped labels
        else:
            # Assume numeric 1/0 is correct. 
            # Some datasets might use -1 for safe.
            df['label'] = df['label'].astype(int)
            # If dataset is only 0 (safe) or only 1 (fraud), warn
            if len(df['label'].unique()) < 2:
                 print(f"⚠️  Warning: {os.path.basename(file_path)} contains only one class: {df['label'].unique()}")

        print(f"✅ Loaded {len(df)} samples from {os.path.basename(file_path)}")
        return df

    except Exception as e:
        print(f"❌ Error loading {os.path.basename(file_path)}: {str(e)}")
        return None

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, predictions)
    }

def train_model():
    """Train the fraud detection model using RoBERTa."""
    
    print("\n🚀 Starting Multi-Dataset Deep Learning Training Pipeline...")
    
    # Locate Data Directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(base_dir, '..', '..', '..'))
    
    # Primary and fallback paths
    possible_paths = [
        os.path.join(project_root, 'archive (1)'),
        os.path.join(project_root, 'archive')
    ]
    
    data_dir = None
    for path in possible_paths:
        if os.path.exists(path):
            data_dir = path
            break
            
    if not data_dir:
        raise FileNotFoundError("Could not find 'archive (1)' or 'archive' directory.")
        
    print(f"📂  Data Directory: {data_dir}")
    
    # Find all CSV files
    csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
    print(f"Found {len(csv_files)} dataset files.")
    
    # Aggregate Data
    all_dfs = []
    for csv_file in csv_files:
        df = load_and_standardize_dataset(csv_file)
        if df is not None:
            all_dfs.append(df)
            
    if not all_dfs:
        raise ValueError("No valid datasets loaded. Cannot train model.")
        
    # Combine
    full_df = pd.concat(all_dfs, ignore_index=True)
    
    # Limit dataset size for faster training if needed (e.g. 10k samples)
    # Uncomment to speed up testing: 
    # full_df = full_df.sample(n=5000, random_state=42)
    
    # Shuffle
    full_df = full_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    print(f"\n📊 Total Combined Dataset: {len(full_df)} samples")
    print(f"Class Distribution:\n{full_df['label'].value_counts()}")
    
    # Preprocessing check
    full_df['text'] = full_df['text'].astype(str)
    
    # Split
    train_df, test_df = train_test_split(
        full_df, test_size=0.2, random_state=42, stratify=full_df['label']
    )
    
    # Convert to HuggingFace Datasets
    train_dataset = Dataset.from_pandas(train_df)
    test_dataset = Dataset.from_pandas(test_df)
    
    # Tokenization
    model_name = "distilroberta-base" # Lighter and faster version of RoBERTa
    print(f"\n🧠  Loading Tokenizer: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)
    
    print("Tokenizing datasets...")
    tokenized_train = train_dataset.map(tokenize_function, batched=True)
    tokenized_test = test_dataset.map(tokenize_function, batched=True)
    
    # Model
    print(f"\n🏗️  Initializing Model: {model_name}")
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, 
        num_labels=2,
        id2label={0: "SAFE", 1: "FRAUD"},
        label2id={"SAFE": 0, "FRAUD": 1}
    )
    
    # Training Arguments
    model_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
    os.makedirs(model_dir, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=os.path.join(model_dir, "results"),
        eval_strategy="epoch",
        learning_rate=1e-5, # Lower LR for fine-tuning
        per_device_train_batch_size=8, 
        per_device_eval_batch_size=8,
        num_train_epochs=3, # Increased from 1 to 3
        weight_decay=0.01,
        save_strategy="no", 
        logging_steps=100,
        warmup_steps=500, # Gradual warmup
        gradient_accumulation_steps=4, # Effective batch size 32
        use_cpu=not torch.cuda.is_available()
    )
    
    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_test,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )
    
    # Train
    print("\n🏋️  Starting Training...")
    trainer.train()
    
    # Evaluate
    print("\nEvaluating...")
    eval_results = trainer.evaluate()
    print(f"\n🏆  Evaluation Results: {eval_results}")
    
    # Save Model AND Tokenizer
    final_path = os.path.join(model_dir, "roberta_fraud_model")
    print(f"\n💾  Saving model to {final_path}...")
    model.save_pretrained(final_path)
    tokenizer.save_pretrained(final_path)
    
    # Create evaluation report on test set manually for detailed metrics
    print("\nGenerating detailed classification report...")
    predictions = trainer.predict(tokenized_test)
    preds = np.argmax(predictions.predictions, axis=-1)
    
    print(classification_report(test_df['label'], preds, target_names=['Safe', 'Fraud']))
    print("\n✅ Training Complete.")

if __name__ == "__main__":
    train_model()
