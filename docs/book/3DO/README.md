Unoffical .3do by Dan Melchione 
Verion 0.9.0
March 5th 1998

Copyright (c)1995 Dan Melchione - All Rights Reserved

You have permission to distrbute this file without charge,
but may not alter it in any way.  This includes copying
the included information for you own description of the
3do file format.  Please if send me any change requests.
Thanks for your cooperation.

The latest version of this document can be found at: 
  http://www.melchione.com/totala/formats/3dofrmt.txt

Question, Comments, Complaints To: dmelchione@melchione.com

.3do files are used by Total Annihilation (designed by Chris Taylor)
for drawing the 3 dimensional objects (hence the extension of .3do).
This document what I have found about the file format so far.

The numbers used in this file are hexadecimal.

The beginning of the file starts with following structure:

typedef struct tagObject
{
    long VersionSignature;
    long NumberOfVertexes
    long NumberOfPrimitives;
    long UnknownFlag;
    long XFromParent;
    long YFromParent;
    long ZFromParent;
    long OffsetToObjectName;
    long Always_0;
    long OffsetToVertexArray;
    long OffsetToPrimitiveArray;
    long OffsetToSiblingObject;
    long OffsetToChildObject;
} Object;

/*
The fields of this structure are:

VersionSignature:
This is field is always one.  I assume that it represents the signature
(which is a somewhat standard thing to do at the beginning of a
structure)

NumberOfVertexes:
This field represents the number of vertexes used by this object.  A
vertex is simply a 3D point.

NumberOfPrimitives:
This field represents the number of primitives used by this object.
A primitive is a simple 3D object like a point, line, triangle, or
quad.

UnknownFlag:
I'm not sure what this field does yet.  It appears to be a flag which
is either 0 or -1.  If anyone has any info on this please let me know.
** Revision:  This flag points to a primitive in the parent object that
              will serve as the "selection" rectangle in TA.  All Child
              and Sibling objects should have this value set to -1.

XFromParent:
YFromParent:
ZFromParent:
This appears to be the location of the object relative to the parent
object.  This first object in a file doesn't have any parents.
It appears to be a fixed-point integer.  I haven't figured out
what the scaling factor is yet.  If anyone has any info, please
let me know.

OffsetToObjectName:
This field is an offset to the name of the object.  The name of the
object is stored as a null terminated string.

Always_0:
This field appears always be zero.  If anyone finds a case where this
is not so, or has any more onfo, please let me know.

OffsetToVertexArray:
This is an offset to an array of vertexes used by this object.  The
number of vertexes in the array is stored above in NumberOfVertexes.

OffsetToPrimitiveArray:
This is an offset to an array of primitives used by this object.  The
number of primitives is stored above in NumberOfPrimitives.

OffsetToSiblingObject:
This is an offset to a sibling object.  A sibling object is an object
which shares the same parent as this object.  The sibling object
structure appears to be identical.  The objects act like a linked
list, terminated by a NULL (offset 00000000)

OffsetToChildObject:
This is an offset to a child object.  A child object is an object
which has the current object as a parent.  The child object
structure appears to be identical. The objects act like a linked
list, terminated by a NULL (offset 00000000)

*/

If we examine the armsy.3do file (the arm shipyard) and overlay the
above structure we end up with the following:

00000000 Object
 01 00 00 00  00000001  VersionSignature
 C4 00 00 00  000000C4  VertexCount
 6D 00 00 00  0000006D  PrimitiveCount
 00 00 00 00  00000000  UnknownFlag
00000010 
 00 00 00 00  00000000  XFromParent
 00 00 00 00  00000000  YFromParent
 00 00 00 00  00000000  ZFromParent
 E5 1A 00 00  00001AE5  OffsetToObjectName (base)
00000020 
 00 00 00 00  00000000  Always_0
 15 04 00 00  00000415  OffsetToVertexArray
 45 0D 00 00  00000D45  OffsetToPrimitiveArray
 00 00 00 00  00000000  OffsetToSiblingObject
