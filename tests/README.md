Run the host-script regression checks with Node.js (no packages required):

    node --test tests/dimensions.test.cjs

These use a small Illustrator DOM mock. They do not validate Illustrator's native
selection, stacking, undo, or CEP runtime behavior.

Desktop acceptance check:
1. Install the updated ArchitecturalToolsPanel folder as described in its README.
2. Create a rectangle, add its width dimension, then add its height dimension with
   the resulting group selected. Confirm both measurements describe the rectangle.
3. Use the Selection tool (V) to move the group. Confirm the rectangle, labels,
   and all dimension lines move together. Undo and redo the move.
4. Save/reopen the document and add another dimension with the group selected.
5. Repeat with an open straight two-anchor path and with a source inside a group.
6. Confirm surrounding artwork stays in its original stacking order and layer.
7. Direct-selecting or ungrouping can separate the source from dimensions. Resizing
   does not recalculate measurements; remove old dimensions before measuring again.
