GAF Format
================================================================================

Header
--------------------------------------------------------------------------------

Offset | Size        | Name    | Type     | Comment         
-------|-------------|---------|----------|-------------------------------------
0      | 4           | ID      | UInt32   | Always 0x00010100
4      | 4           | Entries | Uint32   | Number of entries in this file
8      | 4           | Unknown | ?        | Always 0
12     | 4 × Entries | Offsets | UInt32[] | Array of offsets, one for each entry


Entry
--------------------------------------------------------------------------------

Offset | Size       | Name      | Type       | Comment
-------|------------|-----------|------------|----------------------------------
0      | 2          | Frames    | UInt16     | Number of frames in this entry
2      | 6          | Unknown   | ?          | Always 0x010000
8      | 32         | Name      | String     | Name of the entry
40     | 8 × Frames | FramePtrs | FramePtr[] | Array of offsets

FramePtr
--------------------------------------------------------------------------------

Offset | Size       | Name    | Type     | Comment
-------|------------|---------|----------|--------------------------------------
0      | 4          | Offset  | UInt32   | Offset to Frame
4      | 4          | Unknown | ?        | Varies

Frame
--------------------------------------------------------------------------------

Offset | Size       | Name        | Type     | Comment
-------|------------|-------------|----------|----------------------------------
0      | 2          | Width       | UInt16   |
2      | 2          | Height      | UInt16   |
4      | 2          | XPos        | UInt16   |
6      | 2          | YPos        | UInt16   |
8      | 1          | Unknown     | ?        | Always 9
9      | 1          | Compression | UInt8    |
10     | 2          | Subframes   | UInt16   |
12     | 4          | Unknown     | ?        | Always 0
16     | 4          | Offset      | UInt32   | Offset to pixels or subframes
20     | 4          | Unknown     | ?        | Varies
