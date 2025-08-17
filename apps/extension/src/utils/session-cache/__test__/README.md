# Session Cache Tests

This directory contains comprehensive tests for the session cache components.

## Test Files

### 1. `session-cache-group.test.ts`

Tests for the `SessionCache` class, including:

- **Constructor**: Group key handling and initialization
- **Key Generation**: Internal key generation logic
- **Lazy Initialization**: Keys list initialization behavior
- **Get Method**: Cache retrieval with TTL handling
- **Set Method**: Cache storage with metadata
- **Delete Method**: Single item removal
- **Clear Method**: Bulk removal operations
- **Error Handling**: Graceful error recovery
- **Integration Scenarios**: End-to-end workflows

### 2. `session-cache-group-registry.test.ts`

Tests for the `SessionCacheGroupRegistry` class, including:

- **Registration**: Adding cache groups to registry
- **Retrieval**: Getting all registered groups
- **Cache Group Factory**: Creating SessionCache instances
- **Bulk Operations**: Clearing all cache groups
- **Group Removal**: Removing specific groups
- **Error Handling**: Graceful error recovery
- **Concurrency**: Handling concurrent operations

## Key Test Scenarios

### Data Integrity

- ✅ Cache hit/miss scenarios
- ✅ TTL expiration handling
- ✅ Metadata consistency
- ✅ Keys list management

### Performance

- ✅ Bulk operations (removeItems)
- ✅ Parallel storage operations
- ✅ Lazy initialization

### Error Resilience

- ✅ Storage failures
- ✅ Partial operation failures
- ✅ Graceful degradation

### Cross-Group Operations

- ✅ Group isolation
- ✅ Registry consistency
- ✅ Bulk clearing

## Running Tests

```bash
# Run all session cache tests
npm test session-cache

# Run specific test file
npm test session-cache-group.test.ts
npm test session-cache-group-registry.test.ts

# Run with coverage
npm test session-cache -- --coverage
```

## Mock Strategy

The tests use comprehensive mocking of:

- **WXT Storage API**: All storage operations are mocked
- **Logger**: Logging calls are captured but don't output
- **Constants**: TTL values are controlled for predictable testing

This approach ensures:

- Tests are fast and isolated
- No actual storage operations occur
- Predictable test outcomes
- Easy debugging of failures

## Test Coverage

The tests aim for 100% code coverage including:

- All public methods
- All error paths
- All conditional branches
- Integration scenarios
- Edge cases (empty data, concurrent operations, etc.)
