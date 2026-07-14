# Scripts

This directory contains utility scripts for DataFixer.

## Available Scripts

- **`generate_dirty_dataset.py`** - Massive test dataset generator

## Usage

### Generate Test Dataset
```bash
cd scripts
python generate_dirty_dataset.py
```

This creates a comprehensive dirty dataset with:
- 5,600+ rows of realistic data
- 12,321+ quality issues including:
  - Missing values (11,721 instances)
  - Duplicate records (599 duplicates)
  - Empty columns (3 columns)
  - Data type inconsistencies
  - Formatting problems

The generated dataset is saved as `massive_dirty_dataset.csv` in the `/data/samples/` directory.

## Adding New Scripts

When adding new utility scripts:
1. Place them in this `/scripts/` directory
2. Add appropriate documentation here
3. Follow the naming convention: `action_description.py`
4. Include proper error handling and logging