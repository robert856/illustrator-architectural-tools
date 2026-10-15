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

HOW TO USE
Select drawing scale. Rectangle: enter actual dimensions in inches (e.g. 36, 34 1/2)
and click Create scaled rectangle. It is created near the top left of the current artboard.
Dimension: select one object and click Dimension selected width or height; or select
an open straight two-anchor path and click Dimension selected straight line.
The source and new dimensions are grouped on the source's layer. Move the group
with the Selection tool (V) to keep dimensions with the artwork. Leave the group
selected to add width/height dimensions; only the source artwork is measured.
Direct Selection (A) can move the source independently. Ungrouping breaks the
shared movement. Existing dimensions made by the original version remain separate;
delete those dimensions and recreate them to use grouping.

TWO-POINT DIMENSIONS
Use Direct Selection (A). Deselect first, click one anchor, then Shift-click a
second anchor on the same or another object. Exactly two anchors must be selected;
selecting an entire rectangle selects too many. Choose a point dimension placement
(Horizontal below/above, Vertical right/left, or Aligned side 1/2), set the paper
space offset, then click "Dimension two selected anchors". Horizontal/vertical
measure the projected distance; Aligned measures the direct distance.
Aligned side 1 is the left normal when reading from the leftmost point to the
rightmost (bottom to top for a vertical pair); side 2 is the opposite side.
Repeat with other pairs to create multiple independent dimensions.
Select a point dimension group, change the offset and click Apply offset to
redraw it on its original side at its original scale. The reposition dropdown
is ignored when an individual dimension is selected.

CHAIN DIMENSIONS (FURNITURE BREAKPOINTS)
With Direct Selection (A), Shift-select three or more anchor breakpoints, including
anchors from different objects. For crown/cabinet/base heights, choose Vertical
right or left; for a row of widths choose Horizontal above or below. Set the
offset and click "Chain dimensions from 3+ anchors". Points are sorted by height
or width, regardless of selection order. Each adjacent pair gets a dimension;
all segments share one baseline outside the selected points. With four selected
heights, you get three consecutive dimensions. Select one anchor at each height;
duplicate heights (or duplicate width positions for horizontal chains) are rejected.
The chain is grouped so its annotations can be moved together. Select an individual
segment inside the chain to Apply offset; changing that segment's offset can
separate it from the common baseline. To reposition the whole chain while keeping
its extension origins fixed, delete/recreate it with the new offset.

Point and chain dimensions are separate annotations, NOT live attachments to
source objects. The panel does not regroup or move either source object. Moving
or resizing source objects requires deleting/recreating these annotations.
No native canvas click-click-drag tool is registered by this CEP panel.

DIMENSION PLACEMENT
Width dimensions sit below the source; height dimensions sit to its right.
Labels are centered on the dimension line with a white background and 3 pt padding.
To reposition: select the dimensioned group, choose Width/Height/Straight line in
"Dimension to reposition", enter a positive paper-space offset in inches, then
click "Apply offset to existing dimension". Larger values move farther away.
The source stays in place and extension lines are redrawn to the new offset.
Alternatively, select one dimension group or its label/line inside the assembly
(using Illustrator's group isolation or Layers panel); Apply offset updates that
specific dimension regardless of the dropdown. Leave the source and dimension
in their assembly so moving the assembly still moves everything together.
If multiple dimensions share the chosen mode, select the specific dimension.
Older dimensions must be deleted and recreated once with this updated panel.
Reposition uses the dimension's original drawing scale and current source bounds.

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
