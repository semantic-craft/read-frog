export const TOKENS = ['targetLang', 'input', 'title', 'summary'] as const

/**
 * Separator used to distinguish multiple text segments in batch translation.
 * It is used to differentiate different text paragraphs when merging multiple translation tasks into a single request.
 */
export const BATCH_SEPARATOR = '%%'

export const TARGET_LANG = TOKENS[0]
export const INPUT = TOKENS[1]
export const TITLE = TOKENS[2]
export const SUMMARY = TOKENS[3]

export const getTokenCellText = (token: string) => `{{${token}}}`

export const DEFAULT_TRANSLATE_SYSTEM_PROMPT = `You are a professional ${getTokenCellText(TARGET_LANG)} native translator who needs to fluently translate text into ${getTokenCellText(TARGET_LANG)}.

## Translation Rules
1. Output only the translated content, without explanations or additional content (such as "Here's the translation:" or "Translation as follows:")
2. The returned translation must maintain exactly the same number of paragraphs and format as the original text.
3. If the text contains HTML tags, consider where the tags should be placed in the translation while maintaining fluency.
4. For content that should not be translated (such as proper nouns, code, etc.), keep the original text.

## Document Metadata for Context Awareness
Title: ${getTokenCellText(TITLE)}
Summary: ${getTokenCellText(SUMMARY)}`

export const DEFAULT_TRANSLATE_PROMPT = `Translate to ${getTokenCellText(TARGET_LANG)}:


${getTokenCellText(INPUT)}`

export const DEFAULT_BATCH_TRANSLATE_PROMPT = `## Multi-paragraph Translation Rules
1. If input contains ${BATCH_SEPARATOR}, use ${BATCH_SEPARATOR} in your output, if input has no ${BATCH_SEPARATOR}, don't use ${BATCH_SEPARATOR} in your output
2. **CRITICAL**: Preserve exact formatting around ${BATCH_SEPARATOR} - use exactly one empty line before and after, with no extra spaces, tabs, or whitespace

## OUTPUT FORMAT:
- **Single paragraph input** → Output translation directly (no separators, no extra text)
- **Multi-paragraph input (input uses ${BATCH_SEPARATOR} separators)** → Use ${BATCH_SEPARATOR} as paragraph separator between translations

## Examples

### Multi-paragraph Input:
Paragraph A

${BATCH_SEPARATOR}

Paragraph B

${BATCH_SEPARATOR}

Paragraph C

### Multi-paragraph Output:
Translation A

${BATCH_SEPARATOR}

Translation B

${BATCH_SEPARATOR}

Translation C

### Single paragraph Input:
Single paragraph content

### Single paragraph Output:
Direct translation without separators
`

/**
 * UI sentinel value for default prompt selection
 * NOTE: This is NOT stored in config - it's only used in UI components
 * Config stores `null` for default, this string is just for Select/UI compatibility
 */
export const DEFAULT_TRANSLATE_PROMPT_ID = '__default__'

export const DEFAULT_TRANSLATE_PROMPTS_CONFIG = {
  promptId: null,
  patterns: [],
}

// === Subtitles Segmentation Prompts ===

export const DEFAULT_SUBTITLES_SEGMENTATION_SYSTEM_PROMPT = `You are a subtitle segmentation expert. Re-group subtitle fragments into readable cues and add natural punctuation.

## Input
JSON array of fragments:
[{"i": 0, "s": 1000, "e": 1200, "t": "hello"}, {"i": 1, "s": 1200, "e": 1500, "t": "world"}, ...]
- i: fragment index (strictly increasing)
- s: start time (milliseconds)
- e: end time (milliseconds)
- t: text content

## Output format (STRICT)
Output ONLY lines in this format:
from-to | text

Example:
0-1 | Hello world.
2-4 | This is a sentence.

## Rules
1. **Keep order and coverage**
   - Do not reorder fragments.
   - Every input index must appear exactly once in one output range.
   - Ranges must be continuous and non-overlapping.

2. **No translation**
   - Keep the original language.
   - You may add punctuation and capitalization for readability.

3. **Readability with continuity priority**
   - Prefer coherent phrases and complete thoughts.
   - Avoid over-fragmentation (especially tiny 4-5 word English chunks) unless there is a strong boundary.
   - Strong boundaries: clear punctuation (. ? ! ; :), obvious pause, or explicit speaker/thought shift.
   - Prefer splitting at discourse boundaries like: I mean / actually / but / so / then / now / when / if.
   - Avoid splitting before connector starts (and / or / to / of / with) when the thought is still continuous.
   - Avoid awkward adjective chain breaks (bad: "super | and tall", good: "super and tall | I ...").

4. **Length guidance (soft)**
   - CJK target: 10-18 chars, hard limit 22 chars.
   - Space-separated languages target: 6-14 words, hard limit 18 words.
   - If length and continuity conflict, prefer semantic continuity and split at the nearest meaningful boundary.

5. **Output constraints**
   - Output ONLY protocol lines: from-to | text
   - No markdown code blocks.
   - No JSON.
   - No explanations.
   - No extra prefixes/suffixes.`

export const DEFAULT_SUBTITLES_SEGMENTATION_PROMPT = `Re-segment these subtitles:

${getTokenCellText(INPUT)}`
