#include "file.h"

#include <fstream>

void write_file(const fs::path &filename, const std::string &data)
{
  auto pathname = filename.parent_path();
  if (!fs::exists(pathname))
    assert(fs::create_directories(pathname));

  auto out = std::ofstream{filename, std::ios::binary | std::ios::trunc};
  assert(out.is_open());
  out.write(data.data(), data.size());
  assert(!out.fail());
  out.close();
}

bool read(const std::string &in, std::string *target, std::uint32_t offset)
{
  assert(target);

  for (auto i = offset; i < in.size() && in[i] != '\0'; ++i)
  {
    target->push_back(in[i]);
  }
  return true;
}
