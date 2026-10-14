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
* Width/height use visible bounds, including stroke where applicable.
* Extension-line and dimension-line overrun is 6 pt each; 45-degree ticks are 1 pt,
  dimension and extension lines 0.5 pt. The panel uses 10 pt labels.
* This prototype is not code-signed. Only enable developer mode on a trusted machine.
* No automatic update, persistent tool cursor, or two-click point-picking yet.
* Scale is kept in the panel; save-scale metadata is best-effort, not a guarantee of
  reopening the document with the same selected scale.
