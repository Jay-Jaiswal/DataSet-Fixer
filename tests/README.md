# Tests

This directory contains all testing files and utilities for DataFixer.

## Test Files

- **`test_api.py`** - Comprehensive API endpoint testing
- **`comprehensive_test.py`** - End-to-end testing with large datasets
- **`debug_cleaning.py`** - Debugging utilities for data cleaning algorithms
- **`simple_cleaning_test.py`** - Basic cleaning functionality tests
- **`test_cleaning.py`** - Unit tests for data cleaning components

## Running Tests

### API Tests
```bash
cd tests
python test_api.py
```

### Comprehensive Testing
```bash
cd tests
python comprehensive_test.py
```

### Debug Mode
```bash
cd tests
python debug_cleaning.py
```

## Test Data

Test data samples are located in `/data/samples/` directory:
- `massive_dirty_dataset.csv` - 5,600 rows with 12,321+ quality issues
- `test_data_for_frontend.csv` - Sample data for UI testing
- `test_messy_data.csv` - Various data quality problems

## Coverage

Tests cover:
- ✅ All API endpoints
- ✅ Data cleaning algorithms
- ✅ Error handling
- ✅ Large dataset processing
- ✅ Edge cases and malformed data