export function read_asciiz(buffer : Buffer, offset : number, limit : number = 0) : string {
  if (offset == 0) return;
  let end = offset;
  if (!limit) limit = buffer.length;
  else limit += offset;
  while (end < limit && buffer[end]) ++end;
  return buffer.toString('ascii', offset, end);
}

export function constant(str) : number {
  return  str.charCodeAt(0)        |
         (str.charCodeAt(1) <<  8) |
         (str.charCodeAt(2) << 16) |
         (str.charCodeAt(3) << 24);
}
