#include "file.h"
#include "hpi.h"
#include "3do.h"
#include "cob.h"

#include <cassert>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <regex>
#include <string>
#include <tuple>
#include <vector>

#include <cxxopts.hpp>

namespace fs = std::filesystem;

int ta_hpi_ls(TAHPIFile &hpi, const std::vector<std::string> &files)
{
  for (auto name : files)
    std::cout << name << std::endl;
  return 0;
}

int ta_hpi_extract(TAHPIFile &hpi, const std::vector<std::string> &files, const fs::path &destination)
{
  for (auto name : files)
  {
    auto path = fs::weakly_canonical(destination / name);
    write_file(path, hpi.ReadFile(name));
  }
  return 0;
}

int ta_3do_export(TAHPIFile &hpi, const std::vector<std::string> &files, const fs::path &destination)
{
  for (auto name : files)
  {
    auto file = TA3DOFile(hpi.ReadFile(name));

    auto filename = fs::weakly_canonical(destination / name);
    filename.replace_extension(".dae");

    auto pathname = filename.parent_path();
    if (!fs::exists(pathname))
      assert(fs::create_directories(pathname));

    auto out = std::ofstream{filename, std::ios::binary | std::ios::trunc};
    assert(out.is_open());
    file.ExportToCollada(out);
    assert(!out.fail());
    out.close();
  }
  return 0;
}

int ta_cob_export(TAHPIFile &hpi, const std::vector<std::string> &files, const fs::path &destination, std::string format)
{
  if (format.empty()) format = "python";

  auto extension = std::string{};
  if (format == "python") extension = ".py";
  else throw std::runtime_error("Unknown export format");

  for (auto name : files)
  {
    auto file = TACOBFile(hpi.ReadFile(name));

    auto filename = fs::weakly_canonical(destination / name);
    filename.replace_extension(".py");

    auto pathname = filename.parent_path();
    if (!fs::exists(pathname))
      assert(fs::create_directories(pathname));

    auto out = std::ofstream{filename, std::ios::binary | std::ios::trunc};
    assert(out.is_open());
    
    if (format == "python")
      file.ExportToPython(out);

    assert(!out.fail());
    out.close();
  }
  return 0;
}



int main(int argc, char *argv[])
{

  auto verbose = false;
  auto group = std::string{};
  auto command = std::string{};
  auto files = std::vector<std::string>{};
  auto destination = fs::current_path();
  auto format = std::string{};

  auto options = cxxopts::Options("ta", "TA swish army knife.");

  // clang-format off
    options.add_options()
      ("h,help", "Display this information")
      ("d,destination", "Create files in directory", cxxopts::value(destination))     
      ("v,verbose", "Verbose mode", cxxopts::value(verbose))
      ("group", "Which group to select", cxxopts::value(group))
      ("command", "Which command to execute", cxxopts::value(command))
      ("files", "Files to process", cxxopts::value(files))
      ("format", "Export format", cxxopts::value(format));
    
    ;
  // clang-format on

  options.parse_positional({"group", "command", "files"});

  try
  {

    auto result = options.parse(argc, argv);

    if (result.count("help"))
    {
      std::cout << options.help() << std::endl;
      return 0;
    }

    destination = fs::weakly_canonical(destination);

    auto hpi = TAHPIFile{};

    auto filters = std::vector<std::regex>{std::regex(".*")};

    for (auto file : files)
      if (file.ends_with(".hpi"))
        hpi.LoadArchive(file);
      else
        filters.emplace_back(file);

    auto entries = std::vector<std::string>{};
    for (auto name : hpi.Files())
      if (std::all_of(filters.begin(), filters.end(), [&name](const auto &filter) {
            return std::regex_match(name, filter);
          }))
      {
        entries.push_back(name);
      }

    if (group == "hpi" && command == "ls")
      return ta_hpi_ls(hpi, entries);

    if (group == "hpi" && command == "extract")
      return ta_hpi_extract(hpi, entries, destination);

    if (group == "3do" && command == "export")
      return ta_3do_export(hpi, entries, destination);

    if (group == "cob" && command == "export")
      return ta_cob_export(hpi, entries, destination, format);
  }
  catch (const std::exception &e)
  {
    std::cerr << e.what() << std::endl;
    return -1;
  }

  return 0;
}
