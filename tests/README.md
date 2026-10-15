Run the host-script and panel regression checks with Node.js (no packages required):

    node --test tests/*.test.cjs

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

Placement and reposition acceptance:
- Check width dimensions are below the rectangle, height dimensions are right of it,
  and white label backgrounds hide the line behind horizontal/vertical/diagonal text.
- Apply offsets of 0.6 then 0.15 inches to Width with the assembly selected. Only
  that dimension should move; the source and height dimension should stay put.
- Select a dimension label inside the assembly and apply an offset. Verify its
  dimension alone changes, even if the active tool shows another mode.
- Change the panel scale before repositioning: the original dimension scale should
  still be used. Save/reopen and repeat to check metadata persistence in Illustrator.

Accuracy and clearance acceptance:
- At each drawing scale, create 24 x 34 1/2 and 36 x 34 1/2 inch rectangles.
  Width/height labels should match the inputs without adding stroke thickness.
- Confirm 0.625 pt dimension/extension lines and 1.25 pt ticks are readable.
- Confirm extension lines start 3 pt beyond the visible object stroke, including
  after increasing the rectangle's stroke weight and applying a new offset.
- An offset too small to leave the gap should report an error and preserve artwork.


Two-point and chain desktop acceptance:
- Deselect artwork, use A to click one anchor then Shift-click a second anchor on
  another object. Create each of the six point placements and verify values,
  white label masks, clear gaps and offsets.
- With four furniture height breakpoints selected (one per height, potentially on
  different objects), choose Chain and the right arrow and create a chain. Confirm three
  consecutive dimensions align on a single baseline. Repeat using the left arrow and with
  up/down arrows for horizontal width breakpoints. Neither source object should change parents.
- Create multiple point dimensions, move an annotation group, save/reopen, and
  Apply offset to it. Verify the stored reference points and original scale work.
- Select a single segment inside a chain and Apply offset. Only that segment
  should change. Selecting the whole chain is for moving the annotations together,
  not for applying an offset to every segment.
- Repeat after nesting source paths in groups and compound paths. Only selected
  anchors should count. Combine duplicate chain heights; reject too few distinct levels and zero
  projected distance without leaving partial artwork.
- Confirm native selection and save/reopen behavior in Illustrator; mock tests
  cannot validate these host-specific interactions.


Graphical panel acceptance:
- At 270, 330 and 480 px widths, confirm no horizontal scrolling, readable diagram
  tiles and accessible short labels/tooltips. Tab through controls and activate
  a tile and side with the keyboard; selected tiles/arrows have a blue outline.
- Width permits only up/down; Height only left/right. Chain permits all four and
  starts on the right; Two points also offers Aligned direct-distance mode.
- Use the circular-arrow check after selecting furniture anchors. Three distinct
  levels should display "3 levels -> 2 dimensions", including shared endpoints.
- Check offset +/- precision, Apply offset, collapsed Rectangle inputs, disk/save
  icon and Straight path under More tools & help. Nothing should edit Illustrator
  artwork just from choosing a tile, side or offset.
- Confirm newly created above/left object dimensions preserve that side when using
  Apply offset, including after save/reopen. Existing below/right dimensions should
  still work without new side metadata.
