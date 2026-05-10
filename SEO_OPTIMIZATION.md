# SEO Optimization for Stock Media Metadata

## Overview
This document outlines the SEO improvements made to **metagen** to ensure all generated metadata is optimized for discoverability on stock platforms like Adobe Stock and Freepik.

---

## Key SEO Improvements

### 1. **Enhanced Metadata Prompt** 
The API prompt now includes detailed SEO guidelines for the AI model:

#### Title Optimization
- **Max 70 characters** (optimal for search results display)
- **Pattern**: `[Main Subject] [Action/Modifier] [Context]`
- **Strategy**: Include primary keyword early, be specific not generic
- **Examples**: 
  - ✅ "Professional businessman analyzing financial data on laptop"
  - ❌ "Man and laptop"

#### Description Optimization
- **Range**: 150-200 characters (SEO sweet spot)
- **Strategy**: Natural conversational language with embedded keywords
- **Requirements**: 
  - Include primary AND secondary keywords naturally
  - Use action verbs
  - No hashtags, quotes, or emojis
  - Avoid duplicating title text
- **Example**: "Closeup of hands typing on keyboard showing financial charts and data analysis on computer screen"

#### Keywords Strategy (Most Impactful)
Mix keyword types for maximum discoverability:
- **30% Long-tail keywords** (2-4 words): `business team meeting`, `laptop analysis`
- **40% Primary + secondary keywords**: `professional`, `business`, `finance`, `data`
- **20% Use-case/intent keywords**: `social media`, `blog featured`, `marketing`
- **10% Emotional/style descriptors**: `modern`, `professional`, `contemporary`

**Ordering**: List by relevance (most specific/long-tail first)

#### Mood & Suggested Use
- **Mood**: Single emotional/style descriptor (e.g., "modern professional")
- **Suggested Use**: Specific commercial/editorial application (e.g., "Blog featured image")
- Both directly impact platform discovery and click-through rates

---

### 2. **Improved Keyword Normalization**

The `normalizeKeywords()` function now:

#### Filters Weak Generic Terms
Automatically removes generic stock media terms that provide no SEO value:
- Generic: `image`, `photo`, `picture`, `vector`, `graphic`
- Technical: `stock`, `media`, `file`, `digital`
- Vague: `concept`, `abstract`, `element`

#### Prioritizes Long-Tail Keywords
- **Longer phrases score higher** (2-4 word phrases before single words)
- More specific = better SEO value
- Provides better search intent matching

#### Maintains Quality
- Removes duplicates and near-duplicates
- Preserves capitalization-insensitive deduplication
- Limits to platform maximum (10-15 keywords typically)

**Example Processing**:
```
Input: ["photo", "business meeting", "professional", "business", "team meeting", "corporate"]
Output: ["business meeting", "team meeting", "professional", "business", "corporate"]
         (3-word → 2-word → singles; generic "photo" removed)
```

---

### 3. **Enhanced Metadata Validation**

The `parseJson()` function now:

#### Title Improvements
- Removes weak prefixes (`the`, `a`, `an`)
- Applies proper sentence case
- Soft breaks at word boundaries (not mid-word) if over 70 chars
- Warns if title is too vague

#### Description Validation
- Warns if description is below 80 characters (should be 150+)
- Preserves natural language flow
- Ensures substantive content

#### Consistent Formatting
- Proper capitalization for mood and suggested_use
- Validation of required fields
- Consistent data types

---

## Platform-Specific Considerations

### Adobe Stock
- **Max keywords**: 10-15
- **Search weight**: Title > Keywords > Description
- **Behavior**: Phrase matching is strong
- **Recommendation**: Use exact phrase keywords when possible

### Freepik  
- **Max keywords**: Similar to Adobe (10-15)
- **Search weight**: More balanced across all fields
- **Behavior**: Individual keyword matching
- **Recommendation**: Include single-word AND multi-word variants

---

## Best Practices Checklist

### For Content Creators Using metagen

✅ **DO**:
- Include specific details in titles (colors, actions, contexts)
- Use natural language in descriptions (no keyword stuffing)
- Mix keyword types (long-tail, specific, intent-based, emotional)
- Include relevant use-case keywords
- Ensure descriptions are substantive (150+ chars)
- Test keywords by searching platforms manually

❌ **DON'T**:
- Use generic single-word titles
- Stuff keywords unnaturally
- Include brand names or trademarks
- Repeat title text in description
- Use hashtags or emojis
- Keep descriptions under 80 characters
- Use vague descriptors alone

---

## SEO Keyword Distribution Example

**For a photo of "woman doing yoga at home"**:

**Titles** (70 chars max):
- ✅ "Young woman doing yoga stretches at home on floor mat"
- ❌ "Woman yoga"

**Keywords** (10-15 total):
1. `woman doing yoga` (long-tail, specific)
2. `home yoga practice` (long-tail, use-case)
3. `yoga stretching` (long-tail, activity)
4. `fitness` (primary keyword)
5. `wellness` (secondary keyword)
6. `healthy lifestyle` (compound)
7. `exercise` (primary)
8. `meditation` (related concept)
9. `home workout` (use-case)
10. `yoga poses` (compound)
11. `relaxation` (emotional descriptor)
12. `wellbeing` (secondary)

**Description** (150-200 chars):
"Young woman performing yoga stretches and meditation exercises on a comfortable floor mat inside her home, promoting fitness, wellness, and mindful living for a healthy lifestyle."

---

## Implementation Details

### Modified Files
- **js/api.js**: Enhanced prompt, improved normalization, better validation

### No Breaking Changes
- ✅ Backward compatible with existing configuration
- ✅ Works with both Adobe Stock and Freepik formats
- ✅ Respects platform-specific keyword limits

---

## Testing Your Metadata

After generation, verify:

1. **Title Check**:
   - [ ] Specific and descriptive
   - [ ] Contains primary keyword
   - [ ] Under 70 characters
   - [ ] Sentence case

2. **Description Check**:
   - [ ] 150-200 characters
   - [ ] Natural language flow
   - [ ] Includes 2-3 keywords naturally
   - [ ] No hashtags/quotes

3. **Keywords Check**:
   - [ ] Mix of 2-4 word phrases and single words
   - [ ] Most relevant/specific first
   - [ ] Within platform limit (10-15)
   - [ ] No weak generic terms

4. **Mood & Use Check**:
   - [ ] Mood is specific descriptor
   - [ ] Suggested_use is actionable/specific
   - [ ] Both match image content

---

## Future Enhancements

Potential additions for even better SEO:
- Seasonal keyword detection
- Trend-based keyword suggestion
- Visual element recognition (colors, styles)
- Category-specific optimization
- A/B testing framework for metadata variants
- Integration with platform search analytics

---

## References

- [Adobe Stock Guidelines](https://helpx.adobe.com/en/stock/contributor/help/metadata-keywords.html)
- [Stock Photography SEO Best Practices](https://blog.adobe.com/en/topics/stock.html)
- General Stock Image Discovery Patterns

