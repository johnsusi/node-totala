#include "file.h"

#include <cassert>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

#include <cxxopts.hpp>

namespace fs = std::filesystem;

void extract(const std::string& filename, bool verbose)
{
  auto file = std::ifstream(filename, std::ios::binary);
  assert(file.is_open());
  auto buffer = std::string {
    std::istreambuf_iterator<char>(file),
    {}
  };

  auto hVersionSignature = read<std::uint32_t>(buffer, 0);
  auto hNumberOfScripts = read<std::uint32_t>(buffer, 4);
  auto hNumberOfPieces = read<std::uint32_t>(buffer, 8);
  auto hNumberOfCodes = read<std::uint32_t>(buffer, 12);
  auto hUnknown_1 = read<std::uint32_t>(buffer, 16);
  auto hUnknown_2 = read<std::uint32_t>(buffer, 20);
  auto hOffsetToScriptCodeIndexArray = read<std::uint32_t>(buffer, 24);
  auto hOffsetToScriptNameOffsetArray = read<std::uint32_t>(buffer, 28);
  auto hOffsetToPieceNameOffsetArray = read<std::uint32_t>(buffer, 32);
  auto hOffsetToScriptCode = read<std::uint32_t>(buffer, 36);
  auto hOffsetToScriptNames = read<std::uint32_t>(buffer, 40);

  auto scriptNames = std::vector<std::string>();
  auto scriptOffsets = std::vector<std::uint32_t>();

  std::cout << hUnknown_1 << std::endl;
  std::cout << hUnknown_2 << std::endl;

  for (int i = 0;i < hNumberOfScripts;++i)
  {
    auto offset = read<std::uint32_t>(buffer, hOffsetToScriptNameOffsetArray+i*4);
    std::string s;
    read(buffer, &s, offset);
    scriptNames.push_back(s);
    scriptOffsets.push_back(read<std::uint32_t>(buffer, hOffsetToScriptCodeIndexArray+i*4));
  }

  auto pieceNames = std::vector<std::string>();

  for (int i = 0;i < hNumberOfPieces;++i)
  {
    auto offset = read<std::uint32_t>(buffer, hOffsetToPieceNameOffsetArray+i*4);
    std::string s;
    read(buffer, &s, offset);
    pieceNames.push_back(s);
  }

  std::cout << hOffsetToScriptCode << std::endl;
  std::cout << hOffsetToScriptNames << std::endl;
  std::cout << hOffsetToScriptCodeIndexArray << std::endl;
  std::cout << hOffsetToScriptNameOffsetArray << std::endl;
  std::cout << hOffsetToPieceNameOffsetArray << std::endl;
  std::cout << hOffsetToScriptNames - hOffsetToScriptCode << std::endl;
  auto it = reinterpret_cast<std::uint32_t*>(buffer.data() + hOffsetToScriptCode);

  auto code = std::vector<std::uint32_t> {
    it,
    it + hNumberOfCodes
  };

  std::cout << code.size() << std::endl;
  std::cout << "---\n";


  for (int i = 0;i < code.size();++i)
    std::cout << std::hex << i << ": " << code[i] << std::endl;
  std::cout << "---\n";

  for (int i = 0;i < hNumberOfScripts;++i)
    std::cout << scriptOffsets[i] << ": " << scriptNames[i] << std::endl;

}

int main(int argc, char* argv[])
{

    cxxopts::Options options("ta-cob",
                             "");
    // clang-format off
    options.add_options()
      ("h,help", "Display this information")
      ("v,verbose", "Verbose mode",
        cxxopts::value<bool>()->default_value("false"))
      ("files", "Files to process",
        cxxopts::value<std::vector<std::string>>());
    // clang-format on

    options.parse_positional({"files"});

    auto result = options.parse(argc, argv);

    if (result.count("help")) {
        std::cout << options.help() << std::endl;
        return 0;
    }

    auto verbose     = result["verbose"].as<bool>();
    auto files = result["files"].as<std::vector<std::string>>();
    for (auto file : files) extract(file, verbose);

    return 0;
}
