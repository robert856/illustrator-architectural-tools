ARCHITECTURAL TOOLS — ILLUSTRATOR CEP PANEL (WINDOWS PROTOTYPE)

WHAT THIS IS
A dockable HTML/JavaScript CEP extension panel, not a native C++ toolbar plugin.
This is a development/unsigned prototype. Compatibility depends on your Illustrator version
and whether that version still supports CEP extensions. No installer or signature is included.

INSTALL (WINDOWS)
1. Close Illustrator.
2. Extract the zip. Copy the whole ArchitecturalToolsPanel folder into:
   %APPDATA%\Adobe\CEP\extensions\
   Create the extensions folder if it does not exist.
3. Because this is an unsigned development extension, enable CEP debug mode.
   Open Windows Command Prompt and run:
   reg add "HKCU\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
   reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
4. Restart Illustrator. Find the panel under Window > Extensions (Legacy) > Architectural Tools
   or Window > Extensions > Architectural Tools, depending on your Illustrator version.
5. Dock it in the right-hand panel area.

IF IT DOESN'T APPEAR
Check that the directory contains CSXS\manifest.xml directly (not an extra nested folder).
Check that Illustrator supports CEP / Extensions (Legacy). If your version does not,
this CEP prototype cannot be installed as-is; a UXP or native SDK implementation is needed.

GRAPHICAL PANEL
Choose a diagram tile, a side arrow, then Create dimensions.
- Width: one selected object/group; up/down arrows place it above/below.
- Height: one selected object/group; left/right arrows place it outside that side.
- Two points: use A and Shift-click exactly two anchors, on the same or different
  objects. Side arrows choose horizontal/vertical placement. Toggle Aligned to
  measure direct distance; up/left gives side 1, down/right gives side 2.
- Chain: use A and Shift-click at least three distinct height or width breakpoints.
  Left/right arrows create vertical chains; up/down create horizontal chains.
  Points are sorted; shared levels within 0.01 pt are combined. Three levels give
  two dimensions. For furniture, select bottom, base top, cabinet top, crown top.

The circular-arrow button checks the current selection and shows a compact count,
for example "3 levels -> 2 dimensions". It is an explicit check, not a live count.
Tooltips explain the diagrams; More tools & help contains detailed instructions.
The Offset field is in paper inches. Minus/plus changes it by 0.05 in; it affects
new dimensions only until you click Apply offset. The minimum step value is 0.05.
Invalid or too-small offsets show an error without creating partial artwork.

Select an existing dimension (or its label/line inside its group) and Apply offset
to redraw it at its original scale and side. For an assembly with width and height,
choose Width or Height to identify which to update. If several dimensions share
that mode, select the desired dimension inside the group. To reposition a straight
path dimension, select that dimension inside its group. Apply offset preserves
its side; the side arrows control newly created dimensions.

Rectangle creation is under the collapsible Rectangle section. Enter actual inches
(e.g. 36, 34 1/2) and Create rectangle. It appears near the active artboard's top left.
Save scale to the document using the disk icon next to Scale.
More tools & help also contains Straight path, for an open two-anchor straight path.

MOVEMENT AND EDITING
Width, height and straight-path dimensions are grouped with their source on its
original layer. Move the assembly with Selection (V) to keep them together. Add
another dimension with the assembly selected; only the source geometry is measured.
Direct Selection (A) can move the source independently. Ungrouping breaks shared
movement. Dimensions from the original prototype must be recreated to use grouping.

Point and chain dimensions are separate annotations, not live attachments to
source objects. Moving/resizing source objects requires recreating these annotations.
A chain is grouped so its annotations move together. Select an individual segment
inside that group to Apply offset. Moving only a segment can break alignment.
To change the entire chain's offset while retaining its origins, recreate the chain.

Aligned side 1 is the left normal when reading from the leftmost point to the
rightmost (bottom to top for a vertical pair); side 2 is the opposite side.
Labels have a white background and 3 pt padding. Extension lines begin 3 pt outside
the visible stroke. Width/height measurements exclude stroke thickness.
No native canvas click-click-drag tool is registered by this CEP panel.

UPDATING
Close Illustrator and replace the complete installed ArchitecturalToolsPanel
contents, including the new js/panel.js file, then restart Illustrator.
Do not nest another ArchitecturalToolsPanel folder inside the installed one.

NOTES / LIMITATIONS
* The selected scale is applied to rectangles and dimension readouts. It does NOT
  change Illustrator's built-in rulers, Transform panel, or other drawing tools.
* All measurements are inches. Dimension labels round to nearest 1/16 inch.
* Group movement keeps new dimensions with the source artwork. Resizing or editing
  the source does not recalculate labels or offsets. Ungroup and remove old
  dimension graphics before measuring resized artwork again.
* Width/height measure geometric bounds, excluding stroke thickness.
* Extension-line and dimension-line overrun is 6 pt each; 45-degree ticks are 1.25 pt,
  dimension and extension lines 0.625 pt (half the tick thickness). Extension lines start 3 pt beyond
  the visible object stroke; offsets too small to leave this gap are rejected. The panel uses 10 pt labels.
* This prototype is not code-signed. Only enable developer mode on a trusted machine.
* No automatic update, persistent tool cursor, or two-click point-picking yet.
* Scale is kept in the panel; save-scale metadata is best-effort, not a guarantee of
  reopening the document with the same selected scale.