00000030               
 EA 1A 00 00  00001AEA  OffsetToChildObject

The object has C4 vertexes (at offset 415), 6D primitives (at offset D45),
the name of the object is base, and it has a child object at offset 00001AEA. 

The child object at 1AEA has the same structure:

00001AEA Object
 01 00 00 00  00000001  VersionSignature
 29 00 00 00  00000029  VertexCount
 25 00 00 00  00000025  PrimitiveCount
 FF FF FF FF  FFFFFFFF  UnknownFlag
00001AFA 
 01 00 CD FF  FFCD0001  XFromParent
 00 40 F7 FF  FFF74000  YFromParent
 00 40 CC FF  FFCC4000  ZFromParent
 DA 22 00 00  000022DD  OffsetToObjectName (turret)
00001B0A 
 00 00 00 00  00000000  Always_0
 4E 1C 00 00  00001C4E  OffsetToVertexArray
 3A 1E 00 00  00001E3A  OffsetToPrimitiveArray
 E2 22 00 00  000022E2  OffsetToSiblingObject
00001B1A               
 00 37 00 00  00003700  OffsetToChildObject

In this case the object has 29 vertexes (at offset 1C4E), 25 primitives
(at offset 1E3A), a sibling object at offset 22E2, and a child object
at offset 3700.

If you repeat following the sibling and child object nodes you end
up with the following tree of objects:
    base
      turret1
        nano1
          beam1
      turret2
        nano2
          beam2
      slip
      light
      explode
      explode1
      explode2

We find that a number of the objects (for example slip) have only one 
vertex and no primitives.  I haven't figured out exactly what this
is for, but I would guess it is used for scripting (for example where
to target the nanobeams), and when exploding to have additional debris.
Again, anyone with info, please feel free to comment.

00002ADA 
 01 00 00 00  00000001  VersionSignature
 01 00 00 00  00000001  VertexCount
 00 00 00 00  00000000  PrimitiveCount
 FF FF FF FF  FFFFFFFF  UnknownFlag
00002AEA 
 00 00 00 00  00000000  XFromParent
 00 40 F7 FF  FFF74000  YFromParent
 00 00 00 00  00000000  ZFromParent
 1A 2B 00 00  00002B1A  OffsetToObjectName (slip)
00002AFA 
 00 00 00 00  00000000  Always_0
 0E 2B 00 00  00002B0E  OffsetToVertexArray
 1A 2B 00 00  00002B1A  OffsetToPrimitiveArray
 1F 2B 00 00  00002B1F  OffsetToSiblingObject
00002B0A               
 00 00 00 00  00000000  OffsetToChildObject

In cavedog created .3do files a list of texture names always appear
to be stored at offset 00000034 (more on this later):

From armysy.3d0:

char TextureNameArray[][];

00000034 TextureNameArray 
         * Pointed to by OffsetToTextureName in PrimitiveArray
         * Always at offset 34 for cavedog units
 6E 6F 69 73 65 36 62 00 41 72 6D 34 62 00 41 72 noise6b.Arm4b.Ar
 6D 42 75 69 32 62 00 41 72 6D 56 33 62 00 67 72 mBui2b.ArmV3b.gr
 61 79 6E 6F 69 73 65 33 00 6E 6F 69 73 65 32 62 aynoise3.noise2b
 00 41 72 6D 70 61 6E 65 6C 31 00 33 32 58 47 6F .Armpanel1.32XGo
 75 72 61 75 64 00 6E 6F 69 73 65 36 61 00 66 6C uraud.noise6a.fl
 61 73 68 69 6E 67 30 32 00 6D 65 74 61 6C 33 63 ashing02.metal3c
 00 6D 65 74 61 6C 33 61 00 6D 65 74 61 6C 33 62 .metal3a.metal3b
 00                                              .

In cavedog created .3do files after the texture names appears to be a 
list of vertex indexes (more on this later)

short VertexIndexArray[];

000000A5 VertexIndexArray
         * Pointed to by OffsetToVertexIndexArray in PrimitiveArray
 C0 00 
 C3 00 
 C1 00 
 C2 00 
 B9 00 
 B8 00 
 BB 00 
 BA 00
