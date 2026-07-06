# Attribution

The SVG body illustration and the per-muscle `<g>` path components in
`MuscleMap.tsx` and `muscles/*.tsx` are ported from **workout-cool**:

- Source: https://github.com/Snouzy/workout-cool
- License: MIT
- Copyright (c) 2023 Mathias Bradiceanu

Adaptations made for this project:
- Rewired off `@prisma/client` (`ExerciseAttributeValueEnum`) onto plain
  `MuscleValue` string literals (see `muscleTypes.ts`).
- Removed i18n / `next-safe-action` / daisyui dependencies.
- Restyled selection states to the app's design tokens.

The MIT license text is reproduced below as required.

---

MIT License

Copyright (c) 2023 Mathias Bradiceanu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
