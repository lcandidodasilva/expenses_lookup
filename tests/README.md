# Testing House Keeping Application

This directory contains tests for the House Keeping application. The tests are organized by module and use Jest as the testing framework.

## Running Tests

You can run the tests using the following npm commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run a specific test file
npm test -- tests/utils/validationUtils.test.ts
```

## Test Directory Structure

The tests follow the same structure as the source code to make it easy to find corresponding tests:

- `tests/utils/` - Tests for utility functions
  - `dateUtils.test.ts` - Tests for date utility functions
  - `db.test.ts` - Tests for database utility functions
  - `csvParser.test.ts` - Tests for CSV parsing functions
  - `categoryMapping.test.ts` - Tests for category mapping
  - `commonUtils.test.ts` - Tests for common utility functions
  - `validationUtils.test.ts` - Tests for validation utility functions
  - `simpleUtils.test.ts` - Simple tests for basic JS functionality

## Current Status

Currently, the following tests are working successfully:
- Simple utility tests
- Common utility tests
- Validation utility tests
- Category mapping tests

The following tests need further work:
- Database utility tests (needs proper mocking)
- CSV parser tests (needs proper mocking)
- Date utility tests (needs proper implementation)

## Writing Tests

When writing new tests, please follow these guidelines:

1. Create test files with the `.test.ts` extension
2. Place test files in a directory structure that mirrors the source code
3. Use descriptive test names and organize tests using Jest's `describe` and `it` blocks
4. Use mock data and avoid depending on external services
5. Mock external dependencies when necessary
6. Keep tests isolated from each other

## Testing Strategy

The test suite includes:

- **Unit Tests**: Testing individual functions in isolation
- **Mock Tests**: Testing components with mocked dependencies
- **Integration Tests**: Testing how components work together

## Adding More Tests

To add more tests:

1. Create a new test file in the appropriate directory
2. Import the functions/components you want to test
3. Write test cases using Jest's testing framework
4. Run the tests to ensure they pass

## Testing Helpers

The project includes several testing helpers:

- `src/test-utils/jest-setup.ts` - Common setup and mock functions for tests
- `tests/mocks/types.ts` - Mock types for testing 