000000B5 
 ...
00000405 
 06 00 
 0E 00 
 0F 00 
 07 00 
 08 00 
 00 00 
 07 00 
 0F 00

In cavedog created .3do files after the vertex indexes appears to be
the vertexes themselves.  These vertexes are pointed to in the Object
structure (above) by the OffsetToVertexArray field.  The format
appears to be the following:

typedef struct tagVertex
{
    long x;
    long y;
    long z;
} Vertex;

Vertex VertexArray[];

00000415 
 6D 9A D0 FF VertexArray[0].x
 00 40 F7 FF VertexArray[0].y
 7B 59 32 00 VertexArray[0].z
 AD 98 CF FF VertexArray[1].x
00000425 
 ...         ...
00000535 
 6C DA C3 FF VertexArray[C2].z
 00 C0 0D 00 VertexArray[C3].y
 7B 19 2A 00 VertexArray[C3].x
 6C 5A D7 FF VertexArray[C3].z

In cavedog created .3do files after the vertexes appears to be
the array of primitives.  These primitives are pointed to in the Object
structure (above) by the OffsetToPrimitiveArray field.  The format
appears to be the following:

typedef struct tagPrimitive
{
    long Unknown_0;
    long NumberOfVertexIndexes;
    long Always_0;
    long OffsetToVertexIndexArray;
    long OffsetToTextureName;
    long Unknown_1;
    long Unknown_2;
    long Unknown_3;    
} Primitive;

/* 
Unknown_0:
  Not sure what this does yet
** Revision: Probably a primitive color flag.

NumberOfVertexIndexes:
  This indicates the number of vertexes used by the primitive as well 
  as the primitive type (example: 1 = point, 2 = line, 3 = triangle,
  4 = quad)

Always_0:
  This field always appears to be 0.

OffsetToVertexIndexArray:
  This points to a an array of shorts which are indexes into the objects
  vertex array.  This allows multiple primitives to share the same
  vertexes.

OffsetToTextureName:
  This points to a null terminated string which indicates which texture
  to use for this primtive.  A value of 0 probably means no texture.

Unknown_1:
Unknown_2:
Unknown_3:
  I'm not sure what this is used for yet.  In some files these fields
  appear to be filled with garbage and thus may not always be used.

  I haven't figure this out yet, but somewhere in this structure should
  be some the color for non texture mapped primitives, as well as
  some kind of texture mapping coordinates for primitives with texture
  maps.
** Revision:  These are Cavedog-specific used for their editor, and are 
              not needed.  Always set to 0.

*/

From armsy.3d0:
00000D45 PrimitiveArray
         * Pointed to by OffsetToPrimitiveArray in Header
00000D45 
 00 00 00 00 Unknown_0
 04 00 00 00 NumberOfVertexIndexes
 00 00 00 00 Always_0
 A5 00 00 00 OffsetToVertexIndexArray
 00 00 00 00 OffsetToTextureName
 00 00 00 00 Unknown_0
 00 00 00 00 Unknown_1
 01 00 00 00 Unknown_2
00000D65 
...          ...
00001AC5 
 00 00 00 00 Unknown_0
 04 00 00 00 NumberOfVertexIndexes
 00 00 00 00 Always_0
 0D 04 00 00 OffsetToVertexIndexArray
 52 00 00 00 OffsetToTextureName
 00 00 00 00 Unknown_0
 00 00 00 00 Unknown_1
 00 00 00 00 Unknown_2

In cavedog created .3do files after the pritives appears more objects,
texture names, etc.  By following the linked lists in the Object 
structures you can map out the entire file.

You may notice that there is no animation data stored in these files.
This is because the animation data is stored in .bos (basic object script?)
files which are compiled into .cob (cobble) files.  I haven't started
looking at these yet, so if anyone has any useful infomation please
let me know.

Well thats it for now, check back for updates.  Let me know what
you find so we can share the wealth.

Dan Melchione
dmelchione@melchione.com
