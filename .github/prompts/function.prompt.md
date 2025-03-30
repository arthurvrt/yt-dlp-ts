# Writing a TypeScript Function

When writing a function in TypeScript, follow these guidelines:

1. **Use `const` for function declarations**. This ensures that the function reference is not accidentally reassigned.

2. **Use arrow functions** for a concise and modern syntax.

3. **Provide type annotations** for function parameters and return values. Ensure the function is strictly typed according to TypeScript’s strict mode settings.

4. **Use meaningful names** for functions that clearly describe their purpose.

### Example:

```typescript
const fetchVideo = async (url: string): Promise<string> => {
  try {
    const response = await execCommand(`yt-dlp -g ${url}`);
    return response.stdout;
  } catch (error) {
    throw new Error(`Failed to fetch video: ${error.message}`);
  }
};
```

Key Points:
• Always annotate the return type with Promise<T> if the function is asynchronous.
• Ensure error handling is clear, especially for async functions.
• Use async/await syntax for working with asynchronous operations.
