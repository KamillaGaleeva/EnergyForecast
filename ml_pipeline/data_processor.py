import pandas as pd
import numpy as np
from datetime import datetime
import glob
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from ml_pipeline.config import DATA_NEW_DIR, DATA_PROCESSED_DIR

def create_features(df):
    """
    Create features similar to those used in training
    """
    df = df.sort_values('timestamp')
    
    df['target_lag_1h'] = df['consumption_kwh'].shift(1)
    df['target_lag_12h'] = df['consumption_kwh'].shift(12)
    df['target_lag_24h'] = df['consumption_kwh'].shift(24)
    df['target_lag_48h'] = df['consumption_kwh'].shift(48)
    df['target_lag_72h'] = df['consumption_kwh'].shift(72)
    df['target_lag_168h'] = df['consumption_kwh'].shift(168)
    df['target_lag_336h'] = df['consumption_kwh'].shift(336)
    
    df['target_pct_change_24h'] = df['consumption_kwh'].pct_change(24) * 100
    
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['day'] = df['timestamp'].dt.day
    df['month'] = df['timestamp'].dt.month
    df['dayofweek'] = df['timestamp'].dt.dayofweek
    
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    return df

def process_new_data():
    """
   Processes all new CSV files in the data/new folder/
    """
    print(f"[{datetime.now()}] start processing new data...")
    
    csv_files = glob.glob(str(DATA_NEW_DIR / "*.csv"))
    
    if not csv_files:
        print("no new data")
        return False
    
    all_dfs = []
    
    for file_path in csv_files:
        print(f"File Processing: {file_path}")
        
        df = pd.read_csv(file_path)
        
        required_cols = ['timestamp', 'consumption_kwh', 'is_consumption']
        if not all(col in df.columns for col in required_cols):
            print(f"Error: there are no necessary columns in the {file_path} file")
            continue
        
        df = create_features(df)
        
        df = df.dropna()
        
        all_dfs.append(df)
        
        archived_path = DATA_NEW_DIR / f"processed_{Path(file_path).name}"
        os.rename(file_path, archived_path)
    
    if not all_dfs:
        print("no data to process")
        return False
    
    final_df = pd.concat(all_dfs, ignore_index=True)
    
    output_file = DATA_PROCESSED_DIR / f"training_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.parquet"
    final_df.to_parquet(output_file)
    
    print(f"Processed {len(all_dfs)} files")
    print(f"Saved in: {output_file}")
    print(f"Total lines: {len(final_df)}")
    
    return True

if __name__ == "__main__":
    process_new_data()