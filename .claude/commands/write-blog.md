Write a user-oriented blog post about: $ARGUMENTS.

This command creates blog content for the Read Frog website to inform users about new features, updates, or improvements.

Follow these steps:

1. **Understand the context**:
   - If PR numbers are provided (e.g., "PR 548", "#548"), fetch details using `gh pr view <number> --json title,body,number,mergedAt`
   - If feature names or descriptions are provided, search the codebase for relevant implementation details
   - If code context is provided, analyze the changes and their user impact

2. **Research the changes**:
   - Read relevant code files to understand what changed
   - Focus on user-facing features and benefits, not technical implementation
   - Identify the problem being solved and the value provided to users

3. **Create blog filename**:
   - Use kebab-case format: `feature-name.mdx` and `feature-name.zh.mdx`
   - Examples: `batch-translation.mdx`, `new-ai-provider.mdx`
   - Place in `apps/website/content/blog/` directory

4. **Write the blog post** in both English and Chinese:
   - **Frontmatter** (required):
     - title: Clear, engaging title (e.g., "Introducing Batch Translation")
     - description: Brief summary (1-2 sentences)
     - author: use `git config user.name` as author, if not found, use "Read Frog Team"
     - date: Use today's date in YYYY-MM-DD format

   - **Content structure** (user-focused):
     - Opening: Engaging introduction explaining the update
     - What's New: Describe the feature/improvement in simple terms
     - Why This Matters: Explain the benefits and value to users
     - How to Use: Step-by-step guide if applicable
     - Use Cases: Real-world scenarios where this helps
     - What's Next: Tease future improvements if relevant

   - **Tone and style**:
     - User-friendly, not technical jargon
     - Focus on benefits and outcomes, not implementation
     - Use emojis moderately for visual appeal
     - Include relevant examples and use cases
     - Keep it conversational and engaging

5. **Bilingual content**:
   - Write both `.mdx` (English) and `.zh.mdx` (Chinese) versions
   - Ensure both versions convey the same information
   - Use "陪读蛙" for the Chinese name
   - Adapt cultural context if needed for Chinese audience

6. **Quality check**:
   - Verify all frontmatter fields are present
   - Check that content is user-oriented (not developer-oriented)
   - Ensure proper markdown formatting
   - Confirm emojis render correctly
   - Test that links work (if any)

7. **Output**:
   - Create both language versions
   - Provide a summary of the blog post
   - Suggest social media snippets if relevant

**Examples of user-oriented vs developer-oriented**:
- ❌ Developer: "Implemented BatchQueue with configurable flush thresholds"
- ✅ User: "Translations are now faster! Multiple paragraphs are translated together in one go"

- ❌ Developer: "Added tRPC endpoint for user preferences"
- ✅ User: "Your settings now sync across devices automatically"

**Remember**:
- The blog is for users, not developers
- Focus on the "why" and "what", not the "how"
- Explain value and benefits clearly
- Use simple language and real-world examples
