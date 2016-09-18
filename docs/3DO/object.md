Offset | Size        | Name       | Type     | Comment         
-------|-------------|------------|----------|-------------------------------------
0      | 4           | Version    | UInt32   | Always 1
4      | 4           | Vertexes   | Uint32   | Number of vertexes
8      | 4           | Primitives | UInt32   | Number of primitives
12     | 4           | ?          | ?        |
16     | 4           | X          | Int32    | X relative to parent
20     | 4           | Y          | Int32    | Y relative to parent
24     | 4           | Z          | Int32    | Z relative to parent
28     | 4           | NamePtr    | UInt32   | Offset to name
32     | 4           | Unknown    | ?        | Always 0
36     | 4           | VertexPtr  | UInt32   | Offset to vertexes
40     | 4           | PrimitivePtr | UInt32 | Offset to primitives
44     | 4           | SiblingPtr | UInt32   | Offset to sibling object
48     | 4           | ChildPtr   | UInt32   | Offset to child object
