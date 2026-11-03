# Unit reference sheets

One Markdown reference sheet per unit subsection, built once from that week's worksheets.
Everything downstream (homework help, extra practice, study guides, Unit Lessons content)
works from these sheets, so the PDFs only need to be read once.

```
content/units/
  unit-2/
    README.md        unit overview: subsections, how they connect, test info
    2.1.md           one reference sheet per subsection
    2.4.md
    study-guide.md   built from the subsection sheets before a test
  unit-3/
    ...
```

## Rules
- **Never commit the PDFs.** This repo is public. Worksheets are publisher material and may carry names.
  Upload them in the Claude chat instead.
- **No names** of the student, the teacher, or the school.
- **Don't copy problems word for word.** Record each problem's *shape* (what's given, what's asked,
  the number ranges) and write new variants. The answers to the actual worksheet are never written down.
- Start from `TEMPLATE.md`.

## Weekly workflow
1. Upload the week's PDFs to a Claude session and say which subsections they cover.
2. Claude writes or updates `unit-N/<sub>.md` from the template, and commits it.
3. During the week: "help with 3.2 #5" gets guiding questions from that sheet, never the answer.
4. Before a test: "build the Unit 3 study guide" builds `study-guide.md` from the sheets.
