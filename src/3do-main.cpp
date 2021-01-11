#include "file.h"

#include <cstdio>
#include <deque>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <tuple>
#include <vector>

const char *usage = R"(
Usage: ta3do [options] <file>

Options:

  -h, --help    Display this information.
  -o <file>     Write to <file> instead of stdout.
  -t            Test file integrity.
  -v, --verbose Verbose mode
)";

void extract(const std::string &buffer, std::ostream &out)
{
  const auto scale = 1 / 65536.0;

  using vertex_t = std::tuple<double, double, double>;
  auto vertexes = std::vector<vertex_t> {};

  using node_t = std::tuple<std::size_t, double, double, double>;
  auto fringe = std::deque<node_t>{{0, 0, 0, 0}};

  while (!fringe.empty())
  {
    auto [offset, x0, y0, z0] = fringe.front();
    fringe.pop_front();
    out << std::fixed;
    out << std::setprecision(2);

    auto hVersionSignature = read<std::uint32_t>(buffer, offset + 0);
    auto hNumberOfVertexes = read<std::uint32_t>(buffer, offset + 4);
    auto hNumberOfPrimitives = read<std::uint32_t>(buffer, offset + 8);
    auto hOffsetToselectionPrimitive = read<std::int32_t>(buffer, offset + 12);
    auto hXFromParent = read<std::int32_t>(buffer, offset + 16);
    auto hYFromParent = read<std::int32_t>(buffer, offset + 20);
    auto hZFromParent = read<std::int32_t>(buffer, offset + 24);
    auto hOffsetToObjectName = read<std::uint32_t>(buffer, offset + 28);
    auto hAlways_0 = read<std::uint32_t>(buffer, offset + 32);
    auto hOffsetToVertexArray = read<std::uint32_t>(buffer, offset + 36);
    auto hOffsetToPrimitiveArray = read<std::uint32_t>(buffer, offset + 40);
    auto hOffsetToSiblingObject = read<std::uint32_t>(buffer, offset + 44);
    auto hOffsetToChildObject = read<std::uint32_t>(buffer, offset + 48);

    // std::cout << OffsetToselectionPrimitive << std::endl; 

    auto hObjectName = std::string{};
    read(buffer, &hObjectName, hOffsetToObjectName);
    out << "o " << hObjectName << "\n";

    out << "# t " << hXFromParent * scale << " " << hYFromParent * scale << " " << hZFromParent * scale << "\n";
    auto vOffset = vertexes.size();
    for (int i = 0; i < hNumberOfVertexes; ++i)
    {
      auto x = read<std::int32_t>(buffer, hOffsetToVertexArray + i * 12) * scale;
      auto y = read<std::int32_t>(buffer, hOffsetToVertexArray + i * 12 + 4) * scale;
      auto z = read<std::int32_t>(buffer, hOffsetToVertexArray + i * 12 + 8) * scale;

      out << "v " << x << " " << y << " " << z << "\n";
      vertexes.emplace_back(x, y, z);
    }

    for (int i = 0; i < hNumberOfPrimitives; ++i)
    {
      if (i == hOffsetToselectionPrimitive) continue;
      auto hColorIndex = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 0);
      auto hNumberOfVertexIndexes = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 4);
      auto hAlways_0 = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 8);
      auto hOffsetToVertexIndexArray = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 12);
      auto hOffsetToTextureName = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 16);
      auto hUnknown_1 = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 20);
      auto hUnknown_2 = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 24);
      auto hIsColored = read<std::uint32_t>(buffer, hOffsetToPrimitiveArray + i * 8 * 4 + 28);

      if (hOffsetToTextureName > 0)
      {
        std::string texture;
        read(buffer, &texture, hOffsetToTextureName);
        std::cout << texture << std::endl;
      }

      if (hNumberOfVertexIndexes == 2)  out << "l ";
      else if (hNumberOfVertexIndexes >= 3) out << "f ";
      else continue;
      for (int j = 0;j < hNumberOfVertexIndexes;++j)
      {
        out << read<std::uint16_t>(buffer, hOffsetToVertexIndexArray + j * 2)+1+vOffset << " ";
      }
      out << "\n";
    }

    if (hOffsetToSiblingObject > 0)
      fringe.emplace_front(hOffsetToSiblingObject, x0, y0, z0);
    if (hOffsetToChildObject > 0)
      fringe.emplace_front(hOffsetToChildObject, x0 + hXFromParent*scale, y0 + hYFromParent*scale, z0 + hZFromParent*scale);
  }
}

void verify()
{
}


int main(int argc, char *argv[])
{

  if (argc <= 1)
  {
    std::printf(usage);
    return 0;
  }

  auto path = fs::current_path();
  auto command = extract;
  std::ofstream file;
  auto verbose = false;
  auto buffer = std::string();
  std::ostream *out = &std::cout;

  for (int i = 1; i < argc; ++i)
  {
    auto arg = std::string{argv[i]};
    if (!arg.starts_with("-"))
    {
      auto in = std::ifstream(arg, std::ios::binary);
      buffer = {
          std::istreambuf_iterator<char>(in),
          {}};
    }
    // else if (arg == "-t" || arg == "--verify")
    //   command = verify;
    else if (arg == "-v" || arg == "--verbose")
      verbose = true;
    else if (arg.starts_with("-o"))
    {
      if (arg.size() > 2)
        path = path / arg.substr(2);
      else if (i + 1 < argc)
        path = path / argv[++i];
      else
        throw std::runtime_error("Missing filename after -o!");
      file.open(path, std::ios::binary | std::ios::out | std::ios::trunc);
      assert(file.is_open());
      out = &file;
    }
  }

  command(buffer, *out);

  return 0;
}
