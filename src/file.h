#pragma once
#ifndef __TOTALA_FILE_H__
#define __TOTALA_FILE_H__

#include <cassert>
#include <filesystem>
#include <string>

namespace fs = std::filesystem;

bool read(const std::string &in, std::string *target, std::uint32_t offset);
void write_file(const std::filesystem::path &filename, const std::string &data);

template <typename T>
bool read(std::istream &in, T *target)
{
  assert(target);
  in.read((char *)target, sizeof(T));
  return !in.fail();
}

template <typename T>
bool read(std::istream &in, T *target, std::size_t offset)
{
  in.seekg(offset, in.beg);
  return read(in, target);
}

template <typename T>
bool read(const std::string &in, T *target, std::uint32_t offset)
{
  assert(target);
  if (offset < 0 || offset + sizeof(T) > in.size())
    return false;
  *target = *((T *)(in.data() + offset));
  return true;
}

template <typename T>
auto read(const std::string &in, std::uint32_t offset) -> T
{
  assert (offset >= 0 && offset + sizeof(T) < in.size());
  return *((T *)(in.data() + offset));
}

#endif