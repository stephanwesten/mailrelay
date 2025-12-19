# Development Guidelines for MailRelay

## Development Methodology

This project follows **Test-Driven Development (TDD)** and **Extreme Programming (XP)** practices.

### Test-Driven Development (TDD)

Follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green

#### TDD Principles

- Write tests before implementation code
- Tests should be small, focused, and fast
- Each test should verify one behavior
- All code must have corresponding tests
- Run tests frequently during development

### Extreme Programming (XP) Practices

#### Core Practices

- **Simple Design**: Implement the simplest solution that works
- **Refactoring**: Continuously improve code structure
- **Continuous Integration**: Integrate and test code frequently
- **Small Releases**: Deploy small, incremental changes
- **Collective Code Ownership**: Any developer can improve any part of the code

#### Coding Standards

- Write clear, self-documenting code
- Follow consistent naming conventions
- Keep functions small and focused
- DRY (Don't Repeat Yourself)
- YAGNI (You Aren't Gonna Need It) - don't add functionality until needed

### Testing Strategy

#### Unit Tests

- Test individual functions and modules in isolation
- Mock external dependencies (Gmail API, environment variables)
- Fast execution (milliseconds)

#### Integration Tests

- Test API endpoints end-to-end
- Test web form submission flow
- Verify error handling and edge cases

#### Test Coverage Goals

- Aim for >80% code coverage
- 100% coverage for critical paths (email sending, authentication)
- All error handlers must be tested

### Development Workflow

1. Create a failing test for new feature/bugfix
2. Write minimal code to pass the test
3. Refactor if needed
4. Run full test suite
5. Commit with descriptive message
6. Push and deploy via CI/CD

### Tools

- **Testing Framework**: Vitest (or Jest)
- **Mocking**: Built-in test framework mocks
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier

---

**Remember**: If it's not tested, it's broken.
