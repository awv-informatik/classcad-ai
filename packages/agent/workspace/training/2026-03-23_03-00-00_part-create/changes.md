# Changes — part.create

## New file: `references/part/create.md` (+81 lines)

Key content:
- partId always 4 in clean session
- Default name "Part", class CC_Part
- 24-node structure tree documented with all sets and default work geometry
- **Critical gotcha: second part.create returns null** — does not clear and recreate
- Default work planes: Top (XY), Front (XZ), Right (YZ)
- structure.root = partId (not AllObjects)
- Working example and related APIs
