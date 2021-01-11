#include "hpi.h"
#include "file.h"

#undef NDEBUG
#include <algorithm>
#include <cassert>
#include <deque>
#include <iostream>

#include "zlib.h"

TAHPIFile::TAHPIFile(const std::string &filename)
    : file(std::ifstream(filename, std::ios::binary)), key(0)
{
  assert(file.is_open());
  readDirectory();
}

auto TAHPIFile::Files() const -> std::vector<std::string>
{
  std::vector<std::string> result;
  for (auto [name, entry] : entries)
    result.push_back(name);
  return result;
}

void decrypt(char *data, std::size_t offset, std::uint32_t size, std::uint32_t key)
{
  for (auto i = 0; i < size; ++i)
  {
    auto tkey = (offset + i) ^ key;
    data[i] = tkey ^ ~data[i];
  }
}

bool readAndDecrypt(std::ifstream &file, char *data, std::size_t offset, std::uint32_t size, std::uint32_t key)
{
  file.seekg(offset, file.beg);
  assert(!file.fail());
  file.read(data, size);
  assert(!file.fail());
  if (key)
    decrypt(data, offset, size, key);
  return true;
}

void TAHPIFile::readDirectory()
{

  std::uint32_t hHPIMarker, hSaveMarker, hDirectorySize, hHeaderKey, hStart;

  assert(read(file, &hHPIMarker));
  assert(read(file, &hSaveMarker));
  assert(read(file, &hDirectorySize));
  assert(read(file, &hHeaderKey));
  assert(read(file, &hStart));

  assert(hHPIMarker == 0x49504148);

  auto directory = std::string(hDirectorySize, '\0');

  file.read(directory.data() + hStart, hDirectorySize - hStart);

  if (hHeaderKey)
  {
    key = ~((hHeaderKey << 2) | (hHeaderKey >> 6));

    for (auto i = hStart; i < hDirectorySize; ++i)
    {
      auto tkey = i ^ key;
      directory[i] = tkey ^ ~directory[i];
    }
  }


  using node_t = std::pair<std::size_t, std::string>;
  auto fringe = std::deque<node_t>{{hStart, ""}};

  while (!fringe.empty())
  {
    auto [offset, path] = fringe.front();
    fringe.pop_front();

    std::uint32_t hCount, hOffset;
    assert(read(directory, &hCount, offset));
    assert(read(directory, &hOffset, offset + 4));

    for (std::uint32_t i = 0; i < hCount; ++i)
    {
      std::uint32_t hNameOffset, hDirDataOffset;
      std::uint8_t hFlag;
      assert(read(directory, &hNameOffset, hOffset + i * 9));
      assert(read(directory, &hDirDataOffset, hOffset + i * 9 + 4));
      assert(read(directory, &hFlag, hOffset + i * 9 + 8));

      std::string hName = path;
      assert(read(directory, &hName, hNameOffset));

      if (hFlag)
        fringe.emplace_back(hDirDataOffset, hName + "/");
      else
      {
        std::uint32_t hDataOffset, hFileSize;
        std::uint8_t hFlag;
        assert(read(directory, &hDataOffset, hDirDataOffset));
        assert(read(directory, &hFileSize, hDirDataOffset + 4));
        assert(read(directory, &hFlag, hDirDataOffset + 8));
        std::transform(hName.begin(), hName.end(), hName.begin(), [](auto ch) { return std::tolower(ch); });
        entries[hName] = {hDataOffset, hFileSize, hFlag};
      }
    }
  }
}

void decompressLZ77(char *data, char *target, std::size_t length)
{
  char Window[4096];
  int outbufptr = 1;
  int mask = 1;
  auto tag = *data++;

  while (true)
  {
    if ((mask & tag) == 0)
    {
      *target++ = Window[outbufptr] = *data++;
      outbufptr = (outbufptr + 1) & 0xFFF;
    }
    else
    {
      auto count = *((std::uint16_t *)(data));
      data += 2;
      auto inbufptr = count >> 4;
      if (inbufptr == 0)
        return;
      else
      {
        count = (count & 0x0f) + 2;
        if (count >= 0)
        {
          for (std::uint16_t i = 0; i < count; i++)
          {
            *target++ = Window[inbufptr];
            Window[outbufptr] = Window[inbufptr];
            inbufptr = (inbufptr + 1) & 0xFFF;
            outbufptr = (outbufptr + 1) & 0xFFF;
          }
        }
      }
    }
    mask *= 2;
    if (mask & 0x0100)
    {
      mask = 1;
      tag = *data++;
    }
  }
}

void decompressZLIB(char *data, char *target, std::size_t length)
{
  z_stream infstream;
  infstream.zalloc = Z_NULL;
  infstream.zfree = Z_NULL;
  infstream.opaque = Z_NULL;
  infstream.avail_in = length;
  infstream.next_in = (Bytef *)data;
  infstream.avail_out = 65536;
  infstream.next_out = (Bytef *)target;
  inflateInit(&infstream);
  inflate(&infstream, Z_NO_FLUSH);
  inflateEnd(&infstream);
}

auto TAHPIFile::ReadFile(const std::string &name) -> std::string
{
  auto entry = entries[name];
  auto result = std::string(entry.file_size, '\0');

  if (entry.flag == 0 /* uncompressed */)
  {
    read(file, &result);
  }
  else
  {
    auto chunks = entry.file_size >> 16;
    if ((entry.file_size % 65536) != 0)
      ++chunks;

    auto sizes = std::vector<std::uint32_t>(chunks);
    auto offset = entry.offset;
    assert(
        readAndDecrypt(file, reinterpret_cast<char *>(sizes.data()), offset, chunks * 4, key));
    offset += chunks * 4;

    std::size_t resultOffset = 0;
    for (auto size : sizes)
    {
      std::string buffer(size, '\0');
      readAndDecrypt(file, buffer.data(), offset, size, key);
      offset += size;

      std::uint32_t hMarker, hCompressedSize, hDecompressedSize, hChecksum;
      std::uint8_t hUnknown1, hCompMethod, hEncrypt;
      assert(read(buffer, &hMarker, 0));
      assert(read(buffer, &hUnknown1, 4));
      assert(read(buffer, &hCompMethod, 5));
      assert(read(buffer, &hEncrypt, 6));
      assert(read(buffer, &hCompressedSize, 7));
      assert(read(buffer, &hDecompressedSize, 11));
      assert(read(buffer, &hChecksum, 15));
      assert(hMarker == 0x48535153);

      std::uint32_t checksum = 0;
      for (auto i = 19; i < size; ++i)
        checksum += (buffer[i] & 0xFF);
      assert(hChecksum == checksum);

      assert(hCompressedSize + 19 <= size);
      if (hEncrypt)
      {
        for (auto i = 0; i < hCompressedSize; ++i)
          buffer[i + 19] = (buffer[i + 19] - i) ^ i;
        if (hCompMethod == 1)
          decompressLZ77(buffer.data() + 19, result.data() + resultOffset, hCompressedSize);
        else if (hCompMethod == 2)
          decompressZLIB(buffer.data() + 19, result.data() + resultOffset, hCompressedSize);
        else throw std::runtime_error("Unknown compression method");
      }
      resultOffset += 65536;
    }
  }

  return result;
}