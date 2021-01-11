#include "file.h"
#include "hpi.h"

#undef NDEBUG

#include <cassert>
#include <filesystem>
#include <iostream>
#include <regex>
#include <string>
#include <tuple>
#include <vector>

#include <cxxopts.hpp>

namespace fs = std::filesystem;

void list(std::string filename, fs::path path, const std::regex& pattern, bool verbose)
{
    auto hpi = TAHPIFile(filename);
    for (auto&& name : hpi.Files())
        if (std::regex_match(name, pattern)) std::cout << name << std::endl;
}

void extract(std::string filename, fs::path path, const std::regex& pattern, bool verbose)
{
    auto hpi = TAHPIFile(filename);
    for (auto&& name : hpi.Files())
        if (std::regex_match(name, pattern)) {
            auto file = fs::weakly_canonical(path / name);
            auto data = hpi.ReadFile(name);
            write_file(file, data);
        }
}

void verify(std::string filename, fs::path path, const std::regex& pattern, bool verbose)
{
    auto hpi = TAHPIFile(filename);
    for (auto&& name : hpi.Files())
        if (std::regex_match(name, pattern)) {
            auto file = fs::weakly_canonical(path / name);
            auto data = hpi.ReadFile(name);
            write_file(file, data);
        }
}

int main(int argc, char* argv[])
{

    cxxopts::Options options("ta-hpi",
                             "List, eXtract or Verify hpi files.");
    // clang-format off
    options.add_options()
      ("h,help", "Display this information")
      ("x", "Extract files")
      ("t", "Test file integrity")
      ("l", "List files in archive")
      ("d,destination", "Create files in directory",
        cxxopts::value<std::string>()->default_value(fs::current_path()))
      ("f,filter", "Filter entries using a regex filter. (i.e. -f '.*\\.gaf'",
        cxxopts::value<std::string>()->default_value(".*"))
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
    auto filter      = result["filter"].as<std::string>();
    auto pattern     = std::regex{filter};
    auto destination = result["destination"].as<std::string>();
    auto command     = result.count("l") ? list :
                       result.count("x") ? extract :
                       result.count("t") ? verify :
                                           extract;

    auto files = result["files"].as<std::vector<std::string>>();
    for (auto file : files) command(file, destination, pattern, verbose);

    return 0;
}
